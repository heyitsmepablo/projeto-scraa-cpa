"""Orquestrador do pipeline de ETL do DATASUS com extração cirúrgica e telemetria."""

import logging
import time
from datetime import datetime
from typing import Dict, List, Literal, Optional, Set
from sqlalchemy import desc, insert, select
from sqlalchemy.orm import Session

from scripts.shared.logger import log_etl_summary
from scripts.shared.sanitizers import normalize_cnes, normalize_sigtap_code
from .database import (
    DatasusImportacao,
    DatasusSiaPa,
    DatasusSiaTbPa,
    DatasusSihRd,
    DatasusSihTbRd,
    Instituicao,
    PlanoOperativo,
    PlanoOperativoProcedimento,
    Vinculo,
)
from .datasus_client import DatasusClient
from .mapper import filter_and_map_sia_df, filter_and_map_sih_df

logger = logging.getLogger(__name__)


class DatasusEtl:
    """Orquestrador do processo de ETL do DATASUS com filtragem cirúrgica."""

    def __init__(self, session: Session, client: DatasusClient) -> None:
        self.session = session
        self.client = client
        self.cnes_ativos: Set[str] = set()
        self.mapa_pactos: Dict[str, Set[str]] = {}
        self.todos_procedimentos_pactuados: Set[str] = set()

    def carregar_cnes_ativos(self) -> None:
        """Busca no banco e armazena em memória os CNES de instituições ativas."""
        stmt = select(Instituicao.cnes).where(Instituicao.deletadoEm.is_(None))
        result = self.session.execute(stmt)
        self.cnes_ativos = {
            norm for row in result.all() if (norm := normalize_cnes(row[0]))
        }
        logger.info(f"Carregados {len(self.cnes_ativos)} CNES ativos do banco.")

    def carregar_catalogo_pactuado(self) -> None:
        """Carrega os CNES ativos e os procedimentos pactuados em Planos Operativos vigentes."""
        # 1. Garante que todos os CNES ativos estejam carregados
        self.carregar_cnes_ativos()

        # 2. Busca o cruzamento cirúrgico de contratos e planos operativos vigentes
        stmt = (
            select(Instituicao.cnes, PlanoOperativoProcedimento.coProcedimento)
            .join(Vinculo, Vinculo.instituicaoId == Instituicao.id)
            .join(PlanoOperativo, PlanoOperativo.vinculoId == Vinculo.id)
            .join(
                PlanoOperativoProcedimento,
                PlanoOperativoProcedimento.planoOperativoId == PlanoOperativo.id,
            )
            .where(
                Instituicao.deletadoEm.is_(None),
                Vinculo.deletadoEm.is_(None),
                PlanoOperativo.deletadoEm.is_(None),
                PlanoOperativo.vigente.is_(True),
                PlanoOperativoProcedimento.deletadoEm.is_(None),
            )
        )

        rows = self.session.execute(stmt).all()
        self.mapa_pactos = {}
        self.todos_procedimentos_pactuados = set()

        for raw_cnes, raw_proc in rows:
            cnes = normalize_cnes(raw_cnes)
            proc = normalize_sigtap_code(raw_proc)
            if cnes and proc:
                if cnes not in self.mapa_pactos:
                    self.mapa_pactos[cnes] = set()
                self.mapa_pactos[cnes].add(proc)
                self.todos_procedimentos_pactuados.add(proc)

        logger.info(
            f"Catálogo pactuado carregado: {len(self.mapa_pactos)} CNES com "
            f"{len(self.todos_procedimentos_pactuados)} procedimentos pactuados vigentes."
        )

    def get_ultima_competencia_banco(self, sistema: str) -> Optional[str]:
        """Retorna a competência mais recente com status SUCESSO no banco."""
        stmt = (
            select(DatasusImportacao.competencia)
            .where(
                DatasusImportacao.sistemaOrigem == sistema,
                DatasusImportacao.status == "SUCESSO",
            )
            .order_by(desc(DatasusImportacao.competencia))
            .limit(1)
        )
        return self.session.scalars(stmt).first()

    def get_oldest_contract_competencia(self) -> Optional[str]:
        """Busca a competência a partir da data de início do contrato mais antigo ativo."""
        stmt = (
            select(Vinculo.dataInicio)
            .where(Vinculo.deletadoEm.is_(None))
            .order_by(Vinculo.dataInicio.asc())
            .limit(1)
        )
        data = self.session.scalars(stmt).first()
        if data:
            return data.strftime("%Y%m")
        return None

    def get_competencias_a_processar(
        self, sistema: Literal["SIA", "SIH"], uf: str, competencia_inicial: Optional[str]
    ) -> List[str]:
        """Gera a lista de competências (YYYYMM) a processar."""
        latest_ftp = self.client.get_latest_competencia(sistema, uf)
        if not latest_ftp:
            logger.warning(
                f"Não foi possível determinar a última competência no FTP para {sistema} {uf}."
            )
            return []

        start_comp = competencia_inicial

        if not start_comp:
            ultima_db = self.get_ultima_competencia_banco(sistema)
            if not ultima_db:
                oldest_comp = self.get_oldest_contract_competencia()
                if oldest_comp:
                    logger.info(
                        f"Sem histórico no banco para {sistema}. Utilizando competência mais antiga do contrato: {oldest_comp}"
                    )
                    start_comp = oldest_comp
                else:
                    logger.info(
                        f"Sem histórico no banco para {sistema} e sem vínculos. Processando apenas a mais recente: {latest_ftp}"
                    )
                    return [latest_ftp]
            else:
                y = int(ultima_db[:4])
                m = int(ultima_db[4:6])
                m += 1
                if m > 12:
                    m = 1
                    y += 1
                start_comp = f"{y}{m:02d}"

        to_process = []
        try:
            curr_y = int(start_comp[:4])
            curr_m = int(start_comp[4:6])
            end_y = int(latest_ftp[:4])
            end_m = int(latest_ftp[4:6])

            while (curr_y < end_y) or (curr_y == end_y and curr_m <= end_m):
                to_process.append(f"{curr_y}{curr_m:02d}")
                curr_m += 1
                if curr_m > 12:
                    curr_m = 1
                    curr_y += 1
        except Exception as e:
            logger.error(f"Erro ao gerar range de competências: {e}")

        return to_process

    def processar_competencia(
        self,
        sistema: Literal["SIA", "SIH"],
        uf: str,
        competencia: str,
        batch_size: int = 5000,
    ) -> int:
        """Baixa, filtra cirurgicamente e insere os dados de produção do DATASUS."""
        start_time = time.monotonic()

        # Carrega catálogo pactuado se ainda não carregado
        if not self.cnes_ativos or not self.mapa_pactos:
            self.carregar_catalogo_pactuado()
            if not self.cnes_ativos:
                logger.error("Nenhum CNES ativo encontrado. Interrompendo processamento.")
                return 0

        # Verificação de idempotência
        existing = self.session.scalars(
            select(DatasusImportacao)
            .where(
                DatasusImportacao.sistemaOrigem == sistema,
                DatasusImportacao.competencia == competencia,
                DatasusImportacao.status == "SUCESSO",
            )
            .limit(1)
        ).first()

        if existing:
            logger.info(
                f"[{sistema}] Competência {competencia} já importada com sucesso (id={existing.id}). Skip."
            )
            return existing.registrosProcessados or 0

        importacao = DatasusImportacao(
            competencia=competencia,
            sistemaOrigem=sistema,
            status="EM_ANDAMENTO",
            arquivosAfetados=f"{uf}_{competencia}",
        )
        self.session.add(importacao)
        self.session.commit()

        logger.info(f"[{sistema}] Baixando arquivo {uf} - {competencia}...")

        registros_lidos = 0
        registros_cnes = 0
        registros_inseridos = 0
        try:
            df = self.client.download_dataframe(sistema, uf, competencia)

            if df is None or df.empty:
                importacao.status = "SUCESSO"
                importacao.registrosProcessados = 0
                importacao.dataFim = datetime.utcnow()
                self.session.commit()
                logger.info(f"[{sistema}] Nenhum dado encontrado para {uf}_{competencia}.")
                return 0

            registros_lidos = len(df)
            cnes_col = "CNES" if sistema == "SIH" else "PA_CODUNI"

            if cnes_col in df.columns:
                # Contagem de registros do CNES municipal antes do descarte cirúrgico
                cnes_norm_series = normalize_cnes(df[cnes_col])
                registros_cnes = int(cnes_norm_series.isin(self.cnes_ativos).sum())

            # Extração cirúrgica vetorial
            if sistema == "SIH":
                mapped_data = filter_and_map_sih_df(
                    df,
                    self.cnes_ativos,
                    mapa_pactos=self.mapa_pactos,
                    todos_procedimentos_pactuados=self.todos_procedimentos_pactuados,
                )
                ModelClass = DatasusSihTbRd
            else:
                mapped_data = filter_and_map_sia_df(
                    df,
                    self.cnes_ativos,
                    mapa_pactos=self.mapa_pactos,
                    todos_procedimentos_pactuados=self.todos_procedimentos_pactuados,
                )
                ModelClass = DatasusSiaTbPa

            registros_inseridos = len(mapped_data)
            registros_descartados = registros_lidos - registros_inseridos

            # Bulk insert otimizado em lotes
            if mapped_data:
                for i in range(0, len(mapped_data), batch_size):
                    chunk = mapped_data[i:i + batch_size]
                    self.session.execute(insert(ModelClass), chunk)

            importacao.status = "SUCESSO"
            importacao.registrosProcessados = registros_inseridos
            importacao.dataFim = datetime.utcnow()
            self.session.commit()

            duracao = time.monotonic() - start_time
            log_etl_summary(
                modulo=f"DATASUS_{sistema}_{uf}_{competencia}",
                duracao_segundos=duracao,
                registros_lidos=registros_lidos,
                registros_filtrados=registros_cnes,
                registros_inseridos=registros_inseridos,
                registros_descartados=registros_descartados,
                erros=0,
                detalhes={
                    "CNES ativos considerados": len(self.cnes_ativos),
                    "Procedimentos contratados vigentes": len(self.todos_procedimentos_pactuados),
                    "Batch size de inserção": batch_size,
                },
                logger=logger,
            )

        except Exception as e:
            self.session.rollback()
            importacao.status = "FALHA"
            importacao.dataFim = datetime.utcnow()
            self.session.commit()
            logger.error(f"[{sistema}] Erro na competência {competencia} ({uf}): {e}", exc_info=True)
            raise e

        return registros_inseridos

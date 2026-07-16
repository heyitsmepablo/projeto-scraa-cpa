import logging
from typing import Literal, Optional, List, Set
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from datetime import datetime

from .datasus_client import DatasusClient
from .database import Instituicao, DatasusImportacao, DatasusSihRd, DatasusSiaPa
from .mapper import filter_and_map_sih_df, filter_and_map_sia_df

logger = logging.getLogger(__name__)

class DatasusEtl:
    """Orquestrador do processo de ETL do DATASUS."""

    def __init__(self, session: Session, client: DatasusClient) -> None:
        self.session = session
        self.client = client
        self.cnes_ativos: Set[str] = set()

    def carregar_cnes_ativos(self) -> None:
        """Busca no banco e armazena em memória os CNES de instituições ativas."""
        stmt = select(Instituicao.cnes).where(Instituicao.deletadoEm.is_(None))
        result = self.session.execute(stmt)
        self.cnes_ativos = {row[0] for row in result.all()}
        logger.info(f"Carregados {len(self.cnes_ativos)} CNES ativos do banco.")

    def get_ultima_competencia_banco(self, sistema: str) -> Optional[str]:
        """Retorna a competência mais recente com status SUCESSO no banco."""
        stmt = (
            select(DatasusImportacao.competencia)
            .where(
                DatasusImportacao.sistemaOrigem == sistema,
                DatasusImportacao.status == "SUCESSO"
            )
            .order_by(desc(DatasusImportacao.competencia))
            .limit(1)
        )
        result = self.session.scalars(stmt).first()
        return result

    def get_competencias_a_processar(
        self, sistema: Literal["SIA", "SIH"], uf: str, competencia_inicial: Optional[str]
    ) -> List[str]:
        """
        Gera a lista de competências (YYYYMM) a processar.
        Se competencia_inicial for informada, processa dela até a mais recente no FTP.
        Se não, processa a partir da seguinte da última sucesso no banco.
        """
        # Obter a mais recente do FTP
        latest_ftp = self.client.get_latest_competencia(sistema, uf)
        if not latest_ftp:
            logger.warning(f"Não foi possível determinar a última competência no FTP para {sistema} {uf}.")
            return []

        start_comp = competencia_inicial

        if not start_comp:
            ultima_db = self.get_ultima_competencia_banco(sistema)
            if not ultima_db:
                # Nunca rodou, vamos processar só a atual (ou definir um fallback maior, mas por default a última)
                logger.info(f"Sem histórico no banco para {sistema}. Processando apenas a mais recente: {latest_ftp}")
                return [latest_ftp]
                
            # Avança 1 mês em relação à ultima_db
            y = int(ultima_db[:4])
            m = int(ultima_db[4:6])
            m += 1
            if m > 12:
                m = 1
                y += 1
            start_comp = f"{y}{m:02d}"

        # Gera range até a latest_ftp
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
        batch_size: int = 2000,
    ) -> int:
        """
        Baixa, filtra e insere os dados de uma competência para uma UF.
        """
        if not self.cnes_ativos:
            self.carregar_cnes_ativos()
            if not self.cnes_ativos:
                logger.error("Nenhum CNES ativo encontrado. Interrompendo processamento.")
                return 0

        # Idempotency check: skip if already imported successfully
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
            logger.info(f"[{sistema}] Competência {competencia} já importada com sucesso (id={existing.id}). Skip.")
            return existing.registrosProcessados or 0

        # Verifica se já não foi importado no meio tempo ou está em andamento (ignorando concorrência avançada por ora, script batch)
        importacao = DatasusImportacao(
            competencia=competencia,
            sistemaOrigem=sistema,
            status="EM_ANDAMENTO"
        )
        self.session.add(importacao)
        self.session.commit()
        
        logger.info(f"[{sistema}] Baixando {uf} - {competencia}...")

        registros_inseridos = 0
        try:
            df = self.client.download_dataframe(sistema, uf, competencia)
            
            if df is None:
                # Marca sucesso com 0 registros se o arquivo não existe (evita refazer eternamente)
                importacao.status = "SUCESSO"
                importacao.registrosProcessados = 0
                importacao.dataFim = datetime.utcnow()
                self.session.commit()
                return 0

            logger.debug(f"[{sistema}] Colunas do DataFrame: {list(df.columns)}")
            logger.info(f"[{sistema}] Mapeando dataframe de {len(df)} linhas...")
            
            if sistema == "SIH":
                mapped_data = filter_and_map_sih_df(df, self.cnes_ativos)
                ModelClass = DatasusSihRd
                tabela = "datasus_sih_tb_rd"
            else:
                mapped_data = filter_and_map_sia_df(df, self.cnes_ativos)
                ModelClass = DatasusSiaPa
                tabela = "datasus_sia_tb_pa"

            registros_inseridos = len(mapped_data)
            logger.info(f"[{sistema}] Filtrados {registros_inseridos} registros relevantes. Inserindo no banco...")

            if registros_inseridos == 0 and not df.empty:
                # Log diagnóstico para entender por que filtrou tudo
                cnes_col = "CNES" if sistema == "SIH" else "PA_CODUNI"
                if cnes_col in df.columns:
                    sample_df = list(df[cnes_col].dropna().unique()[:5])
                    logger.warning(
                        f"[{sistema}] 0 registros retidos. "
                        f"Amostra CNES no arquivo: {sample_df}. "
                        f"Amostra CNES no banco (ativos): {list(self.cnes_ativos)[:5]}"
                    )

            # Inserção em lotes para economizar memória e I/O
            if mapped_data:
                # Dividindo em chunks
                for i in range(0, len(mapped_data), batch_size):
                    chunk = mapped_data[i:i + batch_size]
                    self.session.bulk_insert_mappings(ModelClass, chunk)
                
            importacao.status = "SUCESSO"
            importacao.registrosProcessados = registros_inseridos
            importacao.arquivosAfetados = f"{uf}_{competencia}"
            importacao.dataFim = datetime.utcnow()
            
            self.session.commit()
            logger.info(f"[{sistema}] Competência {competencia} ({uf}) processada: {registros_inseridos} inserções.")
            
        except Exception as e:
            self.session.rollback()
            importacao.status = "FALHA"
            importacao.dataFim = datetime.utcnow()
            self.session.commit()
            logger.error(f"[{sistema}] Erro na competência {competencia} ({uf}): {e}", exc_info=True)
            raise e
            
        return registros_inseridos

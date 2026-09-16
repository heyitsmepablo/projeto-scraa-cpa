"""Pipeline orchestrator: Extract → Transform → Load."""

import logging
import time

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from sync_cpa_data.db import get_session
from sync_cpa_data.extractor import (
    extract_instituicoes, 
    extract_vinculos,
    extract_aditivos,
    extract_planos_operativos,
    extract_complementacoes_tipos,
    extract_complementacoes_itens,
    extract_complementacoes_plano,
)
from sync_cpa_data.loader import (
    finish_importacao, 
    load_instituicoes, 
    load_vinculos,
    load_aditivos,
    load_complementacoes_tipos,
    load_complementacoes_itens,
    load_planos_operativos,
    load_plano_operativo_procedimentos,
    load_plano_operativo_complementacoes,
    start_importacao,
    _vinculo,
    _aditivo,
    _instituicao
)
from sync_cpa_data.settings import SPREADSHEET_PATH

logger = logging.getLogger(__name__)


def _build_vinculo_cnes_cache(session: Session) -> dict[tuple[str, str], int]:
    """Retorna {(cnes, numero_vinculo): vinculo_id}."""
    stmt = (
        select(_vinculo.c.id, _instituicao.c.cnes, _vinculo.c.numero)
        .select_from(_vinculo.join(_instituicao, _vinculo.c.instituicao_id == _instituicao.c.id))
    )
    rows = session.execute(stmt).fetchall()
    return {(row.cnes.strip(), row.numero.strip()): row.id for row in rows}


def _build_vinculo_key_map(session: Session) -> dict[str, int]:
    """Retorna {numero_vinculo: vinculo_id}."""
    rows = session.execute(select(_vinculo.c.id, _vinculo.c.numero)).fetchall()
    return {row.numero: row.id for row in rows}


def _build_aditivo_key_map(session: Session) -> dict[tuple[int, str], int]:
    """Retorna {(vinculo_id, numero_aditivo): aditivo_id}."""
    rows = session.execute(select(_aditivo.c.id, _aditivo.c.vinculo_id, _aditivo.c.numero)).fetchall()
    return {(row.vinculo_id, row.numero): row.id for row in rows}


def run(reset: bool = False, exit_after_reset: bool = False) -> None:
    start = time.monotonic()
    logger.info("Pipeline iniciado. Arquivo: %s", SPREADSHEET_PATH)

    if exit_after_reset:
        logger.info("Modo --reset-only ativo. Pulando extração de dados.")
    else:
        # ── Extract (otimizado via pd.ExcelFile único) ───────────────────────────
        with pd.ExcelFile(SPREADSHEET_PATH) as xls:
            inst_result = extract_instituicoes(xls)
            vinc_result = extract_vinculos(xls)
            adit_result = extract_aditivos(xls)
            plano_result = extract_planos_operativos(xls)
            comp_tipo_result = extract_complementacoes_tipos(xls)
            comp_item_result = extract_complementacoes_itens(xls)
            comp_plano_result = extract_complementacoes_plano(xls)

    # ── Load (single transaction) ─────────────────────────────────────────────
    with get_session() as session:
        try:
            if reset:
                from sync_cpa_data.loader import reset_all_data
                reset_all_data(session)
                
            if exit_after_reset:
                session.commit()
                logger.info("Reset concluído. Saindo...")
                return

            importacao_id, versao = start_importacao(
                session, 
                "instituicao, vinculo, aditivo, plano_operativo, complemento_tipo, complemento_item, plano_operativo_procedimento, plano_operativo_complementacao"
            )
            logger.info("Importação iniciada. Versão sequencial: %s", versao)
            
            cnes_id_map = load_instituicoes(session, inst_result.data, importacao_id)
            load_vinculos(session, vinc_result.data, cnes_id_map, importacao_id)
            
            vinculo_cnes_cache = _build_vinculo_cnes_cache(session)
            load_aditivos(session, adit_result.data, vinculo_cnes_cache, importacao_id)
            
            # Mapas base para resoluções das planilhas sequenciais
            vinculo_map = _build_vinculo_key_map(session)
            aditivo_map = _build_aditivo_key_map(session)

            # Complementações Dicionários
            tipo_map = load_complementacoes_tipos(session, comp_tipo_result.data, importacao_id)
            item_map = load_complementacoes_itens(session, comp_item_result.data, tipo_map, importacao_id)

            # Planos e dependências
            plano_key_map = load_planos_operativos(
                session, plano_result.data, vinculo_map, aditivo_map, importacao_id
            )
            
            stats_proc = load_plano_operativo_procedimentos(
                session, plano_result.data, plano_key_map, importacao_id
            )
            
            load_plano_operativo_complementacoes(
                session, comp_plano_result.data, plano_key_map, item_map, importacao_id
            )

            finish_importacao(session, importacao_id, "SUCESSO")
            logger.info("Importação %s finalizada com SUCESSO.", versao)
            
            # --- IMPRIMIR RESUMO DE PLANOS OPERATIVOS ---
            if stats_proc:
                print("=" * 80)
                print("RESUMO: PLANOS OPERATIVOS (PROCEDIMENTOS)")
                print("=" * 80)
                print(f"Total de linhas na aba Excel                 : {plano_result.total}")
                
                det = plano_result.details or {}
                print(f"[-] Ignoradas (Vínculo em branco no Excel)   : {det.get('vinculo_vazio', 0)}")
                print(f"[-] Ignoradas (Qtde inválida no Excel)       : {det.get('qtde_invalida', 0)}")
                print(f"[-] Descartadas (Vínculo/Aditivo não achado) : {stats_proc.get('skipped_vinculo', 0)}")
                print(f"[-] Descartadas (Código SIGTAP não existe)   : {stats_proc.get('skipped_sigtap', 0)}")
                print("-" * 80)
                print(f"[+] Total Inserido/Atualizado no Banco       : {stats_proc.get('inseridos', 0)}")
                print("=" * 80)
        except Exception:
            session.rollback()
            if 'importacao_id' in locals():
                try:
                    with get_session() as fail_session:
                        finish_importacao(fail_session, importacao_id, "FALHA")
                    logger.error("Importação %s finalizada com FALHA.", versao)
                except Exception as inner:
                    logger.error("Não foi possível registrar FALHA na importação: %s", inner)
            raise

    elapsed = time.monotonic() - start
    logger.info("Pipeline concluído em %.2fs.", elapsed)

import sys
import logging
import argparse
from typing import Literal

from .config import load_settings
from .database import get_engine, get_session_factory, DatasusSiaPa, DatasusSihRd, DatasusImportacao
from .datasus_client import DatasusClient
from .etl_core import DatasusEtl

logger = logging.getLogger(__name__)

def setup_logging(level: str):
    logging.basicConfig(
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        level=level,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("log.txt", encoding="utf-8")
        ]
    )
    # Suprimir logs muito verbosos
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def clean_database(session, ufs, cnes_ativos=None):
    """Remove os dados já carregados para evitar duplicidades em regerações forçadas."""
    logger.info("Apagando registros locais do DATASUS...")
    try:
        # Se cnes_ativos for fornecido, poderíamos limitar, mas tipicamente reset apaga tudo
        # do modulo DATASUS
        from sqlalchemy import delete
        session.execute(delete(DatasusSihRd))
        session.execute(delete(DatasusSiaPa))
        session.execute(delete(DatasusImportacao))
        session.commit()
        logger.info("Dados do DATASUS locais apagados com sucesso.")
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao apagar banco de dados: {e}")
        raise

def clean_sia_database(session):
    """Remove apenas os dados do SIA para forçar reprocessamento sem afetar o SIH."""
    logger.info("Apagando registros locais do SIA...")
    try:
        from sqlalchemy import delete
        session.execute(delete(DatasusSiaPa))
        session.execute(
            delete(DatasusImportacao)
            .where(DatasusImportacao.sistemaOrigem == "SIA")
        )
        session.commit()
        logger.info("Dados do SIA locais apagados com sucesso.")
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao apagar banco de dados do SIA: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description="Sincronizador de dados do DATASUS (SIA/SIH)")
    parser.add_argument(
        "--competencia-inicial",
        type=str,
        help="Competência inicial (YYYYMM). Ex: 202301",
        default=None
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Apaga os dados locais do DATASUS antes de sincronizar"
    )
    parser.add_argument(
        "--reset-only",
        action="store_true",
        help="Apenas apaga os dados locais do DATASUS e encerra"
    )
    parser.add_argument(
        "--reset-sia",
        action="store_true",
        help="Apaga apenas os dados locais do SIA e seus registros de importação"
    )
    
    args = parser.parse_args()
    
    settings = load_settings()
    setup_logging(settings.log_level)
    
    engine = get_engine(settings.database_url)
    SessionLocal = get_session_factory(engine)
    
    try:
        with SessionLocal() as session:
            # Lista de UFs (fallback para todas se não configurado)
            # Para o SIA/SIH, o normal é baixar o Brasil inteiro (todas as 27 UFs)
            # Mas configurado via variavel no settings, usaremos ela
            ufs_to_process = settings.ufs
            if not ufs_to_process:
                ufs_to_process = [
                    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
                    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
                    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
                ]

            if args.reset or args.reset_only or args.reset_sia:
                if args.reset_sia:
                    msg = "Tem certeza absoluta que deseja apagar TODOS os dados locais do SIA? [y/N]: "
                else:
                    msg = "Tem certeza absoluta que deseja apagar TODOS os dados locais do DATASUS (SIA e SIH)? [y/N]: "
                
                confirm = input(msg)
                if confirm.lower() != 'y':
                    logger.info("Operação de reset cancelada pelo usuário.")
                    return
                
                if args.reset_sia:
                    clean_sia_database(session)
                else:
                    clean_database(session, ufs_to_process)
                    
                if args.reset_only:
                    logger.info("Finalizado (--reset-only).")
                    return

            client = DatasusClient()
            etl = DatasusEtl(session, client)
            
            # Carrega a lista de CNES válidos e procedimentos pactuados na memória
            etl.carregar_catalogo_pactuado()
            
            sistemas: list[Literal["SIA", "SIH"]] = ["SIA", "SIH"]
            
            for uf in ufs_to_process:
                for sistema in sistemas:
                    logger.info(f"--- Iniciando rotina para {sistema} / {uf} ---")
                    competencias = etl.get_competencias_a_processar(
                        sistema=sistema,
                        uf=uf,
                        competencia_inicial=args.competencia_inicial
                    )
                    
                    if not competencias:
                        logger.info(f"Nenhuma nova competência a processar para {sistema} em {uf}.")
                        continue
                        
                    logger.info(f"Competências a baixar: {competencias}")
                    
                    for comp in competencias:
                        try:
                            etl.processar_competencia(sistema, uf, comp)
                        except Exception as e:
                            logger.error(f"Erro ao processar {sistema} {uf} {comp}. Pulando para a próxima. Detalhe: {e}")
                            
            logger.info("Sincronização DATASUS finalizada.")

    except Exception as e:
        logger.error(f"Erro fatal: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

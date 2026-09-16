import sys
import logging
from pathlib import Path
from tempfile import TemporaryDirectory
import click
import zipfile
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from typing import Optional

from .config import load_settings
from .database import get_engine, get_session_factory, SigtapImportacao, Vinculo
from .etl_core import FtpClient, SigtapEtl, LayoutParser, FtpFileNotFoundError
from . import database as db_models

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
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def get_oldest_contract_competencia(session) -> Optional[str]:
    """Busca a competência a partir da data de início do contrato mais antigo ativo (Vinculo.dataInicio)."""
    primeiro_vinculo = (
        session.query(Vinculo)
        .filter(Vinculo.deletadoEm.is_(None))
        .order_by(Vinculo.dataInicio.asc())
        .first()
    )
    if primeiro_vinculo and primeiro_vinculo.dataInicio:
        return primeiro_vinculo.dataInicio.strftime("%Y%m")
    return None


def execute_etl(settings, competencia_inicial=None):
    logger.info("Iniciando rotina de sincronização SIGTAP genérica...")
    engine = get_engine(settings.database_url)
    SessionLocal = get_session_factory(engine)
    
    with SessionLocal() as session:
        ftp = FtpClient(host=settings.ftp_host, directory=settings.ftp_dir, timeout=settings.ftp_timeout)
        
        competencias_to_process = []
        if competencia_inicial:
            try:
                competencias_to_process = ftp.get_competencias_from(competencia_inicial)
                logger.info(f"Encontradas {len(competencias_to_process)} competências a partir de {competencia_inicial}.")
            except Exception as e:
                logger.error(f"Erro ao verificar FTP: {e}")
                return
        else:
            try:
                # 1. Se houver última importação com SUCESSO no banco, avança 1 mês
                ultima_imp = (
                    session.query(SigtapImportacao)
                    .filter_by(status="SUCESSO")
                    .order_by(SigtapImportacao.competencia.desc())
                    .first()
                )
                if ultima_imp and ultima_imp.competencia:
                    y = int(ultima_imp.competencia[:4])
                    m = int(ultima_imp.competencia[4:6])
                    m += 1
                    if m > 12:
                        m = 1
                        y += 1
                    next_comp = f"{y}{m:02d}"
                    logger.info(
                        f"Última importação SIGTAP com sucesso: {ultima_imp.competencia}. "
                        f"Buscando competências a partir de {next_comp}..."
                    )
                    try:
                        competencias_to_process = ftp.get_competencias_from(next_comp)
                        logger.info(f"Encontradas {len(competencias_to_process)} novas competências a partir de {next_comp}.")
                    except FtpFileNotFoundError:
                        logger.info(f"Base SIGTAP já está atualizada. Nenhuma nova competência a partir de {next_comp}.")
                        return
                else:
                    # 2. Se NÃO houver importação no banco, busca a data de início mais antiga na tabela Vinculo
                    oldest_comp = get_oldest_contract_competencia(session)
                    if oldest_comp:
                        logger.info(
                            f"Sem histórico no banco para SIGTAP. "
                            f"Utilizando competência mais antiga do contrato: {oldest_comp}"
                        )
                        competencias_to_process = ftp.get_competencias_from(oldest_comp)
                        logger.info(f"Encontradas {len(competencias_to_process)} competências a partir de {oldest_comp}.")
                    else:
                        # 3. Fallback se não houver vínculos cadastrados
                        competencia, filename = ftp.get_latest_competencia()
                        competencias_to_process = [(competencia, filename)]
                        logger.info(f"Sem histórico e sem vínculos. Processando apenas a mais recente: {competencia} ({filename})")
            except Exception as e:
                logger.error(f"Erro ao verificar FTP: {e}")
                return

        total_competencias = len(competencias_to_process)
        for idx_comp, (competencia, filename) in enumerate(competencias_to_process, 1):
            logger.info(f"--- Processando competência {competencia} do arquivo {filename} ({idx_comp}/{total_competencias}) ---")
            
            ultima_importacao = session.query(SigtapImportacao).filter_by(
                competencia=competencia, 
                status="SUCESSO"
            ).first()
            
            if ultima_importacao:
                logger.info(f"Competência {competencia} já foi atualizada com sucesso anteriormente. Nada a fazer.")
                continue

            importacao = SigtapImportacao(
                competencia=competencia,
                status="EM_ANDAMENTO",
                tabelasAfetadas=""
            )
            session.add(importacao)
            session.commit()
            
            try:
                with TemporaryDirectory() as tmpdir:
                    zip_path = ftp.download_zip(filename, Path(tmpdir))
                    
                    # Parse layout
                    with zipfile.ZipFile(zip_path, "r") as z:
                        layout_content = z.read("layout.txt").decode("windows-1252")
                    
                    schemas = LayoutParser.parse_layout_file(layout_content)
                    etl = SigtapEtl(schemas)
                    
                    # Determine which tables we will process
                    tables_to_process = []
                    for table_name in schemas.keys():
                        if table_name.startswith("tb_"):
                            model_class_name = "Sigtap" + "".join(p.title() for p in table_name[3:].split("_"))
                            model_class = getattr(db_models, model_class_name, None)
                            if model_class:
                                tables_to_process.append((table_name, model_class))
                            else:
                                logger.warning(f"Modelo não encontrado para {table_name}, ignorando...")

                    total_tables = len(tables_to_process)
                    tabelas_sucesso = []
                    start_time_loop = datetime.utcnow()
                    
                    for idx, (table_name, model_class) in enumerate(tables_to_process, 1):
                        percent = (idx - 1) / total_tables * 100
                        elapsed = (datetime.utcnow() - start_time_loop).total_seconds()
                        
                        if idx > 1:
                            avg_time = elapsed / (idx - 1)
                            eta_seconds = int(avg_time * (total_tables - idx + 1))
                            eta_str = f"{eta_seconds // 60:02d}:{eta_seconds % 60:02d}"
                        else:
                            eta_str = "Calculando..."
                            
                        logger.info(f"[{idx:02d}/{total_tables:02d}] ({percent:.1f}%) Processando {table_name} | ETA: {eta_str}")
                        
                        try:
                            with session.begin_nested():
                                df_ftp = etl.extract_table_from_zip(zip_path, table_name)
                                if not df_ftp.empty:
                                    total_upserted = etl.upsert_table(
                                        session, model_class, table_name, df_ftp, competencia, batch_size=2000
                                    )
                                    logger.info(f"[{table_name}] UPSERT -> {total_upserted} registros sincronizados.")
                                    tabelas_sucesso.append(table_name)
                        except Exception as ex:
                            logger.error(f"Erro ao processar tabela {table_name}: {ex}. Isolando falha.", exc_info=True)
                            if table_name == "tb_procedimento":
                                raise
                    
                importacao.status = "SUCESSO"
                importacao.tabelasAfetadas = ", ".join(tabelas_sucesso)
                importacao.dataFim = datetime.utcnow()
                session.commit()
                logger.info(f"Sincronização da competência {competencia} concluída com sucesso.")
                
            except Exception as e:
                session.rollback()
                importacao.status = "FALHA"
                importacao.dataFim = datetime.utcnow()
                session.commit()
                logger.error(f"Falha na sincronização da competência {competencia}: {e}", exc_info=True)
                if competencia_inicial:
                    logger.error("Interrompendo a sincronização histórica devido a um erro.")
                    break

@click.group()
def cli():
    pass

@cli.command()
@click.option('--competencia-inicial', help='Competência inicial para importação histórica (ex: 202401).')
def run(competencia_inicial):
    try:
        settings = load_settings()
        setup_logging(settings.log_level)
        
        if competencia_inicial:
            engine = get_engine(settings.database_url)
            SessionLocal = get_session_factory(engine)
            with SessionLocal() as session:
                count = session.query(SigtapImportacao).count()
                if count > 0:
                    if click.confirm("O banco de dados já possui importações do SIGTAP. Deseja apagar todos os dados SIGTAP e recarregar o histórico?", default=False):
                        logger.info("Deletando histórico do SIGTAP...")
                        for table in reversed(db_models.Base.metadata.sorted_tables):
                            if table.name.startswith("sigtap_"):
                                session.execute(table.delete())
                        session.commit()
                        logger.info("Banco limpo com sucesso.")
                    else:
                        print("Sincronização histórica cancelada.")
                        sys.exit(0)
                        
        execute_etl(settings, competencia_inicial)
    except Exception as e:
        print(f"Erro fatal: {e}")
        sys.exit(1)

@cli.command()
def schedule():
    try:
        settings = load_settings()
        setup_logging(settings.log_level)
        
        scheduler = BlockingScheduler()
        trigger = CronTrigger(hour=settings.schedule_hour, minute=settings.schedule_minute)
        
        logger.info(f"Iniciando scheduler. Execução diária agendada para {settings.schedule_hour:02d}:{settings.schedule_minute:02d}")
        scheduler.add_job(execute_etl, trigger=trigger, args=[settings])
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler finalizado.")
    except Exception as e:
        logger.error(f"Erro fatal no scheduler: {e}")
        sys.exit(1)

if __name__ == "__main__":
    cli()

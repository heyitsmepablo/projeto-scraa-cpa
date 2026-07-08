import sys
import logging
from pathlib import Path
from tempfile import TemporaryDirectory
import click
import zipfile
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from .config import load_settings
from .database import get_engine, get_session_factory, SigtapImportacao
from .etl_core import FtpClient, SigtapEtl, LayoutParser
import sync_sigtap.database as db_models

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

def execute_etl(settings):
    logger.info("Iniciando rotina de sincronização SIGTAP genérica...")
    engine = get_engine(settings.database_url)
    SessionLocal = get_session_factory(engine)
    
    with SessionLocal() as session:
        ftp = FtpClient(host=settings.ftp_host, directory=settings.ftp_dir, timeout=settings.ftp_timeout)
        try:
            competencia, filename = ftp.get_latest_competencia()
            logger.info(f"Última competência no FTP: {competencia} ({filename})")
        except Exception as e:
            logger.error(f"Erro ao verificar FTP: {e}")
            return
            
        ultima_importacao = session.query(SigtapImportacao).filter_by(
            competencia=competencia, 
            status="SUCESSO"
        ).first()
        
        if ultima_importacao:
            logger.info(f"Competência {competencia} já foi atualizada com sucesso anteriormente. Nada a fazer.")
            return

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
                        df_ftp = etl.extract_table_from_zip(zip_path, table_name)
                        if df_ftp.empty:
                            continue
                            
                        df_db = etl.extract_table_from_db(session, model_class, table_name)
                        diff = etl.compute_diff(df_ftp, df_db)
                        
                        logger.info(f"[{table_name}] Diff -> INSERTs: {len(diff.inserts)}, UPDATEs: {len(diff.updates)}, DELETEs: {len(diff.deletes)}")
                        
                        if not diff.inserts.empty or not diff.updates.empty or not diff.deletes.empty:
                            etl.apply_diff(diff, session, importacao.id, df_db, model_class, table_name)
                            
                        tabelas_sucesso.append(table_name)
                    except Exception as ex:
                        session.rollback()
                        logger.error(f"Erro ao processar {table_name}: {ex}. Interrompendo a sincronização.", exc_info=True)
                        raise  # Interrompe o processo e vai para o catch principal para marcar a importacao como FALHA
                
            importacao.status = "SUCESSO"
            importacao.tabelasAfetadas = ", ".join(tabelas_sucesso)
            importacao.dataFim = datetime.utcnow()
            session.commit()
            logger.info("Sincronização concluída com sucesso.")
            
        except Exception as e:
            session.rollback()
            importacao.status = "FALHA"
            importacao.dataFim = datetime.utcnow()
            session.commit()
            logger.error(f"Falha na sincronização: {e}", exc_info=True)

@click.group()
def cli():
    pass

@cli.command()
def run():
    try:
        settings = load_settings()
        setup_logging(settings.log_level)
        execute_etl(settings)
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

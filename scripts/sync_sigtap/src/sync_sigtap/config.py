import os
from dataclasses import dataclass
from dotenv import load_dotenv

@dataclass(frozen=True)
class Settings:
    database_url: str
    ftp_host: str
    ftp_dir: str
    ftp_timeout: int
    schedule_hour: int
    schedule_minute: int
    log_level: str

def load_settings() -> Settings:
    load_dotenv()
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("Variável de ambiente DATABASE_URL é obrigatória.")
        
    # SQLAlchemy requires postgresql:// instead of postgres://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    ftp_host = os.getenv("FTP_HOST", "ftp2.datasus.gov.br")
    ftp_dir = os.getenv("FTP_DIR", "/pub/sistemas/tup/downloads/")
    ftp_timeout = int(os.getenv("FTP_TIMEOUT", "30"))
    
    schedule_hour = int(os.getenv("SCHEDULE_HOUR", "0"))
    schedule_minute = int(os.getenv("SCHEDULE_MINUTE", "0"))
    log_level = os.getenv("LOG_LEVEL", "INFO")
    
    return Settings(
        database_url=database_url,
        ftp_host=ftp_host,
        ftp_dir=ftp_dir,
        ftp_timeout=ftp_timeout,
        schedule_hour=schedule_hour,
        schedule_minute=schedule_minute,
        log_level=log_level
    )

"""Configurações centralizadas e carregamento de ambiente para scripts ETL."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional
from dotenv import find_dotenv, load_dotenv

# Diretórios base
SHARED_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = SHARED_DIR.parent
PROJECT_ROOT = SCRIPTS_DIR.parent

def load_env_file() -> None:
    """Carrega o arquivo .env da raiz do projeto ou ancestrais mais próximos."""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        # Fallback para find_dotenv()
        found = find_dotenv()
        if found:
            load_dotenv(found)

# Carrega variáveis ao importar o módulo
load_env_file()

def get_database_url() -> str:
    """Retorna a DATABASE_URL corrigida para dialeto SQLAlchemy (postgresql://)."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError(
            "Variável de ambiente DATABASE_URL é obrigatória. "
            "Certifique-se de configurar o arquivo .env na raiz do projeto."
        )
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return db_url

def _resolve_cpa_spreadsheet_path() -> Path:
    """Resolve o caminho da planilha CPA respeitando env var, caminho no container ou local."""
    env_path = os.getenv("CPA_SPREADSHEET_PATH")
    if env_path:
        return Path(env_path)
    container_path = Path("/app/arquivos/cpa-data/dados-cpa.xlsx")
    if container_path.exists():
        return container_path
    return SCRIPTS_DIR / "arquivos" / "cpa-data" / "dados-cpa.xlsx"

@dataclass
class Settings:
    """Configurações centralizadas dos módulos de ETL."""
    database_url: str = field(default_factory=get_database_url)
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO").upper())
    batch_size: int = field(default_factory=lambda: int(os.getenv("BATCH_SIZE", "5000")))
    
    # Configurações específicas DATASUS
    datasus_ufs: List[str] = field(default_factory=lambda: [
        uf.strip() for uf in os.getenv("DATASUS_UFS", "").split(",") if uf.strip()
    ])
    
    # Configurações específicas SIGTAP
    ftp_host: str = field(default_factory=lambda: os.getenv("FTP_HOST", "ftp2.datasus.gov.br"))
    ftp_dir: str = field(default_factory=lambda: os.getenv("FTP_DIR", "/pub/sistemas/tup/downloads/"))
    ftp_timeout: int = field(default_factory=lambda: int(os.getenv("FTP_TIMEOUT", "30")))
    schedule_hour: int = field(default_factory=lambda: int(os.getenv("SCHEDULE_HOUR", "0")))
    schedule_minute: int = field(default_factory=lambda: int(os.getenv("SCHEDULE_MINUTE", "0")))
    
    # Configurações CPA
    cpa_spreadsheet_path: Path = field(default_factory=_resolve_cpa_spreadsheet_path)

def load_settings() -> Settings:
    """Instancia e retorna as configurações atuais."""
    load_env_file()
    return Settings()

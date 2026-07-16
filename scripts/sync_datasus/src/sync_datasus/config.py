import os
from dataclasses import dataclass
from dotenv import load_dotenv, find_dotenv

@dataclass(frozen=True)
class Settings:
    database_url: str
    ufs: list[str]
    log_level: str

def load_settings() -> Settings:
    load_dotenv(find_dotenv())
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("Variável de ambiente DATABASE_URL é obrigatória.")
        
    # SQLAlchemy requires postgresql:// instead of postgres://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    ufs_env = os.getenv("DATASUS_UFS", "").strip()
    ufs = [uf.strip() for uf in ufs_env.split(",")] if ufs_env else []
    
    log_level = os.getenv("LOG_LEVEL", "INFO")
    
    return Settings(
        database_url=database_url,
        ufs=ufs,
        log_level=log_level
    )

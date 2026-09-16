"""Testes unitários para o módulo de configurações centralizadas scripts.shared.config."""

import os
from pathlib import Path
import pytest

from scripts.shared.config import (
    Settings,
    get_database_url,
    load_settings,
    _resolve_cpa_spreadsheet_path,
    PROJECT_ROOT,
    SCRIPTS_DIR,
    SHARED_DIR,
)


def test_directory_hierarchy():
    """Valida a resolução dos diretórios base do projeto."""
    assert SHARED_DIR.is_dir()
    assert SCRIPTS_DIR.is_dir()
    assert PROJECT_ROOT.is_dir()
    assert SHARED_DIR.name == "shared"
    assert SCRIPTS_DIR.name == "scripts"


def test_get_database_url_success(monkeypatch):
    """Valida a conversão correta de postgres:// para postgresql://."""
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
    url = get_database_url()
    assert url == "postgresql://user:pass@localhost:5432/db"


def test_get_database_url_already_postgresql(monkeypatch):
    """Valida quando a URL já possui o prefixo postgresql://."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    url = get_database_url()
    assert url == "postgresql://user:pass@localhost:5432/db"


def test_get_database_url_missing(monkeypatch):
    """Valida que get_database_url levanta ValueError quando DATABASE_URL não está definida."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValueError, match="DATABASE_URL é obrigatória"):
        get_database_url()


def test_settings_default_values(monkeypatch):
    """Valida valores default da classe Settings."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/scraa")
    monkeypatch.delenv("LOG_LEVEL", raising=False)
    monkeypatch.delenv("BATCH_SIZE", raising=False)
    monkeypatch.delenv("DATASUS_UFS", raising=False)
    
    settings = Settings()
    assert settings.database_url == "postgresql://postgres:postgres@localhost:5432/scraa"
    assert settings.log_level == "INFO"
    assert settings.batch_size == 5000
    assert settings.datasus_ufs == []
    assert settings.ftp_host == "ftp2.datasus.gov.br"
    assert settings.ftp_timeout == 30
    assert isinstance(settings.cpa_spreadsheet_path, Path)


def test_settings_custom_env_values(monkeypatch):
    """Valida inicialização de Settings com variáveis de ambiente customizadas."""
    monkeypatch.setenv("DATABASE_URL", "postgres://test:test@remote:5432/testdb")
    monkeypatch.setenv("LOG_LEVEL", "debug")
    monkeypatch.setenv("BATCH_SIZE", "1000")
    monkeypatch.setenv("DATASUS_UFS", "SP, MG, RJ")
    monkeypatch.setenv("FTP_HOST", "custom.ftp.gov.br")
    monkeypatch.setenv("FTP_TIMEOUT", "60")
    
    settings = Settings()
    assert settings.database_url == "postgresql://test:test@remote:5432/testdb"
    assert settings.log_level == "DEBUG"
    assert settings.batch_size == 1000
    assert settings.datasus_ufs == ["SP", "MG", "RJ"]
    assert settings.ftp_host == "custom.ftp.gov.br"
    assert settings.ftp_timeout == 60


def test_load_settings_function(monkeypatch):
    """Valida a função helper load_settings."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    settings = load_settings()
    assert isinstance(settings, Settings)
    assert settings.database_url == "postgresql://user:pass@localhost:5432/db"


def test_resolve_cpa_spreadsheet_path_from_env(monkeypatch):
    """Valida resolução do caminho da planilha via variável de ambiente."""
    custom_path = "/custom/path/planilha.xlsx"
    monkeypatch.setenv("CPA_SPREADSHEET_PATH", custom_path)
    resolved = _resolve_cpa_spreadsheet_path()
    assert resolved == Path(custom_path)


def test_resolve_cpa_spreadsheet_path_container_fallback(monkeypatch):
    """Valida resolução quando está no container (/app/arquivos/cpa-data/dados-cpa.xlsx)."""
    monkeypatch.delenv("CPA_SPREADSHEET_PATH", raising=False)
    container_target = Path("/app/arquivos/cpa-data/dados-cpa.xlsx")
    with monkeypatch.context() as m:
        m.setattr(Path, "exists", lambda self: self == container_target)
        resolved = _resolve_cpa_spreadsheet_path()
        assert resolved == container_target


def test_resolve_cpa_spreadsheet_path_local_fallback(monkeypatch):
    """Valida fallback para caminho local no diretório scripts/arquivos."""
    monkeypatch.delenv("CPA_SPREADSHEET_PATH", raising=False)
    with monkeypatch.context() as m:
        m.setattr(Path, "exists", lambda self: False)
        resolved = _resolve_cpa_spreadsheet_path()
        assert resolved == SCRIPTS_DIR / "arquivos" / "cpa-data" / "dados-cpa.xlsx"


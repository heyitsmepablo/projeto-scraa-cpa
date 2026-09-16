"""Validação de importação de todos os módulos modificados do ecossistema ETL."""

import sys
from pathlib import Path

# Adiciona os paths src de cada módulo para teste
PROJECT_ROOT = Path(__file__).resolve().parents[3]
for p in [
    PROJECT_ROOT / "scripts" / "sync_sigtap" / "src",
    PROJECT_ROOT / "scripts" / "sync_datasus" / "src",
    PROJECT_ROOT / "scripts" / "sync_cpa_data" / "src",
]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))


def test_import_sync_sigtap():
    """Valida importação e símbolos dos módulos do sync_sigtap."""
    import sync_sigtap.config
    import sync_sigtap.database
    import sync_sigtap.etl_core
    import sync_sigtap.main

    assert hasattr(sync_sigtap.main, "cli")
    assert hasattr(sync_sigtap.etl_core, "SigtapEtl")
    assert hasattr(sync_sigtap.database, "Base")
    assert hasattr(sync_sigtap.config, "Settings")


def test_import_sync_datasus():
    """Valida importação e símbolos dos módulos do sync_datasus."""
    import sync_datasus.config
    import sync_datasus.database
    import sync_datasus.etl_core
    import sync_datasus.main
    import sync_datasus.mapper

    assert hasattr(sync_datasus.main, "main")
    assert hasattr(sync_datasus.etl_core, "DatasusEtl")
    assert hasattr(sync_datasus.database, "Base")
    assert hasattr(sync_datasus.mapper, "filter_and_map_sih_df")
    assert hasattr(sync_datasus.mapper, "filter_and_map_sia_df")


def test_import_sync_cpa_data(monkeypatch):
    """Valida importação e símbolos dos módulos do sync_cpa_data."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
    import sync_cpa_data.db
    import sync_cpa_data.extractor
    import sync_cpa_data.loader
    import sync_cpa_data.pipeline
    import sync_cpa_data.settings

    assert hasattr(sync_cpa_data.pipeline, "run")
    assert hasattr(sync_cpa_data.extractor, "extract_instituicoes")
    assert hasattr(sync_cpa_data.loader, "load_instituicoes")
    assert hasattr(sync_cpa_data.db, "get_session")
    assert hasattr(sync_cpa_data.settings, "SPREADSHEET_PATH")

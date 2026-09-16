"""Testes unitários para o módulo de banco de dados centralizado scripts.shared.database."""

from sqlalchemy import Column, Integer, String, create_engine, select
from sqlalchemy.orm import Session
import pytest

from scripts.shared.database import (
    get_engine,
    get_session,
    get_session_factory,
)
from scripts.shared.models.base import Base
from scripts.shared.models import (
    CpaImportacao,
    Instituicao,
    Vinculo,
    PlanoOperativo,
    PlanoOperativoProcedimento,
    DatasusImportacao,
    DatasusSihTbRd,
    DatasusSiaTbPa,
    SigtapProcedimento,
    SigtapImportacao,
)


def test_get_engine_custom_url():
    """Valida a criação de um novo Engine com URL explícita (dialeto PostgreSQL)."""
    url = "postgresql://user:pass@localhost:5432/test_db"
    engine = get_engine(url)
    assert engine.url.database == "test_db"
    assert engine.url.username == "user"
    assert engine.pool is not None
    assert engine.pool.size() == 10


def test_get_session_factory_binding():
    """Valida que a fábrica de sessões se vincula corretamente ao Engine."""
    engine = create_engine("sqlite:///:memory:")
    factory = get_session_factory(engine)
    session = factory()
    assert isinstance(session, Session)
    assert session.bind is engine
    session.close()


def test_get_session_commit_on_success():
    """Valida que o context manager get_session realiza commit automático em sucesso."""
    engine = create_engine("sqlite:///:memory:")
    
    # Criar tabela temporária simples
    class TempModel(Base):
        __tablename__ = "temp_test_commit"
        id = Column(Integer, primary_key=True)
        nome = Column(String(50))
    
    TempModel.__table__.create(bind=engine)
    
    with get_session(engine) as session:
        session.add(TempModel(id=1, nome="Teste Commit"))
    
    # Validação em nova sessão se os dados persistiram
    with get_session(engine) as session:
        result = session.execute(select(TempModel).where(TempModel.id == 1)).scalar_one_or_none()
        assert result is not None
        assert result.nome == "Teste Commit"


def test_get_session_rollback_on_exception():
    """Valida que o context manager get_session realiza rollback automático em exceção."""
    engine = create_engine("sqlite:///:memory:")
    
    class TempModel2(Base):
        __tablename__ = "temp_test_rollback"
        id = Column(Integer, primary_key=True)
        nome = Column(String(50))
    
    TempModel2.__table__.create(bind=engine)
    
    with pytest.raises(RuntimeError, match="Erro proposital para rollback"):
        with get_session(engine) as session:
            session.add(TempModel2(id=1, nome="Teste Rollback"))
            raise RuntimeError("Erro proposital para rollback")
    
    # Valida que o registro NÃO foi inserido devido ao rollback
    with get_session(engine) as session:
        result = session.execute(select(TempModel2).where(TempModel2.id == 1)).scalar_one_or_none()
        assert result is None


def test_models_metadata_registered():
    """Valida que todas as entidades principais foram registradas no Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    
    expected_tables = {
        "instituicao",
        "vinculo",
        "aditivo",
        "plano_operativo",
        "plano_operativo_procedimento",
        "cpa_importacao",
        "cpa_importacao_changelog",
        "datasus_importacao",
        "datasus_sih_tb_rd",
        "datasus_sia_tb_pa",
        "sigtap_importacao",
        "sigtap_changelog",
        "sigtap_tb_procedimento",
    }
    
    assert expected_tables.issubset(table_names), f"Faltando tabelas: {expected_tables - table_names}"


def test_sigtap_procedimento_deleted_at_property():
    """Valida a property de compatibilidade deletedAt no SigtapProcedimento."""
    from datetime import datetime
    proc = SigtapProcedimento(coProcedimento="0101010010", noProcedimento="Teste")
    assert proc.deletedAt is None
    
    now = datetime.utcnow()
    proc.deletedAt = now
    assert proc.deletadoEm == now
    assert proc.deletedAt == now

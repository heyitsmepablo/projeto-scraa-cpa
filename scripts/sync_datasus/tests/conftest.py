import pytest
from testcontainers.postgres import PostgresContainer # type: ignore
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from sync_datasus.database import Base, get_session_factory
from sync_datasus.config import Settings

@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container for integration tests."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def pg_engine(postgres_container):
    """Create SQLAlchemy engine using the container."""
    engine = create_engine(postgres_container.get_connection_url())
    # Cria os ENUMs necessários no PostgreSQL antes de criar as tabelas
    with engine.connect() as conn:
        for enum_stmt in [
            "DO $$ BEGIN CREATE TYPE \"TipoOperacao\" AS ENUM ('INSERT', 'UPDATE', 'DELETE'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
            "DO $$ BEGIN CREATE TYPE \"TipoVinculo\" AS ENUM ('CONVÊNIO', 'CONTRATO'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
            "DO $$ BEGIN CREATE TYPE \"TipoInstituicao\" AS ENUM ('FILANTRÓPICO', 'EMPRESA'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
            "DO $$ BEGIN CREATE TYPE \"TipoAditivo\" AS ENUM ('ACRÉSCIMO', 'SUPRESSÃO', 'PRAZO'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
            "DO $$ BEGIN CREATE TYPE \"TipoComplexidade\" AS ENUM ('BC', 'MC', 'AC'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
        ]:
            conn.execute(text(enum_stmt))
        conn.commit()
    # Crie as tabelas
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()

@pytest.fixture
def session(pg_engine):
    """Provide a transactional session. Rollback at the end."""
    connection = pg_engine.connect()
    transaction = connection.begin()
    
    Session = sessionmaker(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint"
    )
    session = Session()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def mock_settings(postgres_container):
    """Provides fake Settings pointing to test DB."""
    return Settings(
        database_url=postgres_container.get_connection_url().replace("postgresql+psycopg2://", "postgresql://"),
        ufs=["SP", "MG"],
        log_level="DEBUG"
    )

@pytest.fixture
def sample_cnes_ativos():
    """A set of active CNES for testing mappers."""
    return {"1234567", "7654321"}

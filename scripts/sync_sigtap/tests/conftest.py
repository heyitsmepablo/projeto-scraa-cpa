import pytest
from sqlalchemy import create_engine
from sync_sigtap.database import Base

@pytest.fixture(scope="function")
def pg_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

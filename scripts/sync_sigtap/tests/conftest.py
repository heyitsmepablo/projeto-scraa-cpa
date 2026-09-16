import json
import sqlite3
import pytest
from sqlalchemy import create_engine, ARRAY
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.ext.compiler import compiles
from sync_sigtap.database import Base

sqlite3.register_adapter(list, json.dumps)


@compiles(ARRAY, "sqlite")
@compiles(PG_ARRAY, "sqlite")
def compile_array(type_, compiler, **kw):
    return "TEXT"


@pytest.fixture(scope="function")
def pg_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

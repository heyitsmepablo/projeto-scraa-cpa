from contextlib import contextmanager
from typing import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

def get_engine(database_url: str) -> Engine:
    """Cria a engine do SQLAlchemy."""
    return create_engine(database_url, pool_pre_ping=True)


@contextmanager
def get_session(engine: Engine) -> Generator[Session, None, None]:
    """Provide a transactional SQLAlchemy session.
    
    Commits on success, rolls back on any exception, and always closes
    the session when the context exits.
    """
    SessionFactory = sessionmaker(bind=engine)
    session: Session = SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

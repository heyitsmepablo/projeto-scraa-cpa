"""Database connection factory using SQLAlchemy Core."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from sync_cpa_data.settings import DATABASE_URL

_engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)
_SessionFactory = sessionmaker(bind=_engine)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Provide a transactional SQLAlchemy session.

    Commits on success, rolls back on any exception, and always closes
    the session when the context exits.

    Yields:
        An active SQLAlchemy Session.

    Raises:
        Any database exception raised during the session.
    """
    session: Session = _SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

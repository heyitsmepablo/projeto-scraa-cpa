"""Infraestrutura de banco de dados com pooling configurado e context manager de sessão."""

from contextlib import contextmanager
from typing import Generator, Optional
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from scripts.shared.config import get_database_url

_DEFAULT_ENGINE: Optional[Engine] = None
_DEFAULT_SESSION_FACTORY: Optional[sessionmaker[Session]] = None


def get_engine(url: Optional[str] = None) -> Engine:
    """Cria ou retorna o SQLAlchemy Engine configurado com connection pooling.
    
    Se nenhuma URL for especificada, utiliza a DATABASE_URL das configurações
    e mantém uma instância única com pool reutilizável.
    """
    global _DEFAULT_ENGINE
    if url is not None:
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    
    if _DEFAULT_ENGINE is None:
        _DEFAULT_ENGINE = create_engine(
            get_database_url(),
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    return _DEFAULT_ENGINE


def get_session_factory(engine: Optional[Engine] = None) -> sessionmaker[Session]:
    """Cria ou retorna a sessionmaker associada ao Engine."""
    global _DEFAULT_SESSION_FACTORY
    if engine is not None:
        return sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    if _DEFAULT_SESSION_FACTORY is None:
        eng = get_engine()
        _DEFAULT_SESSION_FACTORY = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return _DEFAULT_SESSION_FACTORY


@contextmanager
def get_session(engine: Optional[Engine] = None) -> Generator[Session, None, None]:
    """Context manager para fornecer uma sessão transacional do SQLAlchemy.

    Realiza commit automático em caso de sucesso, rollback automático em caso
    de qualquer exceção e garante o fechamento da sessão no bloco finally.
    
    Uso:
        with get_session() as session:
            session.add(...)
    """
    factory = get_session_factory(engine)
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

"""Camada de banco de dados do utilitário delegada a scripts.shared."""

import sys
from pathlib import Path
from typing import Optional
from sqlalchemy import Engine

# Assegura a resolução de scripts.shared dinamicamente sem IndexError
for _parent in Path(__file__).resolve().parents:
    if (_parent / "scripts" / "shared").is_dir():
        for _p in [str(_parent), str(_parent / "scripts")]:
            if _p not in sys.path:
                sys.path.insert(0, _p)
        break
    elif (_parent / "shared").is_dir():
        _scripts_p = _parent if _parent.name == "scripts" else _parent / "scripts"
        _root_p = _parent.parent if _parent.name == "scripts" else _parent
        for _p in [str(_root_p), str(_scripts_p)]:
            if Path(_p).is_dir() and _p not in sys.path:
                sys.path.insert(0, _p)
        break

from scripts.shared.database import (
    get_engine as _shared_get_engine,
    get_session as _shared_get_session,
    get_session_factory,
)


def get_engine(database_url: Optional[str] = None) -> Engine:
    """Retorna o SQLAlchemy Engine configurado a partir de scripts.shared."""
    return _shared_get_engine(database_url)


def get_session(engine: Optional[Engine] = None):
    """Retorna context manager de sessão transacional a partir de scripts.shared."""
    return _shared_get_session(engine)


__all__ = ["get_engine", "get_session", "get_session_factory"]

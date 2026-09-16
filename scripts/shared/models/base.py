"""Classe base declarativa do SQLAlchemy compartilhada entre todos os modelos."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa única para todo o ecossistema de scripts."""
    pass

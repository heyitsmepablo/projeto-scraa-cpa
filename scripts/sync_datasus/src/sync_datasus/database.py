from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String,
    DateTime,
    Integer,
    Numeric,
    Text,
    create_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    sessionmaker,
)
from sqlalchemy.engine import Engine

class Base(DeclarativeBase):
    pass

class DatasusImportacao(Base):
    __tablename__ = "datasus_importacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    competencia: Mapped[str] = mapped_column(String(6))
    sistemaOrigem: Mapped[str] = mapped_column("sistema_origem", String(10))
    dataInicio: Mapped[datetime] = mapped_column("data_inicio", DateTime, default=datetime.utcnow)
    dataFim: Mapped[Optional[datetime]] = mapped_column("data_fim", DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20))
    arquivosAfetados: Mapped[Optional[str]] = mapped_column("arquivos_afetados", Text, nullable=True)
    registrosProcessados: Mapped[Optional[int]] = mapped_column("registros_processados", Integer, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DatasusSihRd(Base):
    __tablename__ = "datasus_sih_tb_rd"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    anoCmpt: Mapped[str] = mapped_column("ANO_CMPT", String(4))
    mesCmpt: Mapped[str] = mapped_column("MES_CMPT", String(2))
    diInter: Mapped[Optional[str]] = mapped_column("DI_INTER", String(8), nullable=True)
    procRea: Mapped[str] = mapped_column("PROC_REA", String(10))
    cnes: Mapped[str] = mapped_column("CNES", String(7))
    valTot: Mapped[float] = mapped_column("VAL_TOT", Numeric(14, 2))
    qtDiarias: Mapped[float] = mapped_column("QT_DIARIAS", Numeric(3, 0))
    ufZi: Mapped[str] = mapped_column("UF_ZI", String(6))
    financ: Mapped[str] = mapped_column("FINANC", String(2))
    complex: Mapped[str] = mapped_column("COMPLEX", String(2))
    procSolic: Mapped[Optional[str]] = mapped_column("PROC_SOLIC", String(10), nullable=True)
    diagPrinc: Mapped[Optional[str]] = mapped_column("DIAG_PRINC", String(4), nullable=True)

class DatasusSiaPa(Base):
    __tablename__ = "datasus_sia_tb_pa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paMvm: Mapped[str] = mapped_column("PA_MVM", String(6))
    paCmp: Mapped[str] = mapped_column("PA_CMP", String(6))
    paProcId: Mapped[str] = mapped_column("PA_PROC_ID", String(10))
    paCoduni: Mapped[str] = mapped_column("PA_CODUNI", String(7))
    paValpro: Mapped[float] = mapped_column("PA_VALPRO", Numeric(20, 2))
    paValapr: Mapped[float] = mapped_column("PA_VALAPR", Numeric(20, 2))
    paQtdpro: Mapped[float] = mapped_column("PA_QTDPRO", Numeric(11, 0))
    paQtdapr: Mapped[float] = mapped_column("PA_QTDAPR", Numeric(11, 0))
    paGestao: Mapped[str] = mapped_column("PA_GESTAO", String(6))
    paTpfin: Mapped[str] = mapped_column("PA_TPFIN", String(2))
    paNivcpl: Mapped[str] = mapped_column("PA_NIVCPL", String(1))
    paSubfin: Mapped[Optional[str]] = mapped_column("PA_SUBFIN", String(4), nullable=True)
    paCnpjCpf: Mapped[Optional[str]] = mapped_column("PA_CNPJCPF", String(14), nullable=True)

class Instituicao(Base):
    __tablename__ = "instituicao"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cnes: Mapped[str] = mapped_column(String(7))
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

def get_engine(url: str) -> Engine:
    """Create and return a SQLAlchemy engine."""
    return create_engine(url, pool_pre_ping=True)

def get_session_factory(engine: Engine) -> sessionmaker:
    """Create and return a configured session factory."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

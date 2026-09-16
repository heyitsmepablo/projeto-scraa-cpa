"""Modelos SQLAlchemy para as tabelas de dados brutos e importação do DATASUS."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from scripts.shared.models.base import Base


class DatasusImportacao(Base):
    """Metadados e controle de execução do pipeline DATASUS."""
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


class DatasusSihTbRd(Base):
    """Produção hospitalar (SIH/RD) do DATASUS."""
    __tablename__ = "datasus_sih_tb_rd"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    anoCmpt: Mapped[str] = mapped_column("ANO_CMPT", String(4))
    mesCmpt: Mapped[str] = mapped_column("MES_CMPT", String(2))
    diInter: Mapped[Optional[str]] = mapped_column("DI_INTER", String(8), nullable=True)
    procRea: Mapped[str] = mapped_column("PROC_REA", String(10))
    cnes: Mapped[str] = mapped_column("CNES", String(7))
    valTot: Mapped[Decimal] = mapped_column("VAL_TOT", Numeric(14, 2))
    qtDiarias: Mapped[Decimal] = mapped_column("QT_DIARIAS", Numeric(3, 0))
    ufZi: Mapped[str] = mapped_column("UF_ZI", String(6))
    financ: Mapped[str] = mapped_column("FINANC", String(2))
    complex: Mapped[str] = mapped_column("COMPLEX", String(2))
    procSolic: Mapped[Optional[str]] = mapped_column("PROC_SOLIC", String(10), nullable=True)
    diagPrinc: Mapped[Optional[str]] = mapped_column("DIAG_PRINC", String(4), nullable=True)

    __table_args__ = (
        Index("datasus_sih_tb_rd_cnes_ano_cmpt_mes_cmpt_idx", "CNES", "ANO_CMPT", "MES_CMPT"),
    )


class DatasusSiaTbPa(Base):
    """Produção ambulatorial (SIA/PA) do DATASUS."""
    __tablename__ = "datasus_sia_tb_pa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paMvm: Mapped[str] = mapped_column("PA_MVM", String(6))
    paCmp: Mapped[str] = mapped_column("PA_CMP", String(6))
    paProcId: Mapped[str] = mapped_column("PA_PROC_ID", String(10))
    paCoduni: Mapped[str] = mapped_column("PA_CODUNI", String(7))
    paValpro: Mapped[Decimal] = mapped_column("PA_VALPRO", Numeric(20, 2))
    paValapr: Mapped[Decimal] = mapped_column("PA_VALAPR", Numeric(20, 2))
    paQtdpro: Mapped[Decimal] = mapped_column("PA_QTDPRO", Numeric(11, 0))
    paQtdapr: Mapped[Decimal] = mapped_column("PA_QTDAPR", Numeric(11, 0))
    paGestao: Mapped[str] = mapped_column("PA_GESTAO", String(6))
    paTpfin: Mapped[str] = mapped_column("PA_TPFIN", String(2))
    paNivcpl: Mapped[str] = mapped_column("PA_NIVCPL", String(1))
    paSubfin: Mapped[Optional[str]] = mapped_column("PA_SUBFIN", String(4), nullable=True)
    paCnpjCpf: Mapped[Optional[str]] = mapped_column("PA_CNPJCPF", String(14), nullable=True)

    __table_args__ = (
        Index("datasus_sia_tb_pa_pa_coduni_pa_cmp_idx", "PA_CODUNI", "PA_CMP"),
    )


# Aliases para compatibilidade
DatasusSihRd = DatasusSihTbRd
DatasusSiaPa = DatasusSiaTbPa

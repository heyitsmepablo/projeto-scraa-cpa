"""Modelos SQLAlchemy para as entidades administrativas e de contratos do CPA."""

from datetime import datetime, date
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    ARRAY,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ENUM, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scripts.shared.models.base import Base

# Enums mapeados do PostgreSQL / Prisma
tipo_vinculo_enum = ENUM("CONVÊNIO", "CONTRATO", name="TipoVinculo", create_type=False)
tipo_instituicao_enum = ENUM("FILANTRÓPICO", "EMPRESA", name="TipoInstituicao", create_type=False)
tipo_aditivo_enum = ENUM("ACRÉSCIMO", "SUPRESSÃO", "PRAZO", name="TipoAditivo", create_type=False)
tipo_operacao_enum = ENUM("INSERT", "UPDATE", "DELETE", name="TipoOperacao", create_type=False)
tipo_complexidade_enum = ENUM("BC", "MC", "AC", name="TipoComplexidade", create_type=False)


class CpaImportacao(Base):
    """Registro de lotes de importação do CPA."""
    __tablename__ = "cpa_importacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    versao: Mapped[str] = mapped_column(String(6))
    dataInicio: Mapped[datetime] = mapped_column("data_inicio", DateTime(timezone=True), default=datetime.utcnow)
    dataFim: Mapped[Optional[datetime]] = mapped_column("data_fim", DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20))
    tabelasAfetadas: Mapped[Optional[str]] = mapped_column("tabelas_afetadas", Text, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class CpaImportacaoChangelog(Base):
    """Histórico de alterações ocorridas durante importações do CPA."""
    __tablename__ = "cpa_importacao_changelog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    importacaoId: Mapped[int] = mapped_column("importacao_id", Integer)
    tabela: Mapped[str] = mapped_column(String(50))
    chaveRegistro: Mapped[str] = mapped_column("chave_registro", String(50))
    descricaoRegistro: Mapped[Optional[str]] = mapped_column("descricao_registro", Text, nullable=True)
    tipoOperacao: Mapped[str] = mapped_column("tipo_operacao", tipo_operacao_enum)
    dadosAntigos: Mapped[Optional[Dict[str, Any]]] = mapped_column("dados_antigos", JSON, nullable=True)
    dadosNovos: Mapped[Optional[Dict[str, Any]]] = mapped_column("dados_novos", JSON, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)


class Instituicao(Base):
    """Estabelecimento de saúde mantenedor dos vínculos."""
    __tablename__ = "instituicao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(150))
    cnes: Mapped[str] = mapped_column(String(7), index=True)
    cnpj: Mapped[Optional[str]] = mapped_column(String(14), nullable=True, index=True)
    tipoInstituicao: Mapped[str] = mapped_column("tipo_instituicao", tipo_instituicao_enum)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    vinculos: Mapped[List["Vinculo"]] = relationship("Vinculo", back_populates="instituicao")


class Vinculo(Base):
    """Contrato ou convênio formal entre poder público e a instituição."""
    __tablename__ = "vinculo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instituicaoId: Mapped[int] = mapped_column("instituicao_id", Integer, ForeignKey("instituicao.id"), index=True)
    numero: Mapped[str] = mapped_column(String(50), index=True)
    numeroProcessoSei: Mapped[str] = mapped_column("numero_processo_sei", String(50))
    tipoVinculo: Mapped[str] = mapped_column("tipo_vinculo", tipo_vinculo_enum)
    objeto: Mapped[str] = mapped_column(Text)
    complexidade: Mapped[List[str]] = mapped_column(ARRAY(tipo_complexidade_enum))
    dataDaAssinatura: Mapped[datetime] = mapped_column("data_da_assinatura", DateTime(timezone=True))
    dataInicio: Mapped[date] = mapped_column("data_inicio", Date)
    dataFim: Mapped[Optional[date]] = mapped_column("data_fim", Date, nullable=True)
    valorTotal: Mapped[Decimal] = mapped_column("valor_total", Numeric(15, 2))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    instituicao: Mapped["Instituicao"] = relationship("Instituicao", back_populates="vinculos")
    aditivos: Mapped[List["Aditivo"]] = relationship("Aditivo", back_populates="vinculo")
    planosOperativos: Mapped[List["PlanoOperativo"]] = relationship("PlanoOperativo", back_populates="vinculo")


class Aditivo(Base):
    """Termo aditivo vinculado a um contrato."""
    __tablename__ = "aditivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vinculoId: Mapped[int] = mapped_column("vinculo_id", Integer, ForeignKey("vinculo.id"), index=True)
    numero: Mapped[str] = mapped_column(String(50), index=True)
    numeroProcessoSei: Mapped[str] = mapped_column("numero_processo_sei", String(50))
    tipoAditivo: Mapped[List[str]] = mapped_column("tipo_aditivo", ARRAY(tipo_aditivo_enum))
    dataDaAssinatura: Mapped[date] = mapped_column("data_da_assinatura", Date)
    dataInicio: Mapped[date] = mapped_column("data_inicio", Date)
    dataFim: Mapped[date] = mapped_column("data_fim", Date)
    valorTotal: Mapped[Optional[Decimal]] = mapped_column("valor_total", Numeric(15, 2), nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    vinculo: Mapped["Vinculo"] = relationship("Vinculo", back_populates="aditivos")
    planosOperativos: Mapped[List["PlanoOperativo"]] = relationship("PlanoOperativo", back_populates="aditivo")


class PlanoOperativo(Base):
    """Plano operativo vigente ou histórico de um vínculo/aditivo."""
    __tablename__ = "plano_operativo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vinculoId: Mapped[int] = mapped_column("vinculo_id", Integer, ForeignKey("vinculo.id"), index=True)
    aditivoId: Mapped[Optional[int]] = mapped_column("aditivo_id", Integer, ForeignKey("aditivo.id"), nullable=True, index=True)
    vigente: Mapped[bool] = mapped_column(Boolean, default=True)
    expiradoEm: Mapped[Optional[datetime]] = mapped_column("expirado_em", DateTime(timezone=True), nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    vinculo: Mapped["Vinculo"] = relationship("Vinculo", back_populates="planosOperativos")
    aditivo: Mapped[Optional["Aditivo"]] = relationship("Aditivo", back_populates="planosOperativos")
    procedimentos: Mapped[List["PlanoOperativoProcedimento"]] = relationship("PlanoOperativoProcedimento", back_populates="planoOperativo")
    planoOperativoComplementacaos: Mapped[List["PlanoOperativoComplementacao"]] = relationship(
        "PlanoOperativoComplementacao", back_populates="planoOperativo"
    )


class PlanoOperativoProcedimento(Base):
    """Procedimento pactuado mensalmente em um Plano Operativo."""
    __tablename__ = "plano_operativo_procedimento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    planoOperativoId: Mapped[int] = mapped_column("plano_operativo_id", Integer, ForeignKey("plano_operativo.id"))
    coProcedimento: Mapped[str] = mapped_column("co_procedimento", String(10), index=True)
    quantidadePactuadaMensal: Mapped[int] = mapped_column("quantidade_pactuada_mensal", Integer)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    planoOperativo: Mapped["PlanoOperativo"] = relationship("PlanoOperativo", back_populates="procedimentos")


class ComplementacaoTipo(Base):
    """Tipo/categoria de complementação orçamentária ou incentivo."""
    __tablename__ = "complementacao_tipo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(255))
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    itens: Mapped[List["ComplementacaoItem"]] = relationship("ComplementacaoItem", back_populates="complementacaoTipo")


class ComplementacaoItem(Base):
    """Item de complementação associado a um tipo."""
    __tablename__ = "complementacao_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complementacaoTipoId: Mapped[int] = mapped_column("complementacao_tipo_id", Integer, ForeignKey("complementacao_tipo.id"))
    descricao: Mapped[str] = mapped_column(String(255))
    valorUnitario: Mapped[Decimal] = mapped_column("valor_unitario", Numeric(15, 2))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    complementacaoTipo: Mapped["ComplementacaoTipo"] = relationship("ComplementacaoTipo", back_populates="itens")
    planoOperativoComplementacaos: Mapped[List["PlanoOperativoComplementacao"]] = relationship(
        "PlanoOperativoComplementacao", back_populates="complementacaoItem"
    )


class PlanoOperativoComplementacao(Base):
    """Associação de complementações com o plano operativo."""
    __tablename__ = "plano_operativo_complementacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    planoOperativoId: Mapped[int] = mapped_column("plano_operativo_id", Integer, ForeignKey("plano_operativo.id"))
    complementacaoItemId: Mapped[int] = mapped_column("complementacao_item_id", Integer, ForeignKey("complementacao_item.id"))
    quantidadePactuadaMensal: Mapped[int] = mapped_column("quantidade_pactuada_mensal", Integer)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime(timezone=True), default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deletadoEm: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime(timezone=True), nullable=True)

    planoOperativo: Mapped["PlanoOperativo"] = relationship("PlanoOperativo", back_populates="planoOperativoComplementacaos")
    complementacaoItem: Mapped["ComplementacaoItem"] = relationship("ComplementacaoItem", back_populates="planoOperativoComplementacaos")

    __table_args__ = (
        UniqueConstraint("plano_operativo_id", "complementacao_item_id", name="plano_operativo_complementacao_plano_operativo_id_complem_key"),
    )

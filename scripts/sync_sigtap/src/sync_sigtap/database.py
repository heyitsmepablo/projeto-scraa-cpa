from datetime import datetime
from typing import Any, Optional, Dict
from sqlalchemy import (
    String,
    DateTime,
    Integer,
    Numeric,
    Text,
    JSON,
    Enum,
    create_engine,
    ForeignKey,
    Index
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    sessionmaker,
    relationship
)
from sqlalchemy.engine import Engine

class Base(DeclarativeBase):
    pass

class SigtapImportacao(Base):
    __tablename__ = "sigtap_importacao"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    competencia: Mapped[str] = mapped_column(String(6))
    dataInicio: Mapped[datetime] = mapped_column("data_inicio", DateTime, default=datetime.utcnow)
    dataFim: Mapped[Optional[datetime]] = mapped_column("data_fim", DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20))
    tabelasAfetadas: Mapped[Optional[str]] = mapped_column("tabelas_afetadas", Text, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    changelogs: Mapped[list["SigtapChangelog"]] = relationship(back_populates="importacao")

class SigtapChangelog(Base):
    __tablename__ = "sigtap_changelog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    importacaoId: Mapped[int] = mapped_column("importacao_id", Integer, ForeignKey("sigtap_importacao.id", ondelete="CASCADE"))
    tabela: Mapped[str] = mapped_column(String(50))
    chaveRegistro: Mapped[str] = mapped_column("chave_registro", String(50))
    descricaoRegistro: Mapped[Optional[str]] = mapped_column("descricao_registro", Text, nullable=True)
    tipoOperacao: Mapped[str] = mapped_column("tipo_operacao", Enum("INSERT", "UPDATE", "DELETE", name="TipoOperacao", create_type=False))  # INSERT, UPDATE, DELETE (mapped to Enum in prisma)
    dadosAntigos: Mapped[Optional[Dict[str, Any]]] = mapped_column("dados_antigos", JSON, nullable=True)
    dadosNovos: Mapped[Optional[Dict[str, Any]]] = mapped_column("dados_novos", JSON, nullable=True)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    
    importacao: Mapped[SigtapImportacao] = relationship(back_populates="changelogs")

    __table_args__ = (
        Index("sigtap_changelog_importacao_id_idx", "importacao_id"),
        Index("sigtap_changelog_chave_registro_idx", "chave_registro"),
        Index("sigtap_changelog_tabela_tipo_operacao_idx", "tabela", "tipo_operacao"),
    )

class SigtapProcedimento(Base):
    __tablename__ = "sigtap_tb_procedimento"

    coProcedimento: Mapped[str] = mapped_column("co_procedimento", String(10), primary_key=True)
    noProcedimento: Mapped[str] = mapped_column("no_procedimento", String(250))
    tpComplexidade: Mapped[str] = mapped_column("tp_complexidade", String(1))
    tpSexo: Mapped[str] = mapped_column("tp_sexo", String(1))
    qtMaximaExecucao: Mapped[int] = mapped_column("qt_maxima_execucao", Integer)
    qtDiasPermanencia: Mapped[int] = mapped_column("qt_dias_permanencia", Integer)
    qtPontos: Mapped[int] = mapped_column("qt_pontos", Integer)
    vlIdadeMinima: Mapped[int] = mapped_column("vl_idade_minima", Integer)
    vlIdadeMaxima: Mapped[int] = mapped_column("vl_idade_maxima", Integer)
    vlSh: Mapped[float] = mapped_column("vl_sh", Numeric(12, 2))
    vlSa: Mapped[float] = mapped_column("vl_sa", Numeric(12, 2))
    vlSp: Mapped[float] = mapped_column("vl_sp", Numeric(12, 2))
    coFinanciamento: Mapped[str] = mapped_column("co_financiamento", String(2))
    coRubrica: Mapped[Optional[str]] = mapped_column("co_rubrica", String(6), nullable=True)
    qtTempoPermanencia: Mapped[int] = mapped_column("qt_tempo_permanencia", Integer)
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

def get_engine(url: str) -> Engine:
    return create_engine(url)

def get_session_factory(engine: Engine) -> sessionmaker:
    return sessionmaker(bind=engine)

class SigtapFinanciamento(Base):
    __tablename__ = "sigtap_tb_financiamento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    coFinanciamento: Mapped[str] = mapped_column("co_financiamento", String(2), unique=True)
    noFinanciamento: Mapped[str] = mapped_column("no_financiamento", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapRubrica(Base):
    __tablename__ = "sigtap_tb_rubrica"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    coRubrica: Mapped[str] = mapped_column("co_rubrica", String(6), unique=True)
    noRubrica: Mapped[str] = mapped_column("no_rubrica", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapDetalhe(Base):
    __tablename__ = "sigtap_tb_detalhe"

    coDetalhe: Mapped[str] = mapped_column("co_detalhe", String(3), primary_key=True)
    noDetalhe: Mapped[str] = mapped_column("no_detalhe", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapDescricaoDetalhe(Base):
    __tablename__ = "sigtap_tb_descricao_detalhe"

    coDetalhe: Mapped[str] = mapped_column("co_detalhe", String(3), primary_key=True)
    dsDetalhe: Mapped[str] = mapped_column("ds_detalhe", String(4000))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapRegistro(Base):
    __tablename__ = "sigtap_tb_registro"

    coRegistro: Mapped[str] = mapped_column("co_registro", String(2), primary_key=True)
    noRegistro: Mapped[str] = mapped_column("no_registro", String(50))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapServico(Base):
    __tablename__ = "sigtap_tb_servico"

    coServico: Mapped[str] = mapped_column("co_servico", String(3), primary_key=True)
    noServico: Mapped[str] = mapped_column("no_servico", String(120))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapServicoClassificacao(Base):
    __tablename__ = "sigtap_tb_servico_classificacao"

    coServico: Mapped[str] = mapped_column("co_servico", String(3), primary_key=True)
    coClassificacao: Mapped[str] = mapped_column("co_classificacao", String(3))
    noClassificacao: Mapped[str] = mapped_column("no_classificacao", String(150))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapModalidade(Base):
    __tablename__ = "sigtap_tb_modalidade"

    coModalidade: Mapped[str] = mapped_column("co_modalidade", String(2), primary_key=True)
    noModalidade: Mapped[str] = mapped_column("no_modalidade", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapTipoLeito(Base):
    __tablename__ = "sigtap_tb_tipo_leito"

    coTipoLeito: Mapped[str] = mapped_column("co_tipo_leito", String(2), primary_key=True)
    noTipoLeito: Mapped[str] = mapped_column("no_tipo_leito", String(60))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapCid(Base):
    __tablename__ = "sigtap_tb_cid"

    coCid: Mapped[str] = mapped_column("co_cid", String(4), primary_key=True)
    noCid: Mapped[str] = mapped_column("no_cid", String(100))
    tpAgravo: Mapped[str] = mapped_column("tp_agravo", String(1))
    tpSexo: Mapped[str] = mapped_column("tp_sexo", String(1))
    tpEstadio: Mapped[str] = mapped_column("tp_estadio", String(1))
    vlCamposIrradiados: Mapped[int] = mapped_column("vl_campos_irradiados", Integer)
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapOcupacao(Base):
    __tablename__ = "sigtap_tb_ocupacao"

    coOcupacao: Mapped[str] = mapped_column("co_ocupacao", String(6), primary_key=True)
    noOcupacao: Mapped[str] = mapped_column("no_ocupacao", String(150))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapHabilitacao(Base):
    __tablename__ = "sigtap_tb_habilitacao"

    coHabilitacao: Mapped[str] = mapped_column("co_habilitacao", String(4), primary_key=True)
    noHabilitacao: Mapped[str] = mapped_column("no_habilitacao", String(150))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapGrupo(Base):
    __tablename__ = "sigtap_tb_grupo"

    coGrupo: Mapped[str] = mapped_column("co_grupo", String(2), primary_key=True)
    noGrupo: Mapped[str] = mapped_column("no_grupo", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapSubGrupo(Base):
    __tablename__ = "sigtap_tb_sub_grupo"

    coGrupo: Mapped[str] = mapped_column("co_grupo", String(2), primary_key=True)
    coSubGrupo: Mapped[str] = mapped_column("co_sub_grupo", String(2))
    noSubGrupo: Mapped[str] = mapped_column("no_sub_grupo", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapFormaOrganizacao(Base):
    __tablename__ = "sigtap_tb_forma_organizacao"

    coGrupo: Mapped[str] = mapped_column("co_grupo", String(2), primary_key=True)
    coSubGrupo: Mapped[str] = mapped_column("co_sub_grupo", String(2))
    coFormaOrganizacao: Mapped[str] = mapped_column("co_forma_organizacao", String(2))
    noFormaOrganizacao: Mapped[str] = mapped_column("no_forma_organizacao", String(100))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapSiaSih(Base):
    __tablename__ = "sigtap_tb_sia_sih"

    coProcedimentoSiaSih: Mapped[str] = mapped_column("co_procedimento_sia_sih", String(10), primary_key=True)
    noProcedimentoSiaSih: Mapped[str] = mapped_column("no_procedimento_sia_sih", String(100))
    tpProcedimento: Mapped[str] = mapped_column("tp_procedimento", String(1), primary_key=True)
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapGrupoHabilitacao(Base):
    __tablename__ = "sigtap_tb_grupo_habilitacao"

    nuGrupoHabilitacao: Mapped[str] = mapped_column("nu_grupo_habilitacao", String(4), primary_key=True)
    noGrupoHabilitacao: Mapped[str] = mapped_column("no_grupo_habilitacao", String(20))
    dsGrupoHabilitacao: Mapped[str] = mapped_column("ds_grupo_habilitacao", String(250))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapDescricao(Base):
    __tablename__ = "sigtap_tb_descricao"

    coProcedimento: Mapped[str] = mapped_column("co_procedimento", String(10), primary_key=True)
    dsProcedimento: Mapped[str] = mapped_column("ds_procedimento", String(4000))
    dtCompetencia: Mapped[str] = mapped_column("dt_competencia", String(6))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapRegraCondicionada(Base):
    __tablename__ = "sigtap_tb_regra_condicionada"

    coRegraCondicionada: Mapped[str] = mapped_column("co_regra_condicionada", String(4), primary_key=True)
    noRegraCondicionada: Mapped[str] = mapped_column("no_regra_condicionada", String(150))
    dsRegraCondicionada: Mapped[str] = mapped_column("ds_regra_condicionada", String(4000))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapRedeAtencao(Base):
    __tablename__ = "sigtap_tb_rede_atencao"

    coRedeAtencao: Mapped[str] = mapped_column("co_rede_atencao", String(3), primary_key=True)
    noRedeAtencao: Mapped[str] = mapped_column("no_rede_atencao", String(50))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapComponenteRede(Base):
    __tablename__ = "sigtap_tb_componente_rede"

    coComponenteRede: Mapped[str] = mapped_column("co_componente_rede", String(10), primary_key=True)
    noComponenteRede: Mapped[str] = mapped_column("no_componente_rede", String(150))
    coRedeAtencao: Mapped[str] = mapped_column("co_rede_atencao", String(3))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapTuss(Base):
    __tablename__ = "sigtap_tb_tuss"

    coTuss: Mapped[str] = mapped_column("co_tuss", String(10), primary_key=True)
    noTuss: Mapped[str] = mapped_column("no_tuss", String(450))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)

class SigtapRenases(Base):
    __tablename__ = "sigtap_tb_renases"

    coRenases: Mapped[str] = mapped_column("co_renases", String(10), primary_key=True)
    noRenases: Mapped[str] = mapped_column("no_renases", String(150))
    criadoEm: Mapped[datetime] = mapped_column("criado_em", DateTime, default=datetime.utcnow)
    atualizadoEm: Mapped[datetime] = mapped_column("atualizado_em", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deletedAt: Mapped[Optional[datetime]] = mapped_column("deletado_em", DateTime, nullable=True)


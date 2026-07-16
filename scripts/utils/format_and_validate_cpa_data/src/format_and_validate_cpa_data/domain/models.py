from dataclasses import dataclass

@dataclass(frozen=True)
class CodigoSigtap:
    valor: str

@dataclass(frozen=True)
class ProcedimentoSigtap:
    co_procedimento: str
    no_procedimento: str

@dataclass(frozen=True)
class InconsistenciaRegistro:
    linha_excel: int
    instituicao: str | None
    cnes: str | None
    plano_operativo: str
    vinculo: str
    aditivo: str | None
    codigo_atual: str
    descricao_planilha: str | None
    quantidade_mensal_pactuada: str | None

@dataclass(frozen=True)
class CorrectionLogEntry:
    linha_excel: int
    instituicao: str | None
    vinculo: str | None
    cnes: str | None
    aditivo: str | None
    codigo_original: str
    codigo_corrigido: str
    modo_correcao: str
    procedimento_nome: str | None = None

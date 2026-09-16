"""Extractor: reads and validates the CPA spreadsheet sheets."""

import logging
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import NamedTuple, Union
import re

import pandas as pd

logger = logging.getLogger(__name__)


def _load_sheet(source: Union[Path, pd.ExcelFile, str], sheet_name: str) -> pd.DataFrame:
    """Lê uma aba da planilha reaproveitando um pd.ExcelFile aberto ou abrindo o arquivo."""
    if isinstance(source, pd.ExcelFile):
        return pd.read_excel(source, sheet_name=sheet_name, dtype=str)
    p = Path(source)
    if not p.exists():
        raise FileNotFoundError(f"Planilha não encontrada: {p}")
    return pd.read_excel(p, sheet_name=sheet_name, dtype=str)


SHEET_INSTITUICOES = "INSTITUICOES"
SHEET_VINCULOS = "VINCULOS"
SHEET_ADITIVOS = "ADITIVOS"

# ── Column mappings: spreadsheet header → internal field name ─────────────────

_COL_INSTITUICOES: dict[str, str] = {
    "ESTABELECIMENTO": "nome",
    "CNES": "cnes",
    "CNPJ": "cnpj",
    "TIPO DE INSTITUIÇÃO": "tipo_instituicao",
}

_COL_VINCULOS: dict[str, str] = {
    "CNES": "cnes",
    "NUMERO DO VINCULO": "numero",
    "NUMERO DO PROCESSO ORIGINAL": "numero_processo_sei",
    "TIPO DO VINCULO": "tipo_vinculo",
    "OBJETO": "objeto",
    "COMPLEXIDADE": "complexidade",
    "VALOR DO DOCUMENTO ORIGINAL (ANUAL)": "valor_total",
    "DATA DA ASSINATURA": "data_da_assinatura",
    "DATA DE INÍCIO": "data_inicio",
    "DATA DE FINALIZAÇÃO": "data_fim",
}

# Columns present in VINCULOS that are intentionally not mapped to the DB.
_VINCULOS_IGNORED_COLS: frozenset[str] = frozenset(
    {"ESTABELECIMENTO"}
)

_COL_ADITIVOS: dict[str, str] = {
    "CNES": "cnes",
    "NUMERO DO VINCULO": "numero_vinculo",
    "NUMERO DO ADITIVO": "numero",
    "NUMERO DO PROCESSO DO ADITIVO": "numero_processo_sei",
    "TIPO ADITIVO (ACRÉSCIMO,PRAZO,SUPRESSÃO)": "tipo_aditivo",
    "DATA DE INICIO": "data_inicio",
    "DATA DE FIM": "data_fim",
    "DATA DA ASSINATURA": "data_da_assinatura",
    "VALOR DO ADITIVO": "valor_total",
}

_ADITIVOS_IGNORED_COLS: frozenset[str] = frozenset(
    {"ESTABELECIMENTO"}
)

# ── Enum normalization: accent-stripped key → DB enum value ──────────────────

_TIPO_INSTITUICAO_NORM: dict[str, str] = {
    "FILANTROPICO": "FILANTRÓPICO",
    "EMPRESA": "EMPRESA",
}

_TIPO_VINCULO_NORM: dict[str, str] = {
    "CONVENIO": "CONVÊNIO",
    "CONTRATO": "CONTRATO",
}

_TIPO_COMPLEXIDADE_NORM: dict[str, str] = {
    "BC": "BC",
    "MC": "MC",
    "AC": "AC",
}


def _parse_date(val: object) -> datetime | None:
    """Safely parses a date string or timestamp to a Python datetime."""
    s = _safe_str(val)
    if not s or s.lower() == 'nan' or s.lower() == 'nat':
        return None
    try:
        parsed = pd.to_datetime(s, dayfirst=True)
        return None if pd.isna(parsed) else parsed.to_pydatetime()
    except Exception:
        return None


class ExtractionResult(NamedTuple):
    """Result of a single sheet extraction.

    Attributes:
        data: Cleaned DataFrame ready to be loaded.
        total: Total number of rows read from the sheet.
        invalid: Number of rows that were skipped due to validation errors.
        details: Optional dictionary with granular reasons for invalid rows.
    """

    data: pd.DataFrame
    total: int
    invalid: int
    details: dict = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _clean_column_name(c: object) -> str:
    """Normalize column names by removing newlines and collapsing spaces."""
    return re.sub(r'\s+', ' ', str(c)).strip()


def _keep_digits(value: object) -> str:
    """Remove all non-digit characters from a string."""
    return re.sub(r'\D', '', str(value))


def _strip_accents(value: str) -> str:
    """Remove diacritics from a string for case-insensitive enum matching."""
    nfkd = unicodedata.normalize("NFKD", value)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _normalize_enum_key(raw: object) -> str:
    """Normalize a raw cell value to a consistent enum lookup key."""
    if pd.isna(raw):
        return ""
    return _strip_accents(str(raw).strip().upper())


def _safe_str(raw: object) -> str:
    """Return a stripped string or empty string for NaN/None."""
    if pd.isna(raw):
        return ""
    return str(raw).strip()


# ── Public extractors ─────────────────────────────────────────────────────────


def extract_instituicoes(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    """Read and validate the INSTITUICOES sheet."""
    df: pd.DataFrame = _load_sheet(path, SHEET_INSTITUICOES)
    df.columns = [_clean_column_name(c) for c in df.columns]

    # CNPJ is optional in the spreadsheet — falls back to "" if the column
    # is absent or the cell is empty (backwards-compatible with older sheets).
    _REQUIRED_COLS = {"ESTABELECIMENTO", "CNES", "TIPO DE INSTITUIÇÃO"}
    missing = _REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_INSTITUICOES}: {missing}")

    # Only rename/keep columns that are actually present
    present_map = {k: v for k, v in _COL_INSTITUICOES.items() if k in df.columns}
    df = df.rename(columns=present_map)[list(present_map.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):  # start=2 → Excel row
        nome = _safe_str(row["nome"])
        if not nome:
            logger.warning("INSTITUICOES linha %d: ESTABELECIMENTO vazio — ignorado.", sheet_row)
            invalid += 1
            continue

        raw_cnes = _keep_digits(row["cnes"])
        if not raw_cnes:
            logger.warning("INSTITUICOES linha %d: CNES vazio ou inválido — ignorado.", sheet_row)
            invalid += 1
            continue
        cnes = raw_cnes.zfill(7)

        tipo_key = _normalize_enum_key(row["tipo_instituicao"])
        tipo_instituicao = _TIPO_INSTITUICAO_NORM.get(tipo_key)
        if tipo_instituicao is None:
            logger.warning(
                "INSTITUICOES linha %d: tipo_instituicao inválido '%s'. "
                "Valores aceitos: %s — ignorado.",
                sheet_row,
                row["tipo_instituicao"],
                list(_TIPO_INSTITUICAO_NORM.values()),
            )
            invalid += 1
            continue

        # ── CNPJ ──
        raw_cnpj = _keep_digits(row.get("cnpj", ""))
        cnpj_final = None
        if raw_cnpj:
            if len(raw_cnpj) != 14:
                logger.warning(
                    "INSTITUICOES linha %d: CNPJ com tamanho inválido '%s'. A instituição será inserida sem CNPJ.",
                    sheet_row,
                    raw_cnpj
                )
            else:
                cnpj_final = raw_cnpj

        valid_rows.append(
            {
                "nome": nome,
                "cnes": cnes,
                "cnpj": cnpj_final,
                "tipo_instituicao": tipo_instituicao,
            }
        )

    logger.info(
        "[%s] %d linhas lidas — %d válidas, %d ignoradas.",
        SHEET_INSTITUICOES,
        total,
        len(valid_rows),
        invalid,
    )
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


def extract_vinculos(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    """Read and validate the VINCULOS sheet."""
    df: pd.DataFrame = _load_sheet(path, SHEET_VINCULOS)
    df.columns = [_clean_column_name(c) for c in df.columns]

    for col in df.columns:
        if col in _VINCULOS_IGNORED_COLS:
            logger.warning("VINCULOS: coluna '%s' não tem campo correspondente no banco — será ignorada.", col)

    missing = set(_COL_VINCULOS) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_VINCULOS}: {missing}")

    df = df.rename(columns=_COL_VINCULOS)[list(_COL_VINCULOS.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        # ── CNES ──
        raw_cnes = _keep_digits(row["cnes"])
        if not raw_cnes:
            logger.warning("VINCULOS linha %d: CNES vazio ou inválido — ignorado.", sheet_row)
            invalid += 1
            continue
        cnes = raw_cnes.zfill(7)

        # ── Número ──
        numero = _safe_str(row["numero"])
        if not numero:
            logger.warning("VINCULOS linha %d: NUMERO DO VINCULO vazio — ignorado.", sheet_row)
            invalid += 1
            continue

        numero_processo_sei = _safe_str(row.get("numero_processo_sei", ""))


        # ── Tipo vínculo ──
        tipo_key = _normalize_enum_key(row["tipo_vinculo"])
        tipo_vinculo = _TIPO_VINCULO_NORM.get(tipo_key)
        if tipo_vinculo is None:
            logger.warning(
                "VINCULOS linha %d: tipo_vinculo inválido '%s'. "
                "Valores aceitos: %s — ignorado.",
                sheet_row,
                row["tipo_vinculo"],
                list(_TIPO_VINCULO_NORM.values()),
            )
            invalid += 1
            continue

        # ── Objeto e Complexidade ──
        objeto = _safe_str(row.get("objeto", ""))
        
        raw_complexidade = _safe_str(row.get("complexidade", ""))
        complexidade = []
        if raw_complexidade:
            for p in raw_complexidade.split(","):
                norm_p = _normalize_enum_key(p)
                if norm_p in _TIPO_COMPLEXIDADE_NORM:
                    complexidade.append(_TIPO_COMPLEXIDADE_NORM[norm_p])
                else:
                    logger.warning("VINCULOS linha %d: complexidade desconhecida '%s' ignorada.", sheet_row, p.strip())

        # ── Valor monetário ──
        raw_valor = _safe_str(row["valor_total"])
        try:
            # Handles Brazilian format: "R$ 1.234,56" → 1234.56
            valor = float(
                raw_valor.replace("R$", "").replace(".", "").replace(",", ".").strip()
            )
        except ValueError:
            logger.warning(
                "VINCULOS linha %d: valor_total inválido '%s' — ignorado.",
                sheet_row,
                raw_valor,
            )
            invalid += 1
            continue

        # ── Datas obrigatórias ──
        try:
            data_assinatura = pd.to_datetime(row["data_da_assinatura"], dayfirst=True).to_pydatetime()
            data_inicio = pd.to_datetime(row["data_inicio"], dayfirst=True).to_pydatetime()
        except Exception as exc:
            logger.warning(
                "VINCULOS linha %d: erro ao parsear datas ('%s' / '%s'): %s — ignorado.",
                sheet_row,
                row["data_da_assinatura"],
                row["data_inicio"],
                exc,
            )
            invalid += 1
            continue

        # ── Data fim (opcional) ──
        data_fim = None
        raw_data_fim = _safe_str(row["data_fim"])
        if raw_data_fim:
            try:
                parsed = pd.to_datetime(raw_data_fim, dayfirst=True)
                data_fim = None if pd.isna(parsed) else parsed.to_pydatetime()
            except Exception:
                logger.warning(
                    "VINCULOS linha %d: data_fim inválida '%s' — será nula.",
                    sheet_row,
                    raw_data_fim,
                )

        valid_rows.append(
            {
                "cnes": cnes,
                "numero": numero,
                "numero_processo_sei": numero_processo_sei,
                "tipo_vinculo": tipo_vinculo,
                "objeto": objeto,
                "complexidade": complexidade,
                "valor_total": valor,
                "data_da_assinatura": data_assinatura,
                "data_inicio": data_inicio,
                "data_fim": data_fim,
            }
        )

    logger.info(
        "[%s] %d linhas lidas — %d válidas, %d ignoradas.",
        SHEET_VINCULOS,
        total,
        len(valid_rows),
        invalid,
    )
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


# ── Planos Operativos e Complementações ─────────────────────────────────────────

SHEET_PLANOS_OPERATIVOS = "PLANOS OPERATIVOS"
SHEET_COMPLEMENTACOES_TIPOS = "COMPLEMENTACOES TIPOS"
SHEET_COMPLEMENTACOES_ITENS = "COMPLEMENTACOES ITENS"
SHEET_COMPLEMENTACOES_PLANO = "COMPLEMENTACOES PLANO OPERATIVO"

_COL_PLANOS_OPERATIVOS: dict[str, str] = {
    "NUMERO DO VINCULO": "numero_vinculo",
    "NUMERO DO ADITIVO": "numero_aditivo",
    "CODIGO DO PROCEDIMENTO SIGTAP": "co_procedimento",
    "QUANTIDADE MENSAL PACTUADA": "quantidade_pactuada_mensal",
}

_COL_COMPLEMENTACOES_TIPOS: dict[str, str] = {
    "NOME": "nome",
    "DESCRICAO": "descricao",
}

_COL_COMPLEMENTACOES_ITENS: dict[str, str] = {
    "DESCRICAO": "descricao",
    "COMPLEMENTACOES TIPO": "complementacao_tipo_nome",
    "VALOR UNITARIO": "valor_unitario",
}

_COL_COMPLEMENTACOES_PLANO: dict[str, str] = {
    "NUMERO DO VINCULO": "numero_vinculo",
    "NUMERO DO ADITIVO": "numero_aditivo",
    "COMPLEMENTAOCAO ITEM DESCRICAO": "complementacao_item_descricao",
    "QUANTIDADE PACTUADA MÊS": "quantidade_pactuada_mensal",
}

def extract_planos_operativos(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    df = _load_sheet(path, SHEET_PLANOS_OPERATIVOS)
    df.columns = [_clean_column_name(c) for c in df.columns]

    missing = set(_COL_PLANOS_OPERATIVOS) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_PLANOS_OPERATIVOS}: {missing}")

    df = df.rename(columns=_COL_PLANOS_OPERATIVOS)[list(_COL_PLANOS_OPERATIVOS.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []
    
    details = {
        "vinculo_vazio": 0,
        "qtde_invalida": 0
    }

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        numero_vinculo = _safe_str(row["numero_vinculo"])
        if not numero_vinculo:
            logger.warning("PLANOS OPERATIVOS linha %d: NUMERO DO VINCULO vazio — ignorado.", sheet_row)
            invalid += 1
            details["vinculo_vazio"] += 1
            continue

        co_procedimento = _safe_str(row["co_procedimento"]).zfill(10)
        
        try:
            qtde = int(float(_safe_str(row["quantidade_pactuada_mensal"]) or 0))
        except ValueError:
            logger.warning("PLANOS OPERATIVOS linha %d: QUANTIDADE inválida — ignorado.", sheet_row)
            invalid += 1
            details["qtde_invalida"] += 1
            continue

        numero_aditivo = _safe_str(row["numero_aditivo"])

        valid_rows.append({
            "numero_vinculo": numero_vinculo,
            "numero_aditivo": numero_aditivo if numero_aditivo else None,
            "co_procedimento": co_procedimento,
            "quantidade_pactuada_mensal": qtde,
        })

    logger.info("[%s] %d linhas lidas — %d válidas, %d ignoradas.", SHEET_PLANOS_OPERATIVOS, total, len(valid_rows), invalid)
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid, details=details)


def extract_complementacoes_tipos(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    df = _load_sheet(path, SHEET_COMPLEMENTACOES_TIPOS)
    df.columns = [_clean_column_name(c) for c in df.columns]

    missing = set(_COL_COMPLEMENTACOES_TIPOS) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_COMPLEMENTACOES_TIPOS}: {missing}")

    df = df.rename(columns=_COL_COMPLEMENTACOES_TIPOS)[list(_COL_COMPLEMENTACOES_TIPOS.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        nome = _safe_str(row["nome"])
        if not nome:
            invalid += 1
            continue

        valid_rows.append({
            "nome": nome,
            "descricao": _safe_str(row.get("descricao", "")),
        })

    logger.info("[%s] %d linhas lidas — %d válidas, %d ignoradas.", SHEET_COMPLEMENTACOES_TIPOS, total, len(valid_rows), invalid)
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


def extract_complementacoes_itens(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    df = _load_sheet(path, SHEET_COMPLEMENTACOES_ITENS)
    df.columns = [_clean_column_name(c) for c in df.columns]

    missing = set(_COL_COMPLEMENTACOES_ITENS) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_COMPLEMENTACOES_ITENS}: {missing}")

    df = df.rename(columns=_COL_COMPLEMENTACOES_ITENS)[list(_COL_COMPLEMENTACOES_ITENS.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        descricao = _safe_str(row["descricao"])
        tipo_nome = _safe_str(row["complementacao_tipo_nome"])
        raw_valor = _safe_str(row["valor_unitario"])

        if not descricao and not tipo_nome and not raw_valor:
            # Linha totalmente vazia do Excel, ignora em silêncio
            invalid += 1
            continue

        if not descricao:
            invalid += 1
            continue
            
        tipo_nome = _safe_str(row["complementacao_tipo_nome"])
        if not tipo_nome:
            invalid += 1
            continue

        raw_valor = _safe_str(row["valor_unitario"])
        try:
            valor = float(raw_valor.replace("R$", "").replace(".", "").replace(",", ".").strip())
        except ValueError:
            logger.warning("COMPLEMENTACOES ITENS linha %d: VALOR UNITARIO inválido — ignorado.", sheet_row)
            invalid += 1
            continue

        valid_rows.append({
            "descricao": descricao,
            "complementacao_tipo_nome": tipo_nome,
            "valor_unitario": valor,
        })

    logger.info("[%s] %d linhas lidas — %d válidas, %d ignoradas.", SHEET_COMPLEMENTACOES_ITENS, total, len(valid_rows), invalid)
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


def extract_complementacoes_plano(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    df = _load_sheet(path, SHEET_COMPLEMENTACOES_PLANO)
    df.columns = [_clean_column_name(c) for c in df.columns]

    missing = set(_COL_COMPLEMENTACOES_PLANO) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_COMPLEMENTACOES_PLANO}: {missing}")

    df = df.rename(columns=_COL_COMPLEMENTACOES_PLANO)[list(_COL_COMPLEMENTACOES_PLANO.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        numero_vinculo = _safe_str(row["numero_vinculo"])
        if not numero_vinculo:
            logger.warning("COMPLEMENTACOES PLANO linha %d: NUMERO DO VINCULO vazio — ignorado.", sheet_row)
            invalid += 1
            continue
            
        item_descricao = _safe_str(row["complementacao_item_descricao"])
        if not item_descricao:
            logger.warning("COMPLEMENTACOES PLANO linha %d: ITEM DESCRICAO vazia — ignorado.", sheet_row)
            invalid += 1
            continue

        try:
            qtde = int(float(_safe_str(row["quantidade_pactuada_mensal"]) or 0))
        except ValueError:
            logger.warning("COMPLEMENTACOES PLANO linha %d: QUANTIDADE inválida — ignorado.", sheet_row)
            invalid += 1
            continue

        numero_aditivo = _safe_str(row["numero_aditivo"])

        valid_rows.append({
            "numero_vinculo": numero_vinculo,
            "numero_aditivo": numero_aditivo if numero_aditivo else None,
            "complementacao_item_descricao": item_descricao,
            "quantidade_pactuada_mensal": qtde,
        })

    logger.info("[%s] %d linhas lidas — %d válidas, %d ignoradas.", SHEET_COMPLEMENTACOES_PLANO, total, len(valid_rows), invalid)
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


# ── Aditivos ──────────────────────────────────────────────────────────────────

def extract_aditivos(path: Union[Path, pd.ExcelFile, str]) -> ExtractionResult:
    df = _load_sheet(path, SHEET_ADITIVOS)
    
    # Normalize spaces and newlines from column headers
    df.columns = [_clean_column_name(c) for c in df.columns]

    for col in df.columns:
        if col in _ADITIVOS_IGNORED_COLS:
            logger.warning("ADITIVOS: coluna '%s' será ignorada.", col)

    missing = set(_COL_ADITIVOS) - set(df.columns)
    if missing:
        raise ValueError(f"Colunas ausentes na aba {SHEET_ADITIVOS}: {missing}")

    df = df.rename(columns=_COL_ADITIVOS)[list(_COL_ADITIVOS.values())]

    total = len(df)
    invalid = 0
    valid_rows: list[dict] = []

    for sheet_row, (_, row) in enumerate(df.iterrows(), start=2):
        raw_cnes = _keep_digits(row["cnes"])
        cnes = raw_cnes.zfill(7) if raw_cnes else ""
        numero_vinculo = _safe_str(row["numero_vinculo"])
        numero = _safe_str(row["numero"])
        
        if not cnes or not numero_vinculo or not numero:
            logger.warning("ADITIVOS linha %d: Chaves (CNES, Vinculo, Aditivo) inválidas — ignorado.", sheet_row)
            invalid += 1
            continue
            
        data_inicio = _parse_date(row.get("data_inicio"))
        data_fim = _parse_date(row.get("data_fim"))
        
        if not data_inicio:
            logger.warning("ADITIVOS linha %d: DATA DE INICIO inválida — ignorado.", sheet_row)
            invalid += 1
            continue
            
        if not data_fim:
            logger.warning("ADITIVOS linha %d: DATA DE FIM (obrigatória) ausente ou inválida — ignorado.", sheet_row)
            invalid += 1
            continue

        valid_rows.append({
            "cnes": cnes,
            "numero_vinculo": numero_vinculo,
            "numero": numero,
            "numero_processo_sei": _safe_str(row.get("numero_processo_sei", "")),
            "tipo_aditivo": _safe_str(row.get("tipo_aditivo", "")),
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "data_da_assinatura": _parse_date(row.get("data_da_assinatura")),
            "valor_total": _safe_str(row.get("valor_total", "")),
        })

    logger.info(
        "[%s] %d linhas lidas — %d válidas, %d ignoradas.",
        SHEET_ADITIVOS,
        total,
        len(valid_rows),
        invalid,
    )
    return ExtractionResult(data=pd.DataFrame(valid_rows), total=total, invalid=invalid)


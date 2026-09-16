"""Funções vetoriais e utilitários de sanitização e normalização de dados."""

import re
import unicodedata
from decimal import Decimal, InvalidOperation
from typing import Any, Optional, Union
import pandas as pd


def safe_str(val: Any) -> Optional[str]:
    """Retorna uma string limpa ou None se for nulo/vazio."""
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    return s if s else None


def safe_float_to_int(val: Any) -> Optional[int]:
    """Converte com segurança valores numéricos/floats para inteiros."""
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def safe_int_str(val: Any) -> Optional[str]:
    """Converte floats que representam inteiros para string sem decimais (ex: 7.0 -> '7')."""
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        if isinstance(val, float):
            return str(int(val))
        s = str(val).strip()
        if s.endswith(".0"):
            s = s[:-2]
        return s if s else None
    except (ValueError, TypeError):
        s = str(val).strip()
        return s if s else None


def normalize_cnes(val: Union[pd.Series, Any]) -> Union[pd.Series, Optional[str]]:
    """Normaliza CNES para string de 7 dígitos com preenchimento de zeros à esquerda.
    
    Suporta tanto execução vetorial (pd.Series) quanto escalar.
    """
    if isinstance(val, pd.Series):
        # Operação vetorial nativa otimizada
        clean = (
            val.astype(str)
            .str.replace(r"\.0$", "", regex=True)
            .str.replace(r"\D", "", regex=True)
            .str.strip()
        )
        valid_mask = (clean.str.len() > 0) & (~clean.isin(["nan", "None"]))
        return clean.str.zfill(7).where(valid_mask, None)

    raw = safe_int_str(val)
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    return digits.zfill(7)


def normalize_sigtap_code(val: Union[pd.Series, Any]) -> Union[pd.Series, Optional[str]]:
    """Normaliza código SIGTAP para string de 10 dígitos com preenchimento de zeros.
    
    Suporta tanto execução vetorial (pd.Series) quanto escalar.
    """
    if isinstance(val, pd.Series):
        # Operação vetorial nativa otimizada
        clean = (
            val.astype(str)
            .str.replace(r"\.0$", "", regex=True)
            .str.replace(r"\D", "", regex=True)
            .str.strip()
        )
        valid_mask = (clean.str.len() > 0) & (~clean.isin(["nan", "None"]))
        return clean.str.zfill(10).where(valid_mask, None)

    raw = safe_int_str(val)
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    return digits.zfill(10)


def parse_currency_to_decimal(val: Any) -> Optional[Decimal]:
    """Converte com segurança valores monetários (string, float, int) para Decimal.
    
    Trata formatos como 'R$ 1.234,56', '1234.56', float e inteiros.
    """
    if pd.isna(val) or val is None or val == "":
        return None
    if isinstance(val, Decimal):
        return val
    try:
        if isinstance(val, (int, float)):
            # Formata para 2 casas evitando artefatos de ponto flutuante
            return Decimal(f"{val:.2f}")
        s = str(val).strip()
        # Remove símbolos de moeda
        s = re.sub(r"[R$\s]", "", s)
        # Se contiver separadores de milhar no padrão brasileiro (1.234,56)
        if "," in s and "." in s:
            s = s.replace(".", "").replace(",", ".")
        elif "," in s:
            s = s.replace(",", ".")
        return Decimal(s)
    except (InvalidOperation, TypeError, ValueError):
        return None


def sanitize_cnpj(val: Any) -> Optional[str]:
    """Remove pontuação do CNPJ e preenche com zeros à esquerda até 14 dígitos."""
    if pd.isna(val) or val is None or val == "":
        return None
    raw = str(val).strip()
    digits = re.sub(r"\D", "", raw)
    if digits:
        return digits.zfill(14)
    return None


def is_valid_sigtap_code(code: str) -> bool:
    """Valida se o código possui exatamente 10 dígitos numéricos."""
    return bool(code and len(code) == 10 and code.isdigit())


def try_autocorrect_zero_prefix(code: str) -> Optional[str]:
    """Auto-corrige códigos SIGTAP de 9 dígitos adicionando zero inicial."""
    if code and len(code) == 9 and code.isdigit() and not code.startswith("0"):
        return "0" + code
    return None


def strip_accents(value: str) -> str:
    """Remove acentos de uma string para matching normalizado."""
    nfkd = unicodedata.normalize("NFKD", value)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

"""Sanitização e validação de códigos para o utilitário CPA integrado a scripts.shared."""

import re
import sys
from pathlib import Path
from typing import Optional
import pandas as pd

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

from scripts.shared.sanitizers import (
    is_valid_sigtap_code,
    normalize_sigtap_code,
    sanitize_cnpj as _shared_sanitize_cnpj,
    try_autocorrect_zero_prefix,
)


def sanitize_code(raw: object) -> str:
    """Remove espaços e caracteres não numéricos de um código bruto."""
    if pd.isna(raw) or raw is None:
        return ""
    if isinstance(raw, float):
        raw = int(raw)
    str_val = str(raw).strip()
    return re.sub(r"\D", "", str_val)


def try_extract_sigtap_prefix(code: str) -> Optional[str]:
    """Para códigos com mais de 10 dígitos, retorna os primeiros 9 dígitos para busca por prefixo."""
    if len(code) > 10 and code.isdigit() and code.startswith("0"):
        return code[:9]
    return None


def sanitize_cnpj(raw: object) -> str:
    """Sanitiza CNPJ delegando para scripts.shared com retorno em string vazia para nulos."""
    res = _shared_sanitize_cnpj(raw)
    return res if res is not None else ""


__all__ = [
    "sanitize_code",
    "is_valid_sigtap_code",
    "try_autocorrect_zero_prefix",
    "try_extract_sigtap_prefix",
    "sanitize_cnpj",
]

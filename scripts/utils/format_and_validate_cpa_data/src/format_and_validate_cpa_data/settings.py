import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv

# Resolve o diretório onde está este arquivo (src/format_and_validate_cpa_data/)
_PKG_ROOT = Path(__file__).parent
# Resolve a raiz do pacote (onde fica o pyproject.toml e o .env)
_APP_ROOT = _PKG_ROOT.parent.parent

load_dotenv(find_dotenv())

# ── Database ──────────────────────────────────────────────────────────────────
# Pode ser None. O CLI deve tratar isso e perguntar se necessário.
DATABASE_URL: str | None = os.getenv("DATABASE_URL")

# ── Paths ───────────────────────────────────────────────────────────────────
# Caminho padrão assume a estrutura do repositório
_DEFAULT_SPREADSHEET = _APP_ROOT.parent.parent / "arquivos" / "cpa-data" / "dados-cpa.xlsx"
SPREADSHEET_PATH: Path = Path(os.getenv("CPA_SPREADSHEET_PATH", str(_DEFAULT_SPREADSHEET)))

_DEFAULT_OUTPUT = SPREADSHEET_PATH.parent / "dados-cpa-saneado.xlsx"
OUTPUT_PATH: Path = Path(os.getenv("CPA_OUTPUT_PATH", str(_DEFAULT_OUTPUT)))

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

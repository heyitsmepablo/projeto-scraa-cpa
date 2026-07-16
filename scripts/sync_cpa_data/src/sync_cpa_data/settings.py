"""Settings module: loads environment variables and configures logging."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv

# Resolve the project root of this script (scripts/sync_cpa_data/)
_SCRIPT_ROOT: Path = Path(__file__).parent.parent.parent

load_dotenv(find_dotenv())

# ── Database ──────────────────────────────────────────────────────────────────
try:
    DATABASE_URL: str = os.environ["DATABASE_URL"]
except KeyError as exc:
    raise EnvironmentError(
        "A variável DATABASE_URL não está definida. "
        "Certifique-se de que o arquivo .env na raiz do projeto existe e contém DATABASE_URL=postgresql://..."
    ) from exc

# ── Spreadsheet path ─────────────────────────────────────────────────────────
# Can be overridden via env var for CI/testing.
_DEFAULT_SPREADSHEET = _SCRIPT_ROOT.parent / "arquivos" / "cpa-data" / "dados-cpa.xlsx"
SPREADSHEET_PATH: Path = Path(os.getenv("CPA_SPREADSHEET_PATH", str(_DEFAULT_SPREADSHEET)))

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="[%(asctime)s] %(levelname)-5s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M",
)

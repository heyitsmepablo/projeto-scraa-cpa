"""Módulo compartilhado de utilitários, infraestrutura de banco de dados e modelos ORM.

Centraliza conexões, configurações, modelos SQLAlchemy sincronizados com o Prisma
e rotinas vetoriais de sanitização para todos os scripts de ETL (CPA, DATASUS, SIGTAP).
"""

import sys
from pathlib import Path

# Garante que a raiz do projeto e o diretório 'scripts' estejam no sys.path
_current_dir = Path(__file__).resolve().parent
_scripts_dir = _current_dir.parent
_project_root = _scripts_dir.parent

for _p in [str(_project_root), str(_scripts_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

__version__ = "1.0.0"

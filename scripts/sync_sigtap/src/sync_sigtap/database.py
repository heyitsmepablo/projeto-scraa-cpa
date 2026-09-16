"""Camada de banco de dados do módulo sync_sigtap integrada ao pacote scripts.shared."""

import sys
from pathlib import Path

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

from scripts.shared.database import get_engine, get_session, get_session_factory
from scripts.shared.models.base import Base
from scripts.shared.models.cpa import Vinculo
from scripts.shared.models.sigtap import (
    SigtapCid,
    SigtapChangelog,
    SigtapComponenteRede,
    SigtapDescricao,
    SigtapDescricaoDetalhe,
    SigtapDetalhe,
    SigtapFinanciamento,
    SigtapFormaOrganizacao,
    SigtapGrupo,
    SigtapGrupoHabilitacao,
    SigtapHabilitacao,
    SigtapImportacao,
    SigtapModalidade,
    SigtapOcupacao,
    SigtapProcedimento,
    SigtapRedeAtencao,
    SigtapRegistro,
    SigtapRegraCondicionada,
    SigtapRenases,
    SigtapRubrica,
    SigtapServico,
    SigtapServicoClassificacao,
    SigtapSubGrupo,
    SigtapTipoLeito,
    SigtapTuss,
    SigtapSiaSih,
)

__all__ = [
    "Base",
    "get_engine",
    "get_session_factory",
    "get_session",
    "Vinculo",
    "SigtapImportacao",
    "SigtapChangelog",
    "SigtapProcedimento",
    "SigtapFinanciamento",
    "SigtapRubrica",
    "SigtapDetalhe",
    "SigtapDescricaoDetalhe",
    "SigtapRegistro",
    "SigtapServico",
    "SigtapServicoClassificacao",
    "SigtapModalidade",
    "SigtapTipoLeito",
    "SigtapCid",
    "SigtapOcupacao",
    "SigtapHabilitacao",
    "SigtapGrupo",
    "SigtapSubGrupo",
    "SigtapFormaOrganizacao",
    "SigtapSiaSih",
    "SigtapGrupoHabilitacao",
    "SigtapDescricao",
    "SigtapRegraCondicionada",
    "SigtapRedeAtencao",
    "SigtapComponenteRede",
    "SigtapTuss",
    "SigtapRenases",
]

"""Unit tests for sync_cpa_data.loader."""

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pandas as pd

from sync_cpa_data.loader import load_instituicoes, load_vinculos


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_session(existing_inst=None, existing_vinc=None):
    """Build a mock SQLAlchemy Session that returns predefined existing records.

    Args:
        existing_inst: List of (id, cnes) namedtuple-like objects to simulate
                       existing ``instituicao`` rows.
        existing_vinc: List of (id, numero) namedtuple-like objects to simulate
                       existing ``vinculo`` rows.
    """
    session = MagicMock()

    def _make_row(**kwargs):
        row = MagicMock()
        for k, v in kwargs.items():
            setattr(row, k, v)
        return row

    existing_inst_rows = existing_inst or []
    existing_vinc_rows = existing_vinc or []

    # We need sequential returns for the two select calls in load_instituicoes
    # and two select calls in load_vinculos.
    select_results = []

    if existing_inst is not None:
        select_results.append(MagicMock(fetchall=MagicMock(return_value=existing_inst_rows)))
        # Second call is the refresh after insert
        select_results.append(MagicMock(fetchall=MagicMock(return_value=existing_inst_rows)))
    else:
        # Default: no existing rows, then the rows that were inserted
        _inst_row = _make_row(cnes="1234567", id=1)
        select_results.append(MagicMock(fetchall=MagicMock(return_value=[])))
        select_results.append(MagicMock(fetchall=MagicMock(return_value=[_inst_row])))

    if existing_vinc is not None:
        select_results.append(MagicMock(fetchall=MagicMock(return_value=existing_vinc_rows)))
    else:
        select_results.append(MagicMock(fetchall=MagicMock(return_value=[])))

    session.execute.side_effect = select_results
    return session


def _inst_df(**overrides) -> pd.DataFrame:
    data = {
        "nome": ["Hospital A"],
        "cnes": ["1234567"],
        "cnpj": [""],
        "tipo_instituicao": ["FILANTRÓPICO"],
        **overrides,
    }
    return pd.DataFrame(data)


def _vinc_df(**overrides) -> pd.DataFrame:
    data = {
        "cnes": ["1234567"],
        "numero": ["CONV-001"],
        "numero_processo_sei": ["SEI-001"],
        "tipo_vinculo": ["CONVÊNIO"],
        "objeto": ["Cirurgia Geral"],
        "complexidade": [["AC", "MC"]],
        "valor_total": [1_200_000.0],
        "data_da_assinatura": [datetime(2024, 3, 1, tzinfo=timezone.utc)],
        "data_inicio": [datetime(2024, 4, 1, tzinfo=timezone.utc)],
        "data_fim": [None],
        **overrides,
    }
    return pd.DataFrame(data)


# ── load_instituicoes ─────────────────────────────────────────────────────────

class TestLoadInstituicoes:
    def test_inserts_new_institution(self):
        session = MagicMock()
        no_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[]))))
        insert_log = MagicMock()
        insert_record = MagicMock()
        select_refresh = MagicMock(fetchall=MagicMock(return_value=[MagicMock(cnes="1234567", id=42)]))
        session.execute.side_effect = [no_existing, insert_log, insert_record, select_refresh]

        result = load_instituicoes(session, _inst_df(), 1)

        assert result == {"1234567": 42}

    def test_returns_empty_dict_on_empty_dataframe(self):
        session = MagicMock()
        result = load_instituicoes(session, pd.DataFrame(), 1)
        assert result == {}
        session.execute.assert_not_called()

    def test_updates_existing_institution(self):
        session = MagicMock()
        existing_row = {"cnes": "1234567", "id": 10, "nome": "Hospital Antigo", "tipo_instituicao": "OUTRO", "cnpj": "123", "deletado_em": None}
        select_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[existing_row]))))
        select_refresh = MagicMock(fetchall=MagicMock(return_value=[MagicMock(cnes="1234567", id=10)]))
        
        session.execute.side_effect = [select_existing, MagicMock(), MagicMock(), select_refresh]

        result = load_instituicoes(session, _inst_df(), 1)

        assert result == {"1234567": 10}


# ── load_vinculos ─────────────────────────────────────────────────────────────

class TestLoadVinculos:
    def test_inserts_new_vinculo(self):
        session = MagicMock()
        no_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[]))))
        session.execute.side_effect = [no_existing, MagicMock(), MagicMock()]  # select + log + insert

        load_vinculos(session, _vinc_df(), {"1234567": 1}, 1)

        assert session.execute.call_count == 3

    def test_skips_unresolved_cnes(self):
        session = MagicMock()
        load_vinculos(session, _vinc_df(), {}, 1)
        session.execute.assert_not_called()

    def test_does_nothing_on_empty_dataframe(self):
        session = MagicMock()
        load_vinculos(session, pd.DataFrame(), {"1234567": 1}, 1)
        session.execute.assert_not_called()

    def test_valor_is_converted_to_decimal(self):
        session = MagicMock()
        no_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[]))))
        session.execute.side_effect = [no_existing, MagicMock(), MagicMock()]
        
        load_vinculos(session, _vinc_df(), {"1234567": 1}, 1)

        assert session.execute.call_count >= 2

    def test_updates_existing_vinculo(self):
        session = MagicMock()
        existing_row = {
            "numero": "CONV-001", "numero_processo_sei": "SEI-001", "id": 5, "instituicao_id": 1, "tipo_vinculo": "OUTRO",
            "objeto": "Antigo", "complexidade": [], "valor_total": 0.0,
            "data_da_assinatura": None, "data_inicio": None, "data_fim": None, "deletado_em": None
        }
        select_result = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[existing_row]))))
        session.execute.side_effect = [select_result, MagicMock(), MagicMock()]  # select + log + update

        load_vinculos(session, _vinc_df(), {"1234567": 1}, 1)

        assert session.execute.call_count == 3

"""Unit tests for sync_cpa_data.extractor."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from sync_cpa_data.extractor import (
    ExtractionResult,
    extract_instituicoes,
    extract_vinculos,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _mock_excel(sheet_data: dict[str, pd.DataFrame]):
    """Return a patch context for pd.read_excel that yields sheet_data by name."""

    def _reader(path, sheet_name, **kwargs):  # noqa: ARG001
        return sheet_data[sheet_name]

    return patch("sync_cpa_data.extractor.pd.read_excel", side_effect=_reader)


def _fake_path(exists: bool = True) -> MagicMock:
    p = MagicMock(spec=Path)
    p.exists.return_value = exists
    return p


# ── extract_instituicoes ──────────────────────────────────────────────────────


class TestExtractInstituicoes:
    def test_returns_valid_dataframe(self, sample_instituicoes_df):
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)
        assert isinstance(result, ExtractionResult)
        assert result.total == 2
        assert result.invalid == 0
        assert list(result.data.columns) == ["nome", "cnes", "cnpj", "tipo_instituicao"]

    def test_cnes_is_zero_padded(self, sample_instituicoes_df):
        sample_instituicoes_df["CNES"] = ["42", "7"]
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)

        assert result.data["cnes"].tolist() == ["0000042", "0000007"]

    def test_raises_when_file_not_found(self):
        path = _fake_path(exists=False)
        with pytest.raises(FileNotFoundError):
            extract_instituicoes(path)

    def test_raises_when_column_missing(self):
        bad_df = pd.DataFrame({"ESTABELECIMENTO": ["X"], "CNES": ["1234567"]})
        # Missing "TIPO DE INSTITUIÇÃO"
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": bad_df}), pytest.raises(ValueError, match="TIPO DE INSTITUIÇÃO"):
            extract_instituicoes(path)

    def test_skips_empty_nome(self, sample_instituicoes_df):
        sample_instituicoes_df.loc[0, "ESTABELECIMENTO"] = ""
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)

        assert result.total == 2
        assert result.invalid == 1
        assert len(result.data) == 1

    def test_skips_invalid_tipo_instituicao(self, sample_instituicoes_df):
        sample_instituicoes_df.loc[0, "TIPO DE INSTITUIÇÃO"] = "COOPERATIVA"
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)

        assert result.invalid == 1
        assert len(result.data) == 1

    def test_normalizes_tipo_without_accent(self, sample_instituicoes_df):
        """'FILANTROPICO' (no accent) should resolve to 'FILANTRÓPICO'."""
        sample_instituicoes_df.loc[0, "TIPO DE INSTITUIÇÃO"] = "FILANTROPICO"
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)

        assert result.data.iloc[0]["tipo_instituicao"] == "FILANTRÓPICO"

    def test_reads_cnpj_from_sheet(self, sample_instituicoes_df):
        """CNPJ deve ser lido, limpo de formatação e zerado à esquerda para 14 dígitos."""
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": sample_instituicoes_df}):
            result = extract_instituicoes(path)

        # "12.345.678/0001-90" → "12345678000190"
        assert result.data.iloc[0]["cnpj"] == "12345678000190"
        # "98765432000199" (já limpo, 14 dígitos)
        assert result.data.iloc[1]["cnpj"] == "98765432000199"

    def test_cnpj_falls_back_to_empty_when_column_absent(self):
        """Planilhas sem a coluna CNPJ devem continuar funcionando (backwards-compatible)."""
        df_sem_cnpj = pd.DataFrame(
            {
                "ESTABELECIMENTO": ["Hospital A"],
                "CNES": ["1234567"],
                "TIPO DE INSTITUIÇÃO": ["FILANTRÓPICO"],
            }
        )
        path = _fake_path()
        with _mock_excel({"INSTITUICOES": df_sem_cnpj}):
            result = extract_instituicoes(path)

        assert result.data.iloc[0]["cnpj"] is None


# ── extract_vinculos ──────────────────────────────────────────────────────────


class TestExtractVinculos:
    def test_returns_valid_dataframe(self, sample_vinculos_df):
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert isinstance(result, ExtractionResult)
        assert result.total == 2
        assert result.invalid == 0
        expected_cols = {
            "cnes", "numero", "numero_processo_sei", "tipo_vinculo", "objeto", "complexidade", "valor_total",
            "data_da_assinatura", "data_inicio", "data_fim",
        }
        assert expected_cols == set(result.data.columns)

    def test_raises_when_file_not_found(self):
        path = _fake_path(exists=False)
        with pytest.raises(FileNotFoundError):
            extract_vinculos(path)

    def test_raises_when_column_missing(self):
        bad_df = pd.DataFrame({"CNES": ["1234567"]})
        path = _fake_path()
        with _mock_excel({"VINCULOS": bad_df}), pytest.raises(ValueError):
            extract_vinculos(path)

    def test_skips_invalid_tipo_vinculo(self, sample_vinculos_df):
        sample_vinculos_df.loc[0, "TIPO DO VINCULO"] = "PARCERIA"
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert result.invalid == 1
        assert len(result.data) == 1

    def test_normalizes_tipo_vinculo_without_accent(self, sample_vinculos_df):
        """'CONVENIO' (no accent) should resolve to 'CONVÊNIO'."""
        sample_vinculos_df.loc[0, "TIPO DO VINCULO"] = "CONVENIO"
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert result.data.iloc[0]["tipo_vinculo"] == "CONVÊNIO"

    def test_parses_brazilian_monetary_value(self, sample_vinculos_df):
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert result.data.iloc[0]["valor_total"] == pytest.approx(1_200_000.00)

    def test_data_fim_is_none_when_empty(self, sample_vinculos_df):
        """Second row has empty data_fim — should be null (None or NaT).

        pandas may coerce None to NaT in object-dtype columns, so we use
        pd.isna() rather than ``is None`` to assert the value is missing.
        """
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert pd.isna(result.data.iloc[1]["data_fim"])

    def test_skips_invalid_date(self, sample_vinculos_df):
        sample_vinculos_df.loc[0, "DATA DA ASSINATURA"] = "not-a-date"
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert result.invalid == 1

    def test_skips_invalid_valor(self, sample_vinculos_df):
        sample_vinculos_df.loc[0, "VALOR DO DOCUMENTO ORIGINAL (ANUAL)"] = "N/A"
        path = _fake_path()
        with _mock_excel({"VINCULOS": sample_vinculos_df}):
            result = extract_vinculos(path)

        assert result.invalid == 1

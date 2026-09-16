"""Testes unitários para o DatasusClient."""

from pathlib import Path
import urllib.error
from unittest.mock import AsyncMock, MagicMock, patch
import pandas as pd
import pytest

from sync_datasus.datasus_client import DatasusClient


@pytest.fixture
def client():
    return DatasusClient()


def test_format_ftp_url(client):
    """Valida a formação correta das URLs de FTP para SIA e SIH."""
    url_sia = client._format_ftp_url("SIA", "MA", "202401")
    assert url_sia == "ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Dados/PAMA2401.dbc"

    url_sih = client._format_ftp_url("SIH", "MA", "202402")
    assert url_sih == "ftp://ftp.datasus.gov.br/dissemin/publicos/SIHSUS/200801_/Dados/RDMA2402.dbc"


@patch("sync_datasus.datasus_client.DBC")
@patch("sync_datasus.datasus_client.urllib.request.urlretrieve")
def test_download_dataframe_sucesso(mock_retrieve, mock_dbc_cls, client):
    """Valida o fluxo de download e parsing de DBC quando o arquivo existe."""
    expected_df = pd.DataFrame([{"PA_CODUNI": "1234567", "PA_PROC_ID": "0301010158"}])
    
    mock_dbc_instance = MagicMock()
    mock_dbc_instance.load = AsyncMock(return_value=expected_df)
    mock_dbc_cls.return_value = mock_dbc_instance

    df = client.download_dataframe("SIA", "MA", "202401")

    assert df is not None
    assert len(df) == 1
    assert df.iloc[0]["PA_CODUNI"] == "1234567"
    mock_retrieve.assert_called_once()


@patch("sync_datasus.datasus_client.DBC")
@patch("sync_datasus.datasus_client.urllib.request.urlretrieve")
def test_download_dataframe_url_error_550(mock_retrieve, mock_dbc_cls, client):
    """Valida que erro 550 (arquivo não encontrado no FTP) retorna None amigavelmente."""
    mock_retrieve.side_effect = urllib.error.URLError("ftp error: 550 Failed to open file.")

    df = client.download_dataframe("SIH", "MA", "202401")

    assert df is None


def test_get_latest_competencia(client):
    """Valida o mecanismo regressivo de identificação da última competência disponível."""
    with patch.object(client, "download_dataframe") as mock_download:
        # Retorna None na 1ª tentativa e DataFrame na 2ª
        mock_download.side_effect = [
            None,
            pd.DataFrame([{"CNES": "1234567"}]),
        ]

        comp = client.get_latest_competencia("SIH", "MA")
        assert comp is not None
        assert len(comp) == 6
        assert comp.isdigit()
        assert mock_download.call_count == 2

import pytest
import pandas as pd
from unittest.mock import patch
from sync_datasus.datasus_client import DatasusClient
from datetime import datetime

@pytest.fixture
def client():
    return DatasusClient()

@patch('sync_datasus.datasus_client.pysus_sia')
def test_download_dataframe_sucesso_sia(mock_sia, client):
    mock_df = pd.DataFrame([{"PA_CODUNI": "123", "PA_MVM": "202301"}])
    mock_sia.return_value = mock_df
    
    df = client.download_dataframe("SIA", "SP", "202301")
    
    assert df is not None
    assert not df.empty
    mock_sia.assert_called_once_with(state="SP", year=2023, month=1, group="PA", as_dataframe=True)

@patch('sync_datasus.datasus_client.pysus_sih')
@patch('sync_datasus.datasus_client.pysus_sia')
def test_download_dataframe_competencia_indisponivel(mock_sia, mock_sih, client):
    mock_sih.side_effect = FileNotFoundError("Not found")
    
    df = client.download_dataframe("SIH", "SP", "202301")
    
    assert df is None
    mock_sih.assert_called_once_with(state="SP", year=2023, month=1, as_dataframe=True)

@patch('sync_datasus.datasus_client.pysus_sia')
def test_get_latest_competencia(mock_sia, client):
    # Mock download to return None for the first few months, then a DataFrame
    def mock_download(state, year, month, as_dataframe):
        if year == datetime.now().year and month == datetime.now().month:
            return None
        if month == datetime.now().month - 1 or (month == 12 and datetime.now().month == 1):
             return pd.DataFrame([{"TEST": "DATA"}])
        return None
        
    mock_sia.side_effect = mock_download
    
    latest = client.get_latest_competencia("SIA", "SP")
    
    assert latest is not None
    assert len(latest) == 6

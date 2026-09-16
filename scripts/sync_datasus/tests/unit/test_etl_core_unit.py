"""Testes unitários para a lógica de ETL e pré-filtro cirúrgico em sync_datasus.etl_core."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, call, patch
import pandas as pd
import pytest

from sync_datasus.etl_core import DatasusEtl


@pytest.fixture
def mock_session():
    return MagicMock()


@pytest.fixture
def mock_client():
    return MagicMock()


def test_carregar_cnes_ativos(mock_session, mock_client):
    """Valida a carga e normalização dos CNES de instituições ativas."""
    # Mock do retorno da consulta ao banco
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("123456",),   # deve normalizar para 0123456
        ("7654321",),
        (None,),       # nulo deve ser ignorado
    ]
    mock_session.execute.return_value = mock_result

    etl = DatasusEtl(mock_session, mock_client)
    etl.carregar_cnes_ativos()

    assert etl.cnes_ativos == {"0123456", "7654321"}
    assert mock_session.execute.call_count == 1


def test_carregar_catalogo_pactuado(mock_session, mock_client):
    """Valida a carga do mapa de pactos (CNES -> Set[Procedimentos]) e catálogo geral."""
    # 1ª chamada de execute: carregar_cnes_ativos
    result_cnes = MagicMock()
    result_cnes.all.return_value = [("1234567",), ("7654321",)]

    # 2ª chamada de execute: consulta de contratos e planos operativos
    result_pactos = MagicMock()
    result_pactos.all.return_value = [
        ("1234567", "301010158"),     # 9 dígitos -> 0301010158
        ("1234567", "0301010158"),    # 10 dígitos mantidos
        ("1234567", "0202010120"),    # outro proc para o mesmo CNES
        ("7654321", "0401010010"),    # proc para outro CNES
        (None, "0301010158"),         # CNES nulo -> ignorar
        ("1234567", None),            # proc nulo -> ignorar
    ]

    mock_session.execute.side_effect = [result_cnes, result_pactos]

    etl = DatasusEtl(mock_session, mock_client)
    etl.carregar_catalogo_pactuado()

    assert etl.cnes_ativos == {"1234567", "7654321"}
    assert "1234567" in etl.mapa_pactos
    assert etl.mapa_pactos["1234567"] == {"0301010158", "0202010120"}
    assert etl.mapa_pactos["7654321"] == {"0401010010"}
    assert etl.todos_procedimentos_pactuados == {"0301010158", "0202010120", "0401010010"}


def test_get_competencias_a_processar_sem_historico(mock_session, mock_client):
    """Valida determinação de competências quando não há histórico anterior no banco."""
    mock_client.get_latest_competencia.return_value = "202405"
    mock_session.scalars.return_value.first.return_value = None  # Sem histórico

    etl = DatasusEtl(mock_session, mock_client)
    result = etl.get_competencias_a_processar("SIA", "MA", competencia_inicial=None)

    assert result == ["202405"]


def test_get_competencias_a_processar_com_historico(mock_session, mock_client):
    """Valida geração de intervalo de competências a partir da última registrada."""
    mock_client.get_latest_competencia.return_value = "202403"
    mock_session.scalars.return_value.first.return_value = "202311"

    etl = DatasusEtl(mock_session, mock_client)
    result = etl.get_competencias_a_processar("SIH", "MA", competencia_inicial=None)

    assert result == ["202312", "202401", "202402", "202403"]


def test_processar_competencia_idempotencia_skip(mock_session, mock_client):
    """Valida que competência já processada com SUCESSO é pulada imediatamente."""
    etl = DatasusEtl(mock_session, mock_client)
    etl.cnes_ativos = {"1234567"}
    etl.mapa_pactos = {"1234567": {"0301010158"}}

    existing_mock = MagicMock(id=10, registrosProcessados=42)
    mock_session.scalars.return_value.first.return_value = existing_mock

    count = etl.processar_competencia("SIH", "MA", "202401")

    assert count == 42
    mock_client.download_dataframe.assert_not_called()


def test_get_oldest_contract_competencia_com_vinculo(mock_session, mock_client):
    """Valida que get_oldest_contract_competencia formata a dataInicio do contrato mais antigo como YYYYMM."""
    mock_session.scalars.return_value.first.return_value = datetime(2023, 7, 15, tzinfo=timezone.utc)

    etl = DatasusEtl(mock_session, mock_client)
    comp = etl.get_oldest_contract_competencia()

    assert comp == "202307"
    assert mock_session.scalars.call_count == 1


def test_get_oldest_contract_competencia_sem_vinculo(mock_session, mock_client):
    """Valida que get_oldest_contract_competencia retorna None caso não existam vínculos."""
    mock_session.scalars.return_value.first.return_value = None

    etl = DatasusEtl(mock_session, mock_client)
    comp = etl.get_oldest_contract_competencia()

    assert comp is None


def test_get_competencias_a_processar_sem_historico_com_vinculo(mock_session, mock_client):
    """Valida que na ausência de histórico DATASUS, utiliza a competência do contrato mais antigo."""
    mock_client.get_latest_competencia.return_value = "202402"
    # 1ª chamada de scalars().first(): get_ultima_competencia_banco -> None
    # 2ª chamada de scalars().first(): get_oldest_contract_competencia -> datetime(2023, 11, 1)
    mock_first = MagicMock()
    mock_first.first.side_effect = [None, datetime(2023, 11, 1)]
    mock_session.scalars.return_value = mock_first

    etl = DatasusEtl(mock_session, mock_client)
    result = etl.get_competencias_a_processar("SIA", "MA", competencia_inicial=None)

    assert result == ["202311", "202312", "202401", "202402"]


@patch("sync_datasus.etl_core.filter_and_map_sih_df")
@patch("sync_datasus.etl_core.log_etl_summary")
def test_processar_competencia_sih_sucesso(mock_log, mock_filter_map, mock_session, mock_client):
    """Valida fluxo completo de download, filtragem cirúrgica e bulk insert para SIH."""
    etl = DatasusEtl(mock_session, mock_client)
    etl.cnes_ativos = {"1234567"}
    etl.mapa_pactos = {"1234567": {"0301010158"}}
    etl.todos_procedimentos_pactuados = {"0301010158"}

    # Não existe importação anterior
    mock_session.scalars.return_value.first.return_value = None

    df_raw = pd.DataFrame([
        {"CNES": "1234567", "PROC_REA": "0301010158", "VAL_TOT": 100},
        {"CNES": "9999999", "PROC_REA": "0301010158", "VAL_TOT": 200},
    ])
    mock_client.download_dataframe.return_value = df_raw
    mock_filter_map.return_value = [
        {"cnes": "1234567", "procRea": "0301010158", "valTot": 100}
    ]

    inserted = etl.processar_competencia("SIH", "MA", "202401", batch_size=5000)

    assert inserted == 1
    mock_filter_map.assert_called_once_with(
        df_raw,
        etl.cnes_ativos,
        mapa_pactos=etl.mapa_pactos,
        todos_procedimentos_pactuados=etl.todos_procedimentos_pactuados,
    )
    # Valida chamada de inserção em sync_datasus via execute(insert(ModelClass), chunk)
    assert mock_session.execute.call_count == 1
    call_args = mock_session.execute.call_args[0]
    assert "datasus_sih_tb_rd" in str(call_args[0])
    assert call_args[1] == [{"cnes": "1234567", "procRea": "0301010158", "valTot": 100}]
    mock_log.assert_called_once()


@patch("sync_datasus.etl_core.filter_and_map_sia_df")
@patch("sync_datasus.etl_core.log_etl_summary")
def test_processar_competencia_sia_sucesso(mock_log, mock_filter_map, mock_session, mock_client):
    """Valida fluxo completo de download, filtragem cirúrgica e bulk insert para SIA."""
    etl = DatasusEtl(mock_session, mock_client)
    etl.cnes_ativos = {"1234567"}
    etl.mapa_pactos = {"1234567": {"0301010158"}}
    etl.todos_procedimentos_pactuados = {"0301010158"}

    # Não existe importação anterior
    mock_session.scalars.return_value.first.return_value = None

    df_raw = pd.DataFrame([
        {"PA_CODUNI": "1234567", "PA_PROC_ID": "0301010158", "PA_VALPRO": 75},
        {"PA_CODUNI": "9999999", "PA_PROC_ID": "0301010158", "PA_VALPRO": 150},
    ])
    mock_client.download_dataframe.return_value = df_raw
    mock_filter_map.return_value = [
        {"cnes": "1234567", "paProcId": "0301010158", "paValpro": 75}
    ]

    inserted = etl.processar_competencia("SIA", "MA", "202401", batch_size=5000)

    assert inserted == 1
    mock_filter_map.assert_called_once_with(
        df_raw,
        etl.cnes_ativos,
        mapa_pactos=etl.mapa_pactos,
        todos_procedimentos_pactuados=etl.todos_procedimentos_pactuados,
    )
    # Valida chamada de inserção em sync_datasus para SIA
    assert mock_session.execute.call_count == 1
    call_args = mock_session.execute.call_args[0]
    assert "datasus_sia_tb_pa" in str(call_args[0])
    assert call_args[1] == [{"cnes": "1234567", "paProcId": "0301010158", "paValpro": 75}]
    mock_log.assert_called_once()

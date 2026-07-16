import pandas as pd
import pytest
from unittest.mock import MagicMock
from sync_cpa_data.extractor import extract_complementacoes_tipos, SHEET_COMPLEMENTACOES_TIPOS
from sync_cpa_data.loader import load_complementacoes_tipos

def test_extract_complementacoes_tipos(tmp_path, mocker):
    df = pd.DataFrame({
        "NOME": ["TIPO A", "TIPO B"],
        "DESCRICAO": ["Desc A", "Desc B"]
    })
    
    mock_excel = mocker.patch("pandas.read_excel", return_value=df)
    mock_exists = mocker.patch("pathlib.Path.exists", return_value=True)
    
    from pathlib import Path
    result = extract_complementacoes_tipos(Path("dummy.xlsx"))
    
    assert result.total == 2
    assert result.invalid == 0
    assert list(result.data["nome"]) == ["TIPO A", "TIPO B"]


def test_load_complementacoes_tipos():
    session = MagicMock()
    df = pd.DataFrame({
        "nome": ["TIPO A"],
        "descricao": ["Desc A"]
    })
    
    no_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[]))))
    post_insert = MagicMock(fetchall=MagicMock(return_value=[MagicMock(id=1, nome="TIPO A")]))
    
    session.execute.side_effect = [no_existing, MagicMock(), MagicMock(), post_insert] # select, insert(log), insert, select
    
    result = load_complementacoes_tipos(session, df, 1)
    
    assert result == {"TIPO A": 1}
    assert session.execute.call_count == 4


def test_extract_aditivos(tmp_path, mocker):
    from sync_cpa_data.extractor import extract_aditivos
    df = pd.DataFrame({
        "CNES": ["1234567"],
        "NUMERO DO VINCULO": ["CONV-001"],
        "NUMERO DO ADITIVO": ["ADIT-001"],
        "NUMERO DO PROCESSO DO ADITIVO": ["SEI-002"],
        "TIPO ADITIVO (ACRÉSCIMO,PRAZO,SUPRESSÃO)": ["ACRÉSCIMO, PRAZO"],
        "DATA DE INICIO": ["01/01/2024"],
        "DATA DE FIM": ["31/12/2024"],
        "DATA DA ASSINATURA ": ["01/01/2024"],
        "VALOR DO ADITIVO": ["R$ 1.500,00"],
        "ESTABELECIMENTO": ["HOSPITAL A"]
    })
    
    mock_excel = mocker.patch("pandas.read_excel", return_value=df)
    mock_exists = mocker.patch("pathlib.Path.exists", return_value=True)
    
    from pathlib import Path
    result = extract_aditivos(Path("dummy.xlsx"))
    
    assert result.total == 1
    assert result.invalid == 0
    row = result.data.iloc[0]
    assert row["cnes"] == "1234567"
    assert row["numero_vinculo"] == "CONV-001"
    assert row["tipo_aditivo"] == "ACRÉSCIMO, PRAZO"
    assert row["valor_total"] == "R$ 1.500,00"


def test_load_aditivos():
    from sync_cpa_data.loader import load_aditivos
    session = MagicMock()
    df = pd.DataFrame({
        "cnes": ["1234567"],
        "numero_vinculo": ["CONV-001"],
        "numero": ["ADIT-001"],
        "numero_processo_sei": ["SEI-002"],
        "tipo_aditivo": ["ACRÉSCIMO, PRAZO"],
        "data_inicio": ["01/01/2024"],
        "data_fim": ["31/12/2024"],
        "data_da_assinatura": ["01/01/2024"],
        "valor_total": ["R$ 1.500,00"],
    })
    
    vinculo_cnes_cache = {("1234567", "CONV-001"): 99}
    
    no_existing = MagicMock(mappings=MagicMock(return_value=MagicMock(fetchall=MagicMock(return_value=[]))))
    session.execute.side_effect = [no_existing, MagicMock(), MagicMock()] # select, insert(log), insert
    
    load_aditivos(session, df, vinculo_cnes_cache, 1)
    
    # ensure it ran
    assert session.execute.call_count == 3

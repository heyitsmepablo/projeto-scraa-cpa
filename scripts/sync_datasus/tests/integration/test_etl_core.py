import pytest
import pandas as pd
from unittest.mock import MagicMock
from sync_datasus.etl_core import DatasusEtl
from sync_datasus.database import Instituicao, DatasusImportacao, DatasusSihRd
from datetime import datetime

@pytest.fixture
def mock_client():
    return MagicMock()

def test_buscar_cnes_ativos(session, mock_client):
    # Setup database
    inst1 = Instituicao(id=1, cnes="1111111")
    inst2 = Instituicao(id=2, cnes="2222222")
    inst3 = Instituicao(id=3, cnes="3333333", deletadoEm=datetime.utcnow())
    session.add_all([inst1, inst2, inst3])
    session.commit()
    
    etl = DatasusEtl(session, mock_client)
    etl.carregar_cnes_ativos()
    
    assert len(etl.cnes_ativos) == 2
    assert "1111111" in etl.cnes_ativos
    assert "2222222" in etl.cnes_ativos
    assert "3333333" not in etl.cnes_ativos

def test_get_ultima_competencia_banco(session, mock_client):
    imp1 = DatasusImportacao(competencia="202301", sistemaOrigem="SIH", status="SUCESSO")
    imp2 = DatasusImportacao(competencia="202302", sistemaOrigem="SIH", status="SUCESSO")
    imp3 = DatasusImportacao(competencia="202303", sistemaOrigem="SIH", status="FALHA") # Should be ignored
    session.add_all([imp1, imp2, imp3])
    session.commit()
    
    etl = DatasusEtl(session, mock_client)
    ultima = etl.get_ultima_competencia_banco("SIH")
    assert ultima == "202302"

def test_processar_competencia_sih_insere_registros(session, mock_client):
    # Setup
    inst = Instituicao(id=1, cnes="1234567")
    session.add(inst)
    session.commit()
    
    mock_df = pd.DataFrame([
        {
            "CNES": "1234567", "ANO_CMPT": "2023", "MES_CMPT": "01", 
            "VAL_TOT": 100, "DI_INTER": "20230101", "PROC_REA": "1234567890",
            "QT_DIARIAS": 5, "UF_ZI": "SP", "FINANC": "01", "COMPLEX": "MC"
        },
        {
            "CNES": "9999999", "ANO_CMPT": "2023", "MES_CMPT": "01", 
            "VAL_TOT": 200, "DI_INTER": "20230101", "PROC_REA": "1234567890",
            "QT_DIARIAS": 5, "UF_ZI": "SP", "FINANC": "01", "COMPLEX": "MC"
        }, # Ignored
    ])
    mock_client.download_dataframe.return_value = mock_df
    
    etl = DatasusEtl(session, mock_client)
    inserted = etl.processar_competencia("SIH", "SP", "202301")
    
    assert inserted == 1
    
    # Verify DB
    imp = session.query(DatasusImportacao).filter_by(competencia="202301", sistemaOrigem="SIH").first()
    assert imp is not None
    assert imp.status == "SUCESSO"
    assert imp.registrosProcessados == 1
    
    rds = session.query(DatasusSihRd).all()
    assert len(rds) == 1
    assert rds[0].cnes == "1234567"

def test_processar_competencia_registra_importacao_falha(session, mock_client):
    # Setup
    inst = Instituicao(id=1, cnes="1234567")
    session.add(inst)
    session.commit()
    
    mock_client.download_dataframe.side_effect = Exception("Network error")
    
    etl = DatasusEtl(session, mock_client)
    
    with pytest.raises(Exception):
        etl.processar_competencia("SIH", "SP", "202301")
    
    imp = session.query(DatasusImportacao).filter_by(competencia="202301", sistemaOrigem="SIH").first()
    assert imp is not None
    assert imp.status == "FALHA"

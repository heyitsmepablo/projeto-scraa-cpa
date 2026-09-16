from unittest.mock import patch, MagicMock
from sync_datasus.main import main, clean_database
from sync_datasus.database import DatasusSihRd, DatasusImportacao

def test_clean_database(session):
    # Setup some data
    imp = DatasusImportacao(competencia="202301", sistemaOrigem="SIH", status="SUCESSO")
    rd = DatasusSihRd(
        anoCmpt="2023", mesCmpt="01", diInter="20230101", 
        procRea="1234567890", cnes="1234567", valTot=10.0, 
        qtDiarias=1.0, ufZi="SP", financ="01", complex="MC"
    )
    session.add(imp)
    session.add(rd)
    session.commit()
    
    assert session.query(DatasusImportacao).count() == 1
    assert session.query(DatasusSihRd).count() == 1
    
    clean_database(session, ["SP"])
    
    assert session.query(DatasusImportacao).count() == 0
    assert session.query(DatasusSihRd).count() == 0

@patch('builtins.input', return_value='y')
@patch('sys.argv', ['sync_datasus', '--reset-only'])
@patch('sync_datasus.main.get_engine')
@patch('sync_datasus.main.get_session_factory')
@patch('sync_datasus.main.load_settings')
def test_main_reset_only(mock_load_settings, mock_get_session_factory, mock_get_engine, mock_input, mock_settings, session):
    mock_load_settings.return_value = mock_settings
    
    # Mock the session factory to return our test session
    mock_SessionLocal = MagicMock()
    mock_SessionLocal.return_value.__enter__.return_value = session
    mock_get_session_factory.return_value = mock_SessionLocal
    
    # Pre-populate
    imp = DatasusImportacao(competencia="202301", sistemaOrigem="SIH", status="SUCESSO")
    session.add(imp)
    session.commit()
    assert session.query(DatasusImportacao).count() == 1
    
    main()
    
    assert session.query(DatasusImportacao).count() == 0

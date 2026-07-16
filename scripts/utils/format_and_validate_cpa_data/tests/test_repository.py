from unittest.mock import MagicMock

from format_and_validate_cpa_data.repository import search_by_prefix, find_by_exact_code

def test_search_by_prefix(mocker):
    session = MagicMock()
    # Mocking session.execute(...).mappings().all()
    mock_execute = mocker.patch.object(session, "execute")
    mock_mappings = mock_execute.return_value.mappings
    mock_all = mock_mappings.return_value.all
    
    mock_all.return_value = [
        {"co_procedimento": "0301010011", "no_procedimento": "CONSULTA"},
        {"co_procedimento": "0301010020", "no_procedimento": "EXAME"}
    ]
    
    result = search_by_prefix(session, "030101")
    
    assert len(result) == 2
    assert result[0].co_procedimento == "0301010011"
    assert result[0].no_procedimento == "CONSULTA"
    
    assert result[1].co_procedimento == "0301010020"
    
    # check that we called with the right param
    call_args = mock_execute.call_args
    assert call_args[0][1]["prefix"] == "030101%"

def test_search_by_prefix_invalid_input():
    session = MagicMock()
    result = search_by_prefix(session, "03.01")
    assert result == []
    session.execute.assert_not_called()

def test_find_by_exact_code(mocker):
    session = MagicMock()
    # Mocking session.execute(...).mappings().first()
    mock_execute = mocker.patch.object(session, "execute")
    mock_mappings = mock_execute.return_value.mappings
    mock_first = mock_mappings.return_value.first
    
    mock_first.return_value = {"co_procedimento": "1234567890", "no_procedimento": "TESTE"}
    
    result = find_by_exact_code(session, "1234567890")
    
    assert result is not None
    assert result.co_procedimento == "1234567890"
    assert result.no_procedimento == "TESTE"

def test_find_by_exact_code_invalid_input():
    session = MagicMock()
    assert find_by_exact_code(session, "123") is None
    assert find_by_exact_code(session, "1234567890a") is None
    assert find_by_exact_code(session, "123456789.") is None
    session.execute.assert_not_called()

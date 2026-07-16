import pandas as pd

from format_and_validate_cpa_data.loader import extract_inconsistencies, _find_column_by_keyword, pre_sanitize_all_codes

def test_find_column_by_keyword():
    columns = ["NUMERO DO VINCULO", "NUMERO DO ADITIVO", "CODIGO DO PROCEDIMENTO SIGTAP"]
    
    assert _find_column_by_keyword(columns, ["vinculo"]) == "NUMERO DO VINCULO"
    assert _find_column_by_keyword(columns, ["aditivo"]) == "NUMERO DO ADITIVO"
    assert _find_column_by_keyword(columns, ["plano", "identificador"]) is None
    
    # Must exclude the code column if we search for description
    assert _find_column_by_keyword(columns, ["descricao", "nome"], exclude=["codigo"]) is None

def test_extract_inconsistencies():
    df = pd.DataFrame({
        "NUMERO DO VINCULO": ["V1", "V2", "V3", "V4"],
        "NUMERO DO ADITIVO": ["A1", "A2", "A3", "A4"],
        "CODIGO DO PROCEDIMENTO SIGTAP": [
            "1234567890",   # valid
            " 12345 ",      # invalid (len 5 after sanitize)
            "03.01.01",     # invalid (len 6 after sanitize)
            None            # invalid (empty)
        ]
    })
    
    # In openpyxl, row 1 is header, row 2 is index 0 in pandas
    # so row_excel = df.index + 2
    inconsistencies = extract_inconsistencies(df)
    
    assert len(inconsistencies) == 3
    
    assert inconsistencies[0].linha_excel == 3
    assert inconsistencies[0].codigo_atual == "12345"
    assert inconsistencies[0].vinculo == "V2"
    assert inconsistencies[0].aditivo == "A2"
    
    assert inconsistencies[1].linha_excel == 4
    assert inconsistencies[1].codigo_atual == "030101"
    
    assert inconsistencies[2].linha_excel == 5
    assert inconsistencies[2].codigo_atual == ""


def test_load_vinculos_lookup(mocker):
    # Mocking pd.read_excel
    df_mock = pd.DataFrame({
        "NUMERO DO VINCULO": ["V1", "V2"],
        "ESTABELECIMENTO": ["Hospital A", "Clinica B"],
        "CNES": ["12345", "67890"]
    })
    mocker.patch("pandas.read_excel", return_value=df_mock)
    
    # We can pass any Path since it's mocked
    from pathlib import Path
    from format_and_validate_cpa_data.loader import load_vinculos_lookup
    
    lookup = load_vinculos_lookup(Path("dummy.xlsx"))
    
    assert lookup["V1"] == ("Hospital A", "12345")
    assert lookup["V2"] == ("Clinica B", "67890")

def test_pre_sanitize_all_codes():
    import numpy as np
    df = pd.DataFrame({
        "CODIGO DO PROCEDIMENTO SIGTAP": [
            "0202010163 DOSAGEM DE ALFA",  # with text
            "0202010163",                  # already pure
            202010163.0,                   # float
            np.nan,                        # NaN
            "02.02.01.0163"                # with punctuation
        ]
    })
    
    changes = pre_sanitize_all_codes(df)
    
    assert len(changes) == 3  # Changes: text, float, punctuation. NaN is ignored.
    
    # 0-indexed in pandas, +2 for excel row
    assert changes[2] == "0202010163"
    assert df.at[0, "CODIGO DO PROCEDIMENTO SIGTAP"] == "0202010163"
    
    assert 3 not in changes
    assert df.at[1, "CODIGO DO PROCEDIMENTO SIGTAP"] == "0202010163"
    
    assert changes[4] == "202010163"
    assert df.at[2, "CODIGO DO PROCEDIMENTO SIGTAP"] == "202010163"
    
    assert 5 not in changes
    
    assert changes[6] == "0202010163"
    assert df.at[4, "CODIGO DO PROCEDIMENTO SIGTAP"] == "0202010163"

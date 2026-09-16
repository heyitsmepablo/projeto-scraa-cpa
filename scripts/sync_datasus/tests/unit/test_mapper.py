import pandas as pd
from decimal import Decimal
from sync_datasus.mapper import (
    safe_decimal,
    safe_str,
    safe_int_str,
    map_sih_rd_row,
    filter_and_map_sih_df,
    filter_and_map_sia_df
)

def test_safe_decimal():
    assert safe_decimal("123.45") == Decimal("123.45")
    assert safe_decimal(123.45) == Decimal("123.45")
    assert safe_decimal(123) == Decimal("123")
    assert safe_decimal("   123.45  ") == Decimal("123.45")
    assert safe_decimal(None) is None
    assert safe_decimal(pd.NA) is None
    assert safe_decimal("") is None
    assert safe_decimal("abc") is None

def test_safe_str():
    assert safe_str(" test ") == "test"
    assert safe_str(123) == "123"
    assert safe_str(None) is None
    assert safe_str(pd.NA) is None
    assert safe_str("") is None

def test_safe_int_str():
    assert safe_int_str("1234567") == "1234567"
    assert safe_int_str(1234567) == "1234567"
    assert safe_int_str(1234567.0) == "1234567"
    assert safe_int_str(" 1234567 ") == "1234567"
    assert safe_int_str(None) is None
    assert safe_int_str(pd.NA) is None

def test_map_sih_rd_row_cnes_valido(sample_cnes_ativos):
    row = pd.Series({
        "ANO_CMPT": "2023",
        "MES_CMPT": "01",
        "DI_INTER": "20230101",
        "PROC_REA": 301010158.0,
        "CNES": 1234567.0,
        "VAL_TOT": "1500.50",
        "QT_DIARIAS": 5,
        "UF_ZI": "SP",
        "FINANC": "01",
        "COMPLEX": "MC"
    })
    
    result = map_sih_rd_row(row, sample_cnes_ativos)
    assert result is not None
    assert result["cnes"] == "1234567"
    assert result["procRea"] == "0301010158"
    assert result["valTot"] == Decimal("1500.50")
    assert result["qtDiarias"] == Decimal("5")

def test_map_sih_rd_row_cnes_invalido(sample_cnes_ativos):
    row = pd.Series({"CNES": "9999999"})
    result = map_sih_rd_row(row, sample_cnes_ativos)
    assert result is None

def test_filter_and_map_sih_df_retorna_apenas_cnes_ativos(sample_cnes_ativos):
    df = pd.DataFrame([
        {"CNES": 1234567.0, "ANO_CMPT": "2023", "VAL_TOT": 100},
        {"CNES": 9999999.0, "ANO_CMPT": "2023", "VAL_TOT": 200},
        {"CNES": "7654321", "ANO_CMPT": "2023", "VAL_TOT": 300},
        {"ANO_CMPT": "2023"} # Sem CNES
    ])
    
    result = filter_and_map_sih_df(df, sample_cnes_ativos)
    assert len(result) == 2
    assert result[0]["cnes"] == "1234567"
    assert result[1]["cnes"] == "7654321"

def test_filter_and_map_sia_df(sample_cnes_ativos):
    df = pd.DataFrame([
        {"PA_CODUNI": "1234567", "PA_MVM": "202301", "PA_VALPRO": 150.50},
        {"PA_CODUNI": "0000000", "PA_MVM": "202301", "PA_VALPRO": 10.0},
        {"PA_CODUNI": 1234567.0, "PA_MVM": "202301", "PA_VALPRO": 20.0} # Float case
    ])
    
    result = filter_and_map_sia_df(df, sample_cnes_ativos)
    assert len(result) == 2
    assert result[0]["paCoduni"] == "1234567"
    assert result[0]["paValpro"] == Decimal("150.50")
    assert result[1]["paCoduni"] == "1234567"
    assert result[1]["paValpro"] == Decimal("20.0")

def test_filter_and_map_sia_df_missing_column(sample_cnes_ativos):
    df = pd.DataFrame([
        {"OTHER_COL": "1234567"}
    ])
    result = filter_and_map_sia_df(df, sample_cnes_ativos)
    assert result == []

def test_normalize_cnes():
    from sync_datasus.mapper import normalize_cnes
    assert normalize_cnes(996424) == "0996424"
    assert normalize_cnes("996424.0") == "0996424"
    assert normalize_cnes(" 996424 ") == "0996424"
    assert normalize_cnes(None) is None
    assert normalize_cnes("2458365") == "2458365"


def test_filter_and_map_sih_df_extracao_cirurgica():
    """Valida que a extração cirúrgica retém apenas registros com par (CNES, PROC) pactuado."""
    cnes_ativos = {"1234567", "7654321"}
    mapa_pactos = {
        "1234567": {"0301010158"},
        "7654321": {"0202010120"},
    }
    todos_procedimentos = {"0301010158", "0202010120"}

    df = pd.DataFrame([
        # 1. CNES ativo E procedimento pactuado para ele -> DEVE INCLUIR
        {"CNES": "1234567", "PROC_REA": "0301010158", "ANO_CMPT": "2024", "VAL_TOT": 100},
        # 2. CNES ativo MAS procedimento pactuado em OUTRO CNES -> DEVE DESCARTAR
        {"CNES": "1234567", "PROC_REA": "0202010120", "ANO_CMPT": "2024", "VAL_TOT": 150},
        # 3. CNES ativo MAS procedimento NÃO pactuado em nenhum plano -> DEVE DESCARTAR
        {"CNES": "1234567", "PROC_REA": "0401010010", "ANO_CMPT": "2024", "VAL_TOT": 200},
        # 4. Outro CNES ativo com procedimento pactuado (float) -> DEVE INCLUIR
        {"CNES": 7654321.0, "PROC_REA": 202010120.0, "ANO_CMPT": "2024", "VAL_TOT": 300},
        # 5. CNES inativo com procedimento pactuado -> DEVE DESCARTAR
        {"CNES": "9999999", "PROC_REA": "0301010158", "ANO_CMPT": "2024", "VAL_TOT": 400},
    ])

    result = filter_and_map_sih_df(
        df,
        cnes_ativos=cnes_ativos,
        mapa_pactos=mapa_pactos,
        todos_procedimentos_pactuados=todos_procedimentos,
    )

    assert len(result) == 2
    assert result[0]["cnes"] == "1234567"
    assert result[0]["procRea"] == "0301010158"
    assert result[1]["cnes"] == "7654321"
    assert result[1]["procRea"] == "0202010120"


def test_filter_and_map_sia_df_extracao_cirurgica():
    """Valida que a extração cirúrgica retém apenas registros ambulatoriais pactuados."""
    cnes_ativos = {"1234567"}
    mapa_pactos = {
        "1234567": {"0301010158"},
    }
    todos_procedimentos = {"0301010158"}

    df = pd.DataFrame([
        # Par válido
        {"PA_CODUNI": "1234567", "PA_PROC_ID": "0301010158", "PA_VALPRO": 50.0},
        # Procedimento não pactuado
        {"PA_CODUNI": "1234567", "PA_PROC_ID": "0999999999", "PA_VALPRO": 30.0},
        # CNES não cadastrado
        {"PA_CODUNI": "0000000", "PA_PROC_ID": "0301010158", "PA_VALPRO": 20.0},
    ])

    result = filter_and_map_sia_df(
        df,
        cnes_ativos=cnes_ativos,
        mapa_pactos=mapa_pactos,
        todos_procedimentos_pactuados=todos_procedimentos,
    )

    assert len(result) == 1
    assert result[0]["paCoduni"] == "1234567"
    assert result[0]["paProcId"] == "0301010158"

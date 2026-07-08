import pandas as pd

from sync_sigtap.database import SigtapProcedimento, SigtapChangelog, SigtapImportacao, get_session_factory
from sync_sigtap.etl_core import LayoutParser, SigtapEtl, FtpClient

def test_parse_layout_returns_correct_colspecs():
    layout_content = """tb_procedimento
Coluna,Tamanho,Inicio,Fim,Tipo
CO_PROCEDIMENTO,10,1,10,VARCHAR2
NO_PROCEDIMENTO,250,11,260,VARCHAR2
"""
    schemas = LayoutParser.parse_layout_file(layout_content)
    assert "tb_procedimento" in schemas
    assert len(schemas["tb_procedimento"]) == 2
    
    col0 = schemas["tb_procedimento"][0]
    assert col0.name == "CO_PROCEDIMENTO"
    assert col0.start == 0  # 1-1
    assert col0.end == 10
    
    col1 = schemas["tb_procedimento"][1]
    assert col1.name == "NO_PROCEDIMENTO"
    assert col1.start == 10 # 11-1
    assert col1.end == 260

def test_diff_detects_inserts():
    etl = SigtapEtl({})
    df_ftp = pd.DataFrame({
        "noProcedimento": ["Proc A", "Proc B"],
        "vlSh": [10.0, 20.0]
    }, index=pd.Index(["001", "002"], name="coProcedimento"))
    
    df_db = pd.DataFrame({
        "noProcedimento": ["Proc A"],
        "vlSh": [10.0]
    }, index=pd.Index(["001"], name="coProcedimento"))
    
    diff = etl.compute_diff(df_ftp, df_db)
    
    assert len(diff.inserts) == 1
    assert "002" in diff.inserts.index
    assert len(diff.updates) == 0
    assert len(diff.deletes) == 0

def test_diff_detects_updates_only_changed_cols():
    etl = SigtapEtl({})
    df_ftp = pd.DataFrame({
        "noProcedimento": ["Proc A", "Proc B Modificado"],
        "vlSh": [10.0, 25.0]
    }, index=pd.Index(["001", "002"], name="coProcedimento"))
    
    df_db = pd.DataFrame({
        "noProcedimento": ["Proc A", "Proc B Antigo"],
        "vlSh": [10.0, 20.0]
    }, index=pd.Index(["001", "002"], name="coProcedimento"))
    
    diff = etl.compute_diff(df_ftp, df_db)
    
    assert len(diff.inserts) == 0
    assert len(diff.updates) == 1
    assert "002" in diff.updates.index
    assert len(diff.deletes) == 0

def test_diff_detects_deletes():
    etl = SigtapEtl({})
    df_ftp = pd.DataFrame({
        "noProcedimento": ["Proc A"],
        "vlSh": [10.0]
    }, index=pd.Index(["001"], name="coProcedimento"))
    
    df_db = pd.DataFrame({
        "noProcedimento": ["Proc A", "Proc B"],
        "vlSh": [10.0, 20.0]
    }, index=pd.Index(["001", "002"], name="coProcedimento"))
    
    diff = etl.compute_diff(df_ftp, df_db)
    
    assert len(diff.inserts) == 0
    assert len(diff.updates) == 0
    assert len(diff.deletes) == 1
    assert "002" in diff.deletes.index

def test_diff_no_changes():
    etl = SigtapEtl({})
    df = pd.DataFrame({
        "noProcedimento": ["Proc A"],
        "vlSh": [10.0]
    }, index=pd.Index(["001"], name="coProcedimento"))
    
    diff = etl.compute_diff(df, df.copy())
    
    assert diff.inserts.empty
    assert diff.updates.empty
    assert diff.deletes.empty

def test_ftp_client_gets_latest_competencia(mocker):
    # Mock ftplib.FTP
    mock_ftp = mocker.MagicMock()
    mock_ftp.nlst.return_value = [
        "TabelaUnificada_202301.zip",
        "TabelaUnificada_202302.zip",
        "OutroArquivo.zip",
        "TabelaUnificada_202303_v2.zip"
    ]
    
    # Patch the FTP class in the module where it's used
    mocker.patch("sync_sigtap.etl_core.ftplib.FTP", return_value=mock_ftp)
    mock_ftp.__enter__.return_value = mock_ftp
    
    client = FtpClient("fakehost", "/fakedir")
    comp, fname = client.get_latest_competencia()
    
    assert comp == "202303"
    assert fname == "TabelaUnificada_202303_v2.zip"

def test_apply_diff_inserts_to_db(pg_engine):
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})
    
    with SessionLocal() as session:
        # Create an importacao first
        importacao = SigtapImportacao(competencia="202301", status="EM_ANDAMENTO")
        session.add(importacao)
        session.commit()
        
        df_ftp = pd.DataFrame({
            "noProcedimento": ["Procedimento Teste 1"],
            "tpComplexidade": ["1"],
            "tpSexo": ["A"],
            "qtMaximaExecucao": [1],
            "qtDiasPermanencia": [0],
            "qtPontos": [0],
            "vlIdadeMinima": [0],
            "vlIdadeMaxima": [9999],
            "vlSh": [10.50],
            "vlSa": [0.0],
            "vlSp": [0.0],
            "coFinanciamento": ["01"],
            "coRubrica": ["000000"],
            "qtTempoPermanencia": [0],
            "dtCompetencia": ["202301"]
        }, index=pd.Index(["0101010010"], name="coProcedimento"))
        
        df_db = pd.DataFrame()
        diff = etl.compute_diff(df_ftp, df_db)
        
        etl.apply_diff(diff, session, importacao.id, df_db, SigtapProcedimento, "tb_procedimento")
        
        # Verify
        procs = session.query(SigtapProcedimento).all()
        assert len(procs) == 1
        assert procs[0].coProcedimento == "0101010010"
        assert procs[0].noProcedimento == "Procedimento Teste 1"
        assert float(procs[0].vlSh) == 10.50
        
        logs = session.query(SigtapChangelog).all()
        assert len(logs) == 1
        assert logs[0].tipoOperacao == "INSERT"
        assert logs[0].dadosAntigos is None
        assert logs[0].dadosNovos["coProcedimento"] == "0101010010"

def test_apply_diff_delete_generates_log_no_hard_delete(pg_engine):
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})
    
    with SessionLocal() as session:
        importacao = SigtapImportacao(competencia="202302", status="EM_ANDAMENTO")
        session.add(importacao)
        session.commit()
        
        # Setup initial state directly in DB
        proc = SigtapProcedimento(
            coProcedimento="9999999999",
            noProcedimento="Para Deletar",
            tpComplexidade="1",
            tpSexo="F",
            qtMaximaExecucao=1,
            qtDiasPermanencia=0,
            qtPontos=0,
            vlIdadeMinima=0,
            vlIdadeMaxima=100,
            vlSh=0,
            vlSa=0,
            vlSp=0,
            coFinanciamento="00",
            coRubrica="000000",
            qtTempoPermanencia=0,
            dtCompetencia="202301"
        )
        session.add(proc)
        session.commit()
        
        df_db = etl.extract_table_from_db(session, SigtapProcedimento, "tb_procedimento")
        df_ftp = pd.DataFrame(index=pd.Index([], name="coProcedimento")) # FTP empty, so everything is deleted
        
        diff = etl.compute_diff(df_ftp, df_db)
        assert len(diff.deletes) == 1
        
        etl.apply_diff(diff, session, importacao.id, df_db, SigtapProcedimento, "tb_procedimento")
        
        # Verify soft delete
        proc_db = session.query(SigtapProcedimento).filter_by(coProcedimento="9999999999").first()
        assert proc_db is not None # not hard deleted
        assert proc_db.deletedAt is not None # is soft deleted
        
        logs = session.query(SigtapChangelog).filter_by(tipoOperacao="DELETE").all()
        assert len(logs) == 1
        assert logs[0].chaveRegistro == "9999999999"
        assert logs[0].dadosAntigos is not None
        assert logs[0].dadosNovos is None

def test_extract_from_zip_converts_monetary_values_correctly(tmp_path):
    import zipfile
    import io
    from sync_sigtap.etl_core import SigtapEtl
    import pandas as pd
    
    # We need to provide all columns the rename_map expects
    layout = """tb_procedimento
Coluna,Tamanho,Inicio,Fim,Tipo
CO_PROCEDIMENTO,10,1,10,VARCHAR2
NO_PROCEDIMENTO,250,11,260,VARCHAR2
TP_COMPLEXIDADE,1,261,261,VARCHAR2
TP_SEXO,1,262,262,VARCHAR2
QT_MAXIMA_EXECUCAO,4,263,266,NUMBER
QT_DIAS_PERMANENCIA,4,267,270,NUMBER
QT_PONTOS,4,271,274,NUMBER
VL_IDADE_MINIMA,4,275,278,NUMBER
VL_IDADE_MAXIMA,4,279,282,NUMBER
VL_SH,12,283,294,NUMBER
VL_SA,12,295,306,NUMBER
VL_SP,12,307,318,NUMBER
CO_FINANCIAMENTO,2,319,320,VARCHAR2
CO_RUBRICA,6,321,326,VARCHAR2
QT_TEMPO_PERMANENCIA,4,327,330,NUMBER
DT_COMPETENCIA,6,331,336,CHAR
"""
    
    # 0202010120 | DOSAGEM DE ACIDO URICO | 2 | I | 9999 | 9999 | 0000 | 0000 | 1571 | 000000000000 (sh) | 000000000185 (sa) | 000000000000 (sp) | 06 | spaces | 9999 | 202601
    line = "0202010120DOSAGEM DE ACIDO URICO                                                                                                                                                                                                                                    2I9999999900000000157100000000000000000000018500000000000006      9999202601\n"
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr("layout.txt", layout.encode('windows-1252'))
        zf.writestr("tb_procedimento.txt", line.encode('windows-1252'))
        
    zip_buffer.seek(0)
    zip_path = tmp_path / "mock_sigtap.zip"
    with open(zip_path, "wb") as f:
        f.write(zip_buffer.read())
        
    from sync_sigtap.etl_core import LayoutParser
    schemas = LayoutParser.parse_layout_file(layout)
    etl = SigtapEtl(schemas)
    df = etl.extract_table_from_zip(zip_path, "tb_procedimento")
    
    # The record should be in the dataframe, indexed by CO_PROCEDIMENTO
    row = df.loc["0202010120"]
    
    # Verify monetary values (should be divided by 100)
    assert row["vlSh"] == 0.0
    assert row["vlSa"] == 1.85
    assert row["vlSp"] == 0.0

def test_diff_detects_composite_pk_changes():
    from sync_sigtap.etl_core import SigtapEtl
    import pandas as pd
    
    etl = SigtapEtl({})
    
    # Simulate a composite PK table (e.g. tb_sia_sih)
    df_ftp = pd.DataFrame({
        "noProcedimentoSiaSih": ["Proc A", "Proc B Modificado"],
        "dtCompetencia": ["202301", "202301"]
    }, index=pd.MultiIndex.from_tuples([
        ("001", "1"), 
        ("002", "2")
    ], names=["coProcedimentoSiaSih", "tpProcedimento"]))
    
    df_db = pd.DataFrame({
        "noProcedimentoSiaSih": ["Proc A", "Proc B Antigo"],
        "dtCompetencia": ["202301", "202301"]
    }, index=pd.MultiIndex.from_tuples([
        ("001", "1"), 
        ("002", "2")
    ], names=["coProcedimentoSiaSih", "tpProcedimento"]))
    
    diff = etl.compute_diff(df_ftp, df_db)
    
    assert len(diff.inserts) == 0
    assert len(diff.updates) == 1
    assert diff.updates.index.tolist() == [("002", "2")]
    assert len(diff.deletes) == 0


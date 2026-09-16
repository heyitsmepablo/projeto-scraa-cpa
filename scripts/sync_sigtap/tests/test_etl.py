from datetime import date, datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock
import pandas as pd
from scripts.shared.models.cpa import Instituicao

from sync_sigtap.database import (
    SigtapProcedimento,
    SigtapChangelog,
    SigtapImportacao,
    SigtapComponenteRede,
    SigtapTuss,
    SigtapRenases,
    Vinculo,
    get_session_factory,
)
from sync_sigtap.etl_core import LayoutParser, SigtapEtl, FtpClient
from sync_sigtap.main import get_oldest_contract_competencia

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
        
        etl.apply_diff(diff, session, importacao.id, df_db, SigtapProcedimento, "tb_procedimento", competencia="202301")
        
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
        
        etl.apply_diff(diff, session, importacao.id, df_db, SigtapProcedimento, "tb_procedimento", competencia="202302")
        
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


def test_upsert_table_empty_df():
    """Valida que upsert_table retorna 0 imediatamente para DataFrame vazio."""
    from unittest.mock import MagicMock
    etl = SigtapEtl({})
    session = MagicMock()
    result = etl.upsert_table(
        session=session,
        model_class=SigtapProcedimento,
        table_name="tb_procedimento",
        df_ftp=pd.DataFrame(),
        competencia="202401",
    )
    assert result == 0
    session.execute.assert_not_called()
    session.bulk_insert_mappings.assert_not_called()


def test_upsert_table_deduplication():
    """Valida que linhas duplicadas na chave primária são deduplicadas mantendo a última."""
    from unittest.mock import MagicMock
    etl = SigtapEtl({})
    session = MagicMock()
    session.bind.dialect.name = "sqlite"

    df_ftp = pd.DataFrame([
        {"coProcedimento": "0101010010", "noProcedimento": "Versao 1", "vlSh": 10.0},
        {"coProcedimento": "0101010010", "noProcedimento": "Versao 2", "vlSh": 20.0}, # duplicata
        {"coProcedimento": "0202010120", "noProcedimento": "Outro Proc", "vlSh": 30.0},
    ]).set_index("coProcedimento")

    total = etl.upsert_table(
        session=session,
        model_class=SigtapProcedimento,
        table_name="tb_procedimento",
        df_ftp=df_ftp,
        competencia="202401",
    )

    assert total == 2  # Deduplicado de 3 para 2 registros
    assert session.bulk_insert_mappings.call_count == 1
    call_args = session.bulk_insert_mappings.call_args[0]
    inserted_records = call_args[1]
    assert len(inserted_records) == 2
    assert inserted_records[0]["noProcedimento"] == "Versao 2"


def test_upsert_table_sqlite_execution(pg_engine):
    """Valida a execução de upsert_table persistindo dados no SQLite (fallback bulk_insert_mappings)."""
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})

    df_ftp = pd.DataFrame([
        {
            "coProcedimento": "0301010158",
            "noProcedimento": "Consulta Medica Especializada",
            "tpComplexidade": "2",
            "tpSexo": "A",
            "qtMaximaExecucao": 99,
            "qtDiasPermanencia": 0,
            "qtPontos": 0,
            "vlIdadeMinima": 0,
            "vlIdadeMaxima": 120,
            "vlSh": 0.0,
            "vlSa": 15.0,
            "vlSp": 0.0,
            "coFinanciamento": "01",
            "coRubrica": "000000",
            "qtTempoPermanencia": 0,
            "dtCompetencia": "202401",
        }
    ]).set_index("coProcedimento")

    with SessionLocal() as session:
        count = etl.upsert_table(
            session=session,
            model_class=SigtapProcedimento,
            table_name="tb_procedimento",
            df_ftp=df_ftp,
            competencia="202401",
        )
        session.commit()

        assert count == 1
        proc = session.query(SigtapProcedimento).filter_by(coProcedimento="0301010158").first()
        assert proc is not None
        assert proc.noProcedimento == "Consulta Medica Especializada"
        assert float(proc.vlSa) == 15.0


def test_upsert_table_postgres_dialect_calls_execute():
    """Valida que sob dialeto PostgreSQL o método monta e executa ON CONFLICT DO UPDATE."""
    from unittest.mock import MagicMock
    etl = SigtapEtl({})
    session = MagicMock()
    session.bind.dialect.name = "postgresql"

    df_ftp = pd.DataFrame([
        {
            "coProcedimento": "0101010010",
            "noProcedimento": "Teste PostgreSQL",
            "vlSh": 10.0,
        }
    ]).set_index("coProcedimento")

    count = etl.upsert_table(
        session=session,
        model_class=SigtapProcedimento,
        table_name="tb_procedimento",
        df_ftp=df_ftp,
        competencia="202401",
    )

    assert count == 1
    assert session.execute.call_count == 1
    assert session.flush.call_count == 1


def test_upsert_table_tb_componente_rede_snake_case_pk_no_keyerror(pg_engine):
    """Valida que upsert_table não lança KeyError para tb_componente_rede (PK snake_case co_componente_rede)."""
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})

    df_ftp = pd.DataFrame([
        {
            "coComponenteRede": "CR001",
            "noComponenteRede": "Componente Especializado",
            "coRedeAtencao": "001",
        },
        {
            "coComponenteRede": "CR002",
            "noComponenteRede": "Componente Basico",
            "coRedeAtencao": "002",
        },
    ]).set_index("coComponenteRede")

    # 1. Execução no SQLite (fallback)
    with SessionLocal() as session:
        count = etl.upsert_table(
            session=session,
            model_class=SigtapComponenteRede,
            table_name="tb_componente_rede",
            df_ftp=df_ftp,
            competencia="202401",
        )
        session.commit()
        assert count == 2

        reg = session.query(SigtapComponenteRede).filter_by(coComponenteRede="CR001").first()
        assert reg is not None
        assert reg.noComponenteRede == "Componente Especializado"
        assert reg.coRedeAtencao == "001"

    # 2. Execução com dialeto PostgreSQL mockado para checar ON CONFLICT e target_columns
    mock_session = MagicMock()
    mock_session.bind.dialect.name = "postgresql"
    count_pg = etl.upsert_table(
        session=mock_session,
        model_class=SigtapComponenteRede,
        table_name="tb_componente_rede",
        df_ftp=df_ftp,
        competencia="202401",
    )
    assert count_pg == 2
    assert mock_session.execute.call_count == 1
    stmt = mock_session.execute.call_args[0][0]
    assert "sigtap_tb_componente_rede" in str(stmt)


def test_upsert_table_tb_tuss_snake_case_pk_no_keyerror(pg_engine):
    """Valida que upsert_table não lança KeyError para tb_tuss (PK snake_case co_tuss)."""
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})

    df_ftp = pd.DataFrame([
        {
            "coTuss": "TUSS100001",
            "noTuss": "Procedimento Odontologico Tuss",
        }
    ]).set_index("coTuss")

    with SessionLocal() as session:
        count = etl.upsert_table(
            session=session,
            model_class=SigtapTuss,
            table_name="tb_tuss",
            df_ftp=df_ftp,
            competencia="202401",
        )
        session.commit()
        assert count == 1

        reg = session.query(SigtapTuss).filter_by(coTuss="TUSS100001").first()
        assert reg is not None
        assert reg.noTuss == "Procedimento Odontologico Tuss"

    # Dialeto PostgreSQL
    mock_session = MagicMock()
    mock_session.bind.dialect.name = "postgresql"
    count_pg = etl.upsert_table(
        session=mock_session,
        model_class=SigtapTuss,
        table_name="tb_tuss",
        df_ftp=df_ftp,
        competencia="202401",
    )
    assert count_pg == 1
    assert mock_session.execute.call_count == 1


def test_upsert_table_tb_renases_snake_case_pk_no_keyerror(pg_engine):
    """Valida que upsert_table não lança KeyError para tb_renases (PK snake_case co_renases)."""
    SessionLocal = get_session_factory(pg_engine)
    etl = SigtapEtl({})

    df_ftp = pd.DataFrame([
        {
            "coRenases": "REN0000001",
            "noRenases": "Acao de Saude Renases",
        }
    ]).set_index("coRenases")

    with SessionLocal() as session:
        count = etl.upsert_table(
            session=session,
            model_class=SigtapRenases,
            table_name="tb_renases",
            df_ftp=df_ftp,
            competencia="202401",
        )
        session.commit()
        assert count == 1

        reg = session.query(SigtapRenases).filter_by(coRenases="REN0000001").first()
        assert reg is not None
        assert reg.noRenases == "Acao de Saude Renases"

    # Dialeto PostgreSQL
    mock_session = MagicMock()
    mock_session.bind.dialect.name = "postgresql"
    count_pg = etl.upsert_table(
        session=mock_session,
        model_class=SigtapRenases,
        table_name="tb_renases",
        df_ftp=df_ftp,
        competencia="202401",
    )
    assert count_pg == 1
    assert mock_session.execute.call_count == 1


def test_sync_sigtap_get_oldest_contract_competencia_com_vinculo(pg_engine):
    """Valida que sync_sigtap obtém a competência (YYYYMM) da dataInicio mais antiga de Vinculo."""
    SessionLocal = get_session_factory(pg_engine)

    with SessionLocal() as session:
        inst = Instituicao(id=1, cnes="1234567", nome="Hosp Teste", tipoInstituicao="FILANTRÓPICO")
        session.add(inst)
        # Vínculo mais antigo: 2023-05-10 -> competência 202305
        v1 = Vinculo(
            id=101,
            instituicaoId=1,
            numero="001/2023",
            numeroProcessoSei="SEI-001",
            tipoVinculo="CONTRATO",
            objeto="Objeto 1",
            complexidade=["MC"],
            dataDaAssinatura=datetime(2023, 5, 1, tzinfo=timezone.utc),
            dataInicio=date(2023, 5, 10),
            valorTotal=Decimal("1000.00"),
        )
        # Vínculo mais recente: 2024-01-01
        v2 = Vinculo(
            id=102,
            instituicaoId=1,
            numero="002/2024",
            numeroProcessoSei="SEI-002",
            tipoVinculo="CONTRATO",
            objeto="Objeto 2",
            complexidade=["AC"],
            dataDaAssinatura=datetime(2024, 1, 1, tzinfo=timezone.utc),
            dataInicio=date(2024, 1, 1),
            valorTotal=Decimal("2000.00"),
        )
        session.add_all([v1, v2])
        session.commit()

        oldest = get_oldest_contract_competencia(session)
        assert oldest == "202305"


def test_sync_sigtap_get_oldest_contract_competencia_sem_vinculo(pg_engine):
    """Valida que get_oldest_contract_competencia retorna None quando não há vínculos."""
    SessionLocal = get_session_factory(pg_engine)
    with SessionLocal() as session:
        assert get_oldest_contract_competencia(session) is None


def test_sync_sigtap_get_oldest_contract_competencia_ignora_deletados(pg_engine):
    """Valida que contratos deletados (deletadoEm não nulo) são ignorados na determinação da competência mais antiga."""
    SessionLocal = get_session_factory(pg_engine)

    with SessionLocal() as session:
        inst = Instituicao(id=2, cnes="7654321", nome="Hosp Teste 2", tipoInstituicao="FILANTRÓPICO")
        session.add(inst)
        # Vínculo antigo deletado
        v_deletado = Vinculo(
            id=201,
            instituicaoId=2,
            numero="003/2021",
            numeroProcessoSei="SEI-003",
            tipoVinculo="CONTRATO",
            objeto="Objeto Deletado",
            complexidade=["BC"],
            dataDaAssinatura=datetime(2021, 1, 1, tzinfo=timezone.utc),
            dataInicio=date(2021, 1, 1),
            valorTotal=Decimal("500.00"),
            deletadoEm=datetime(2022, 1, 1, 12, 0, tzinfo=timezone.utc),
        )
        # Vínculo ativo mais antigo
        v_ativo = Vinculo(
            id=202,
            instituicaoId=2,
            numero="004/2023",
            numeroProcessoSei="SEI-004",
            tipoVinculo="CONTRATO",
            objeto="Objeto Ativo",
            complexidade=["MC"],
            dataDaAssinatura=datetime(2023, 9, 15, tzinfo=timezone.utc),
            dataInicio=date(2023, 9, 15),
            valorTotal=Decimal("1500.00"),
        )
        session.add_all([v_deletado, v_ativo])
        session.commit()

        oldest = get_oldest_contract_competencia(session)
        assert oldest == "202309"


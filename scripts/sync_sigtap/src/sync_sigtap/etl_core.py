"""Processamento de ETL do SIGTAP com suporte a UPSERT PostgreSQL nativo e diffing."""

import ftplib
import logging
import re
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from .database import SigtapChangelog, SigtapImportacao
from scripts.shared.sanitizers import safe_str

logger = logging.getLogger(__name__)


def to_camel(s: str) -> str:
    """Converte snake_case ou UPPER_CASE para camelCase."""
    parts = s.lower().split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def clean_nan(val: Any) -> Any:
    """Substitui NaN e NaT por None para compatibilidade com JSON e SQL."""
    if isinstance(val, dict):
        return {k: clean_nan(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [clean_nan(v) for v in val]
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    return val


class FtpConnectionError(Exception):
    pass


class FtpFileNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class ColumnDef:
    name: str
    start: int
    end: int
    dtype: str


@dataclass
class DiffResult:
    inserts: pd.DataFrame
    updates: pd.DataFrame
    deletes: pd.DataFrame


class FtpClient:
    def __init__(self, host: str, directory: str, timeout: int = 30):
        self.host = host
        self.directory = directory
        self.timeout = timeout

    def get_latest_competencia(self) -> Tuple[str, str]:
        try:
            with ftplib.FTP(self.host, timeout=self.timeout) as ftp:
                ftp.login()
                ftp.cwd(self.directory)
                files = ftp.nlst()
        except Exception as e:
            raise FtpConnectionError(f"Erro ao conectar no FTP: {e}") from e

        pattern = re.compile(r"^TabelaUnificada_(\d{6})(?:_.*)?\.zip$")
        valid_files = []
        for f in files:
            m = pattern.match(f)
            if m:
                valid_files.append((m.group(1), f))

        if not valid_files:
            raise FtpFileNotFoundError("Nenhum arquivo TabelaUnificada encontrado no FTP.")

        valid_files.sort(key=lambda x: x[0], reverse=True)
        return valid_files[0]

    def get_competencias_from(self, inicial: str) -> List[Tuple[str, str]]:
        try:
            with ftplib.FTP(self.host, timeout=self.timeout) as ftp:
                ftp.login()
                ftp.cwd(self.directory)
                files = ftp.nlst()
        except Exception as e:
            raise FtpConnectionError(f"Erro ao conectar no FTP: {e}") from e

        pattern = re.compile(r"^TabelaUnificada_(\d{6})(?:_.*)?\.zip$")
        valid_files = []
        for f in files:
            m = pattern.match(f)
            if m:
                comp = m.group(1)
                if comp >= inicial:
                    valid_files.append((comp, f))

        if not valid_files:
            raise FtpFileNotFoundError(
                f"Nenhum arquivo TabelaUnificada encontrado no FTP a partir de {inicial}."
            )

        valid_files.sort(key=lambda x: x[0])
        return valid_files

    def download_zip(self, filename: str, dest: Path) -> Path:
        dest_file = dest / filename
        logger.info(f"Baixando {filename} para {dest_file}...")
        try:
            with ftplib.FTP(self.host, timeout=self.timeout) as ftp:
                ftp.login()
                ftp.cwd(self.directory)
                with open(dest_file, "wb") as f:
                    ftp.retrbinary(f"RETR {filename}", f.write)
            return dest_file
        except Exception as e:
            if dest_file.exists():
                dest_file.unlink()
            raise FtpConnectionError(f"Erro no download de {filename}: {e}") from e


class LayoutParser:
    @staticmethod
    def parse_layout_file(layout_content: str) -> Dict[str, List[ColumnDef]]:
        lines = layout_content.splitlines()
        schemas: Dict[str, List[ColumnDef]] = {}
        current_table = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if "," not in line:
                current_table = line
                schemas[current_table] = []
            elif line.startswith("Coluna,Tamanho,Inicio,Fim,Tipo"):
                continue
            elif current_table:
                parts = line.split(",")
                if len(parts) >= 5:
                    col_name = parts[0].strip()
                    start = int(parts[2].strip()) - 1
                    end = int(parts[3].strip())
                    dtype = parts[4].strip()
                    schemas[current_table].append(ColumnDef(col_name, start, end, dtype))

        return schemas


# Chaves primárias e de conflito explícitas por tabela
TABLE_CONFLICT_KEYS = {
    "tb_procedimento": ["coProcedimento"],
    "tb_financiamento": ["coFinanciamento"],
    "tb_rubrica": ["coRubrica"],
    "tb_sub_grupo": ["coGrupo", "coSubGrupo"],
    "tb_forma_organizacao": ["coGrupo", "coSubGrupo", "coFormaOrganizacao"],
    "tb_servico_classificacao": ["coServico", "coClassificacao"],
    "tb_sia_sih": ["coProcedimentoSiaSih", "tpProcedimento"],
}


class SigtapEtl:
    def __init__(self, schemas: Dict[str, List[ColumnDef]]):
        self.schemas = schemas

    def extract_table_from_zip(self, zip_path: Path, table_name: str) -> pd.DataFrame:
        """Lê o arquivo .txt de uma tabela de dentro do ZIP e converte tipos."""
        if table_name not in self.schemas:
            raise ValueError(f"Schema da {table_name} não encontrado no layout.txt")

        cols = self.schemas[table_name]
        col_specs = [(c.start, c.end) for c in cols]
        col_names = [c.name for c in cols]

        with zipfile.ZipFile(zip_path, "r") as z:
            txt_name = f"{table_name}.txt"
            if txt_name not in z.namelist():
                logger.warning(f"Arquivo {txt_name} não encontrado no ZIP.")
                return pd.DataFrame()

            with z.open(txt_name) as f:
                df = pd.read_fwf(
                    f,
                    colspecs=col_specs,
                    names=col_names,
                    encoding="windows-1252",
                    dtype=str,
                )

        # Converte tipos numéricos
        for c in cols:
            if c.dtype == "NUMBER":
                df[c.name] = pd.to_numeric(df[c.name], errors="coerce").fillna(0)
                if c.name.startswith("VL_"):
                    df[c.name] = df[c.name] / 100
                else:
                    df[c.name] = df[c.name].astype(int)

        # Normaliza nomes de colunas para camelCase
        df.rename(columns=lambda x: to_camel(x), inplace=True)

        if table_name in TABLE_CONFLICT_KEYS:
            pk_cols = TABLE_CONFLICT_KEYS[table_name]
        else:
            pk_cols = [df.columns[0]]

        df.set_index(pk_cols, inplace=True)
        df = df.fillna("")
        return df

    def upsert_table(
        self,
        session: Session,
        model_class: Any,
        table_name: str,
        df_ftp: pd.DataFrame,
        competencia: str,
        batch_size: int = 2000,
    ) -> int:
        """Realiza a carga idempotente via INSERT ... ON CONFLICT DO UPDATE nativo do PostgreSQL.
        
        Elimina a necessidade de puxar tabelas inteiras do banco com pd.read_sql.
        """
        if df_ftp.empty:
            return 0

        # Reseta o index para transformar as PKs em colunas normais
        df_work = df_ftp.reset_index().copy()

        # Garante coluna de competência se o modelo a possuir
        model_cols = {c.name: c for c in model_class.__table__.columns}
        if "dt_competencia" in model_cols or "dtCompetencia" in model_cols:
            df_work["dtCompetencia"] = competencia

        # Determina as colunas de conflito (chaves primárias ou únicas)
        if table_name in TABLE_CONFLICT_KEYS:
            conflict_col_names = TABLE_CONFLICT_KEYS[table_name]
        else:
            pk_cols = [to_camel(col.name) for col in model_class.__table__.primary_key.columns if col.name != "id"]
            conflict_col_names = pk_cols if pk_cols else [to_camel(model_class.__table__.columns[0].name)]

        # Deduplica para evitar CardinalityViolation em ON CONFLICT DO UPDATE
        df_work = df_work.drop_duplicates(subset=conflict_col_names, keep="last")

        records = df_work.to_dict(orient="records")
        records = clean_nan(records)

        # Mapeia para os objetos Column do SQLAlchemy
        target_columns = []
        for name in conflict_col_names:
            col_obj = getattr(model_class, name, None)
            if col_obj is None:
                # Tenta snake_case
                for c in model_class.__table__.columns:
                    if c.name.lower() == name.lower() or to_camel(c.name) == name:
                        col_obj = c
                        break
            if col_obj is not None:
                target_columns.append(col_obj)

        total_inseridos = 0

        # Verifica se o banco é PostgreSQL
        is_postgres = (
            session.bind is not None and session.bind.dialect.name == "postgresql"
        )

        for i in range(0, len(records), batch_size):
            chunk = records[i:i + batch_size]
            if is_postgres and target_columns:
                stmt = pg_insert(model_class).values(chunk)
                # Colunas a serem atualizadas no conflito (todas exceto as PKs e timestamps de criação)
                excluded_col_names = set(conflict_col_names) | {"id", "criado_em", "criadoEm"}
                update_cols = {}
                for c in model_class.__table__.columns:
                    attr_name = c.name
                    # Encontra o nome do atributo no modelo
                    for prop_name, prop in model_class.__mapper__.column_attrs.items():
                        if prop.columns[0] == c:
                            attr_name = prop_name
                            break
                    if attr_name not in excluded_col_names and c.name not in excluded_col_names:
                        update_cols[c.name] = getattr(stmt.excluded, c.name)

                if update_cols:
                    if "atualizado_em" in model_cols:
                        update_cols["atualizado_em"] = datetime.utcnow()
                    stmt = stmt.on_conflict_do_update(
                        index_elements=target_columns,
                        set_=update_cols,
                    )
                else:
                    stmt = stmt.on_conflict_do_nothing(index_elements=target_columns)

                session.execute(stmt)
            else:
                # Fallback para inserção em lote simples / testes
                session.bulk_insert_mappings(model_class, chunk)

            total_inseridos += len(chunk)

        session.flush()
        return total_inseridos

    def extract_table_from_db(
        self, session: Session, model_class: Any, table_name: str
    ) -> pd.DataFrame:
        """Extrai registros existentes do banco (utilizado por rotinas de auditoria e testes)."""
        query = session.query(model_class).filter(model_class.deletadoEm.is_(None))
        df = pd.read_sql(query.statement, session.bind)
        if not df.empty:
            df.rename(columns=lambda x: to_camel(x), inplace=True)

            if table_name in TABLE_CONFLICT_KEYS:
                pk_cols = TABLE_CONFLICT_KEYS[table_name]
            else:
                domain_cols = [
                    c
                    for c in df.columns
                    if c != "id"
                    and c
                    not in [
                        "criadoEm",
                        "atualizadoEm",
                        "deletedAt",
                        "deletadoEm",
                        "deletadoNaCompetencia",
                    ]
                ]
                pk_cols = [domain_cols[0]] if domain_cols else [df.columns[0]]

            df.set_index(pk_cols, inplace=True)
            cols_to_drop = [
                "criadoEm",
                "atualizadoEm",
                "deletedAt",
                "deletadoEm",
                "deletadoNaCompetencia",
            ]
            df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors="ignore")
        return df

    def compute_diff(self, df_ftp: pd.DataFrame, df_db: pd.DataFrame) -> DiffResult:
        """Compara DataFrames para testes ou detecção fina de changelogs."""
        if df_db.empty:
            return DiffResult(inserts=df_ftp, updates=pd.DataFrame(), deletes=pd.DataFrame())

        idx_inserts = df_ftp.index.difference(df_db.index)
        inserts = df_ftp.loc[idx_inserts].copy()

        idx_deletes = df_db.index.difference(df_ftp.index)
        deletes = df_db.loc[idx_deletes].copy()

        idx_common = df_ftp.index.intersection(df_db.index)
        if idx_common.empty:
            updates = pd.DataFrame(columns=df_ftp.columns)
        else:
            common_cols = df_ftp.columns.intersection(df_db.columns)
            df_ftp_common = df_ftp.loc[idx_common, common_cols]
            df_db_common = df_db.loc[idx_common, common_cols]

            ne = (df_ftp_common != df_db_common) & ~(
                df_ftp_common.isna() & df_db_common.isna()
            )
            rows_with_changes = ne.any(axis=1)
            updates = df_ftp_common[rows_with_changes].copy()

        return DiffResult(inserts, updates, deletes)

    def apply_diff(
        self,
        diff: DiffResult,
        session: Session,
        importacao_id: int,
        df_db: pd.DataFrame,
        model_class: Any,
        table_name: str,
        competencia: str,
    ) -> None:
        """Aplica o diff no banco de dados e gera entradas de SigtapChangelog."""
        now = datetime.utcnow()
        changelog_dicts = []

        if session.bind and session.bind.dialect.name == "postgresql":
            session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

        name_cols = [c for c in diff.inserts.columns if c.startswith("no")]
        name_col = name_cols[0] if name_cols else None

        def get_pk_str(idx_val: Any) -> str:
            if isinstance(idx_val, tuple):
                return "-".join(str(v) for v in idx_val)
            return str(idx_val)

        # INSERTS
        if not diff.inserts.empty:
            inserts_df = diff.inserts.reset_index()
            inserts_dict = clean_nan(inserts_df.to_dict(orient="records"))
            batch_size = 500
            for i in range(0, len(inserts_dict), batch_size):
                chunk = inserts_dict[i:i + batch_size]
                session.bulk_insert_mappings(model_class, chunk)

            for i, row in enumerate(inserts_dict):
                idx_val = diff.inserts.index[i]
                changelog_dicts.append({
                    "importacaoId": importacao_id,
                    "tabela": model_class.__tablename__,
                    "chaveRegistro": get_pk_str(idx_val),
                    "descricaoRegistro": row.get(name_col) if name_col else None,
                    "tipoOperacao": "INSERT",
                    "dadosAntigos": None,
                    "dadosNovos": row,
                })

        # UPDATES
        if not diff.updates.empty:
            updates_df = diff.updates.reset_index()
            updates_list = clean_nan(updates_df.to_dict(orient="records"))

            if "id" in df_db.columns:
                id_series = df_db.loc[diff.updates.index, "id"]
                for j, id_val in enumerate(id_series):
                    updates_list[j]["id"] = int(id_val)

            batch_size = 500
            for i in range(0, len(updates_list), batch_size):
                chunk = updates_list[i:i + batch_size]
                session.bulk_update_mappings(model_class, chunk)

            db_full_df = df_db.loc[diff.updates.index].reset_index()
            db_list = clean_nan(db_full_df.to_dict(orient="records"))

            for j, db_row in enumerate(db_list):
                ftp_row = updates_list[j]
                idx_val = diff.updates.index[j]

                changelog_dicts.append({
                    "importacaoId": importacao_id,
                    "tabela": model_class.__tablename__,
                    "chaveRegistro": get_pk_str(idx_val),
                    "descricaoRegistro": ftp_row.get(name_col) if name_col else None,
                    "tipoOperacao": "UPDATE",
                    "dadosAntigos": db_row,
                    "dadosNovos": ftp_row,
                })

        # DELETES (Soft delete)
        if not diff.deletes.empty:
            pk_names = diff.deletes.index.names
            if len(pk_names) == 1:
                pk_name = pk_names[0]
                keys = diff.deletes.index.tolist()
                col_attr = getattr(model_class, pk_name, None)
                if col_attr is not None:
                    session.query(model_class).filter(col_attr.in_(keys)).update(
                        {"deletadoEm": now, "deletadoNaCompetencia": competencia},
                        synchronize_session=False,
                    )

            deletes_df = diff.deletes.reset_index()
            deletes_dict = clean_nan(deletes_df.to_dict(orient="records"))
            for i, row in enumerate(deletes_dict):
                idx_val = diff.deletes.index[i]
                changelog_dicts.append({
                    "importacaoId": importacao_id,
                    "tabela": model_class.__tablename__,
                    "chaveRegistro": get_pk_str(idx_val),
                    "descricaoRegistro": row.get(name_col) if name_col else None,
                    "tipoOperacao": "DELETE",
                    "dadosAntigos": row,
                    "dadosNovos": None,
                })

        if changelog_dicts:
            batch_size = 200
            for i in range(0, len(changelog_dicts), batch_size):
                chunk = changelog_dicts[i:i + batch_size]
                session.bulk_insert_mappings(SigtapChangelog, chunk)

        session.commit()

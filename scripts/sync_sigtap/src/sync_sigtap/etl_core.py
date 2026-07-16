import ftplib
import zipfile
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Tuple
import pandas as pd
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from .database import SigtapChangelog
import sync_sigtap.database as db_models

logger = logging.getLogger(__name__)

def to_camel(s):
    parts = s.lower().split('_')
    return parts[0] + ''.join(p.title() for p in parts[1:])

def clean_nan(val):
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

class FtpConnectionError(Exception): pass
class FtpFileNotFoundError(Exception): pass

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
            raise FtpFileNotFoundError(f"Nenhum arquivo TabelaUnificada encontrado no FTP a partir de {inicial}.")
            
        valid_files.sort(key=lambda x: x[0])  # Crescente (do mais antigo para o mais novo)
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

class SigtapEtl:
    def __init__(self, schemas: Dict[str, List[ColumnDef]]):
        self.schemas = schemas

    def extract_table_from_zip(self, zip_path: Path, table_name: str) -> pd.DataFrame:
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
                    dtype=str
                )
                
        # Convert numeric columns
        for c in cols:
            if c.dtype == "NUMBER":
                # Handle empty/spaces
                df[c.name] = pd.to_numeric(df[c.name], errors="coerce").fillna(0)
                # If size >= 12 or starts with VL_, it's monetary (cents)
                if c.name.startswith("VL_"):
                    df[c.name] = df[c.name] / 100
                else:
                    df[c.name] = df[c.name].astype(int)

        # Dynamic rename to camelCase
        df.rename(columns=lambda x: to_camel(x), inplace=True)
        
        # Explicit PK mapping for tables with composite keys
        COMPOSITE_PKS = {
            "tb_sub_grupo": ["coGrupo", "coSubGrupo"],
            "tb_forma_organizacao": ["coGrupo", "coSubGrupo", "coFormaOrganizacao"],
            "tb_servico_classificacao": ["coServico", "coClassificacao"],
            "tb_sia_sih": ["coProcedimentoSiaSih", "tpProcedimento"]
        }
        if table_name in COMPOSITE_PKS:
            pk_cols = COMPOSITE_PKS[table_name]
        else:
            pk_cols = [df.columns[0]]
            
        df.set_index(pk_cols, inplace=True)
        # Fill empty strings
        df = df.fillna("")
        return df

    def extract_table_from_db(self, session: Session, model_class, table_name: str) -> pd.DataFrame:
        query = session.query(model_class).filter(model_class.deletadoEm.is_(None))
        df = pd.read_sql(query.statement, session.bind)
        if not df.empty:
            # DB cols are snake_case, rename to camelCase
            df.rename(columns=lambda x: to_camel(x), inplace=True)
            
            # Explicit PK mapping for tables with composite keys
            COMPOSITE_PKS = {
                "tb_sub_grupo": ["coGrupo", "coSubGrupo"],
                "tb_forma_organizacao": ["coGrupo", "coSubGrupo", "coFormaOrganizacao"],
                "tb_servico_classificacao": ["coServico", "coClassificacao"],
                "tb_sia_sih": ["coProcedimentoSiaSih", "tpProcedimento"]
            }
            if table_name in COMPOSITE_PKS:
                pk_cols = COMPOSITE_PKS[table_name]
            else:
                # the first DB column is usually 'id' (if autoincrement), so we must find the first actual domain column
                domain_cols = [c for c in df.columns if c != "id" and c not in ["criadoEm", "atualizadoEm", "deletedAt", "deletadoEm", "deletadoNaCompetencia"]]
                pk_cols = [domain_cols[0]] if domain_cols else [df.columns[0]]
                
            df.set_index(pk_cols, inplace=True)
            cols_to_drop = ["criadoEm", "atualizadoEm", "deletedAt", "deletadoEm", "deletadoNaCompetencia"]
            df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors="ignore")
        return df

    def compute_diff(self, df_ftp: pd.DataFrame, df_db: pd.DataFrame) -> DiffResult:
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

            ne = (df_ftp_common != df_db_common) & ~(df_ftp_common.isna() & df_db_common.isna())
            rows_with_changes = ne.any(axis=1)
            updates = df_ftp_common[rows_with_changes].copy()

        return DiffResult(inserts, updates, deletes)

    def apply_diff(self, diff: DiffResult, session: Session, importacao_id: int, df_db: pd.DataFrame, model_class, table_name: str, competencia: str) -> None:
        from sqlalchemy import text
        now = datetime.utcnow()
        changelog_dicts = []
        
        # Defer foreign key constraints to reduce read amplification (PostgreSQL only)
        if session.bind and session.bind.dialect.name == "postgresql":
            session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

        # Name column for changelog
        name_cols = [c for c in diff.inserts.columns if c.startswith("no")]
        name_col = name_cols[0] if name_cols else None

        # Build composite PK for logging
        def get_pk_str(idx_val):
            if isinstance(idx_val, tuple):
                return "-".join(str(v) for v in idx_val)
            return str(idx_val)

        # Process INSERTS
        if not diff.inserts.empty:
            inserts_df = diff.inserts.reset_index()
            inserts_dict = inserts_df.to_dict(orient="records")
            inserts_dict = clean_nan(inserts_dict)
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
                    "dadosNovos": row
                })

        # Process UPDATES
        if not diff.updates.empty:
            updates_df = diff.updates.reset_index()
            updates_list = updates_df.to_dict(orient="records")
            updates_list = clean_nan(updates_list)
            
            # Injetar 'id' da surrogate PK caso exista no db
            if "id" in df_db.columns:
                id_series = df_db.loc[diff.updates.index, "id"]
                for j, id_val in enumerate(id_series):
                    updates_list[j]["id"] = int(id_val)

            batch_size = 500
            for i in range(0, len(updates_list), batch_size):
                chunk = updates_list[i:i + batch_size]
                session.bulk_update_mappings(model_class, chunk)

            # Para manter o histórico acessível, gravamos a linha completa antes e depois
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
                    "dadosNovos": ftp_row
                })

        # Process DELETES
        if not diff.deletes.empty:
            # We can't do simple in_ for composite keys easily, loop delete or fallback to no-op for composite
            # Let's do a simple soft delete loop for safety
            pk_names = diff.deletes.index.names
            if len(pk_names) == 1:
                pk_name = pk_names[0]
                keys = diff.deletes.index.tolist()
                col_attr = getattr(model_class, pk_name)
                session.query(model_class).filter(col_attr.in_(keys)).update({"deletadoEm": now, "deletadoNaCompetencia": competencia}, synchronize_session=False)
            else:
                logger.warning(f"Deleção de chave composta não automatizada para {table_name}")

            deletes_df = diff.deletes.reset_index()
            deletes_dict = deletes_df.to_dict(orient="records")
            deletes_dict = clean_nan(deletes_dict)
            for i, row in enumerate(deletes_dict):
                idx_val = diff.deletes.index[i]
                changelog_dicts.append({
                    "importacaoId": importacao_id,
                    "tabela": model_class.__tablename__,
                    "chaveRegistro": get_pk_str(idx_val),
                    "descricaoRegistro": row.get(name_col) if name_col else None,
                    "tipoOperacao": "DELETE",
                    "dadosAntigos": row,
                    "dadosNovos": None
                })

        if changelog_dicts:
            batch_size = 200
            for i in range(0, len(changelog_dicts), batch_size):
                chunk = changelog_dicts[i:i + batch_size]
                session.bulk_insert_mappings(SigtapChangelog, chunk)
        
        session.commit()

import logging
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

# Assegura a resolução de scripts.shared dinamicamente sem IndexError
for _parent in Path(__file__).resolve().parents:
    if (_parent / "scripts" / "shared").is_dir():
        for _p in [str(_parent), str(_parent / "scripts")]:
            if _p not in sys.path:
                sys.path.insert(0, _p)
        break
    elif (_parent / "shared").is_dir():
        _scripts_p = _parent if _parent.name == "scripts" else _parent / "scripts"
        _root_p = _parent.parent if _parent.name == "scripts" else _parent
        for _p in [str(_root_p), str(_scripts_p)]:
            if Path(_p).is_dir() and _p not in sys.path:
                sys.path.insert(0, _p)
        break

import pandas as pd
from sqlalchemy import insert, select, update, delete, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from scripts.shared.models.cpa import (
    Instituicao,
    Vinculo,
    Aditivo,
    PlanoOperativo,
    PlanoOperativoProcedimento,
    ComplementacaoTipo,
    ComplementacaoItem,
    PlanoOperativoComplementacao,
    CpaImportacao,
    CpaImportacaoChangelog,
)

# Tabelas SQLAlchemy mapeadas dos modelos centralizados
_instituicao = Instituicao.__table__
_vinculo = Vinculo.__table__
_aditivo = Aditivo.__table__
_plano_operativo = PlanoOperativo.__table__
_plano_operativo_procedimento = PlanoOperativoProcedimento.__table__
_complementacao_tipo = ComplementacaoTipo.__table__
_complementacao_item = ComplementacaoItem.__table__
_plano_operativo_complementacao = PlanoOperativoComplementacao.__table__
_cpa_importacao = CpaImportacao.__table__
_cpa_importacao_changelog = CpaImportacaoChangelog.__table__


def _now() -> datetime:
    return datetime.now(timezone.utc)

def _log_changelog(
    session: Session, 
    importacao_id: int, 
    tabela: str, 
    chave: str, 
    desc: str | None, 
    op: str, 
    old_data: dict[str, Any] | None, 
    new_data: dict[str, Any] | None
) -> None:
    # Helper to convert datetimes/decimals to string for JSON
    def serialize(data):
        if not data:
            return None
        out = {}
        for k, v in data.items():
            from datetime import date
            if isinstance(v, (datetime, date)):
                out[k] = v.isoformat()
            elif isinstance(v, Decimal):
                out[k] = float(v)
            else:
                out[k] = v
        return out

    session.execute(insert(_cpa_importacao_changelog).values(
        importacao_id=importacao_id,
        tabela=tabela,
        chave_registro=chave,
        descricao_registro=desc,
        tipo_operacao=op,
        dados_antigos=serialize(old_data),
        dados_novos=serialize(new_data),
        criado_em=_now()
    ))

# ── Public loaders ────────────────────────────────────────────────────────────

def reset_all_data(session: Session) -> None:
    """Deleta todos os registros sincronizados pelo script."""
    logger.warning("Executando exclusão física (DELETE) de TODAS as entidades relacionadas...")
    # Ordem reversa para respeitar Foreign Keys
    session.execute(delete(_cpa_importacao_changelog))
    session.execute(delete(_plano_operativo_complementacao))
    session.execute(delete(_plano_operativo_procedimento))
    session.execute(delete(_plano_operativo))
    session.execute(delete(_aditivo))
    session.execute(delete(_vinculo))
    session.execute(delete(_instituicao))
    session.execute(delete(_complementacao_item))
    session.execute(delete(_complementacao_tipo))
    session.execute(delete(_cpa_importacao))
    logger.warning("Todas as entidades CPA foram resetadas com sucesso.")

def start_importacao(session: Session, tabelas_afetadas: str) -> tuple[int, str]:
    # Find max version
    row = session.execute(
        select(_cpa_importacao.c.versao).order_by(_cpa_importacao.c.id.desc()).limit(1)
    ).fetchone()
    if row and row[0]:
        try:
            next_versao = str(int(row[0]) + 1)
        except ValueError:
            next_versao = "1"
    else:
        next_versao = "1"
        
    now = _now()
    result = session.execute(insert(_cpa_importacao).values(
        versao=next_versao,
        data_inicio=now,
        status="EM_ANDAMENTO",
        tabelas_afetadas=tabelas_afetadas,
        criado_em=now,
        atualizado_em=now
    ).returning(_cpa_importacao.c.id))
    importacao_id = result.scalar_one()
    return importacao_id, next_versao


def finish_importacao(session: Session, importacao_id: int, status: str) -> None:
    now = _now()
    session.execute(
        update(_cpa_importacao)
        .where(_cpa_importacao.c.id == importacao_id)
        .values(
            status=status,
            data_fim=now,
            atualizado_em=now
        )
    )

def load_instituicoes(session: Session, df: pd.DataFrame, importacao_id: int) -> dict[str, int]:
    if df.empty:
        logger.warning("[INSTITUICOES] DataFrame vazio — nada a carregar.")
        return {}

    records: list[dict[str, Any]] = df.to_dict(orient="records")
    cnes_list = [r["cnes"] for r in records]

    # Fetch ALL existing institutions (to support deletes)
    all_existing = session.execute(select(_instituicao)).mappings().fetchall()
    existing_map = {row["cnes"]: dict(row) for row in all_existing}
    
    inserts = []
    updates = []
    deletes = []
    
    now = _now()
    
    for rec in records:
        cnes = rec["cnes"]
        if cnes not in existing_map:
            rec["criado_em"] = now
            rec["atualizado_em"] = now
            inserts.append(rec)
            _log_changelog(session, importacao_id, "instituicao", cnes, rec["nome"], "INSERT", None, rec)
        else:
            old = existing_map[cnes]
            # Check for changes
            changed = False
            changes = {}
            if old["nome"] != rec["nome"]:
                changed = True
                changes["nome"] = rec["nome"]
            if old["tipo_instituicao"] != rec["tipo_instituicao"]:
                changed = True
                changes["tipo_instituicao"] = rec["tipo_instituicao"]
            if old["cnpj"] != rec["cnpj"]:
                changed = True
                changes["cnpj"] = rec["cnpj"]
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None
                
            if changed:
                changes["atualizado_em"] = now
                update_rec = {"cnes": cnes, **changes}
                updates.append(update_rec)
                
                new_full = {**old, **changes}
                _log_changelog(session, importacao_id, "instituicao", cnes, rec["nome"], "UPDATE", old, new_full)

    # Deletes: find what is in DB but not in spreadsheet, and is not already deleted
    for cnes, old in existing_map.items():
        if cnes not in cnes_list and old["deletado_em"] is None:
            deletes.append(cnes)
            _log_changelog(session, importacao_id, "instituicao", cnes, old["nome"], "DELETE", old, None)

    # Apply DB operations
    if inserts:
        session.execute(insert(_instituicao).values(inserts))
        logger.info("[INSTITUICOES] %d inseridos.", len(inserts))
        
    for u in updates:
        session.execute(update(_instituicao).where(_instituicao.c.cnes == u["cnes"]).values(**u))
    if updates:
        logger.info("[INSTITUICOES] %d atualizados.", len(updates))
        
    if deletes:
        session.execute(update(_instituicao).where(_instituicao.c.cnes.in_(deletes)).values(deletado_em=now, atualizado_em=now))
        logger.info("[INSTITUICOES] %d excluídos (logicamente).", len(deletes))

    # Refresh map
    all_rows = session.execute(select(_instituicao.c.id, _instituicao.c.cnes)).fetchall()
    return {row.cnes: row.id for row in all_rows}


def load_vinculos(session: Session, df: pd.DataFrame, cnes_id_map: dict[str, int], importacao_id: int) -> None:
    if df.empty:
        logger.warning("[VINCULOS] DataFrame vazio — nada a carregar.")
        return

    resolved: list[dict[str, Any]] = []
    skipped_fk = 0

    for record in df.to_dict(orient="records"):
        cnes: str = record.pop("cnes")
        instituicao_id = cnes_id_map.get(cnes)
        if instituicao_id is None:
            logger.warning("[VINCULOS] CNES '%s' não encontrado — vínculo '%s' ignorado.", cnes, record.get("numero"))
            skipped_fk += 1
            continue

        record["instituicao_id"] = instituicao_id
        record["valor_total"] = Decimal(str(record["valor_total"]))
        resolved.append(record)

    if not resolved:
        return

    sheet_numeros = [r["numero"] for r in resolved]
    
    all_existing = session.execute(select(_vinculo)).mappings().fetchall()
    existing_map = {row["numero"]: dict(row) for row in all_existing}

    inserts = []
    updates = []
    deletes = []
    now = _now()

    for rec in resolved:
        numero = rec["numero"]
        if numero not in existing_map:
            rec["criado_em"] = now
            rec["atualizado_em"] = now
            inserts.append(rec)
            _log_changelog(session, importacao_id, "vinculo", numero, rec.get("objeto"), "INSERT", None, rec)
        else:
            old = existing_map[numero]
            changed = False
            changes = {}
            
            # Compare fields
            fields_to_compare = ["instituicao_id", "numero_processo_sei", "tipo_vinculo", "objeto", "complexidade", "valor_total", "data_da_assinatura", "data_inicio", "data_fim"]
            for f in fields_to_compare:
                old_val = old[f]
                new_val = rec[f]
                
                # Normalize types for comparison
                if f == "complexidade":
                    # ensure both are lists
                    old_list = old_val if old_val else []
                    new_list = new_val if new_val else []
                    if set(old_list) != set(new_list):
                        changed = True
                        changes[f] = new_list
                elif f == "valor_total":
                    if float(old_val) != float(new_val):
                        changed = True
                        changes[f] = new_val
                elif f in ["data_da_assinatura", "data_inicio", "data_fim"]:
                    # pandas timestamps vs python datetimes (with tz)
                    # we must compare them properly.
                    if old_val != new_val: # This might need timezone handling, let's keep it simple and see if they differ
                        changed = True
                        changes[f] = new_val
                else:
                    if old_val != new_val:
                        changed = True
                        changes[f] = new_val
                        
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None
                
            if changed:
                changes["atualizado_em"] = now
                update_rec = {"numero": numero, **changes}
                updates.append(update_rec)
                new_full = {**old, **changes}
                _log_changelog(session, importacao_id, "vinculo", numero, rec.get("objeto"), "UPDATE", old, new_full)

    for numero, old in existing_map.items():
        if numero not in sheet_numeros and old["deletado_em"] is None:
            deletes.append(numero)
            _log_changelog(session, importacao_id, "vinculo", numero, old.get("objeto"), "DELETE", old, None)

    # Execute DB ops
    if inserts:
        session.execute(insert(_vinculo).values(inserts))
        logger.info("[VINCULOS] %d inseridos.", len(inserts))
        
    for u in updates:
        session.execute(update(_vinculo).where(_vinculo.c.numero == u["numero"]).values(**u))
    if updates:
        logger.info("[VINCULOS] %d atualizados.", len(updates))
        
    if deletes:
        session.execute(update(_vinculo).where(_vinculo.c.numero.in_(deletes)).values(deletado_em=now, atualizado_em=now))
        logger.info("[VINCULOS] %d excluídos (logicamente).", len(deletes))

    if skipped_fk:
        logger.warning("[VINCULOS] %d ignorados por CNES inválido.", skipped_fk)


def load_complementacoes_tipos(session: Session, df: pd.DataFrame, importacao_id: int) -> dict[str, int]:
    if df.empty:
        logger.warning("[COMPLEMENTACOES TIPOS] DataFrame vazio.")
        return {}

    records = df.to_dict(orient="records")
    sheet_nomes = [r["nome"].strip().upper() for r in records]

    all_existing = session.execute(select(_complementacao_tipo)).mappings().fetchall()
    existing_map = {row["nome"].strip().upper(): dict(row) for row in all_existing}

    inserts = []
    updates = []
    deletes = []
    now = _now()

    for rec in records:
        nome_key = rec["nome"].strip().upper()
        if nome_key not in existing_map:
            rec["criado_em"] = now
            rec["atualizado_em"] = now
            inserts.append(rec)
            _log_changelog(session, importacao_id, "complementacao_tipo", nome_key, None, "INSERT", None, rec)
        else:
            old = existing_map[nome_key]
            changed = False
            changes = {}
            if old["descricao"] != rec["descricao"]:
                changed = True
                changes["descricao"] = rec["descricao"]
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None

            if changed:
                changes["atualizado_em"] = now
                update_rec = {"id": old["id"], **changes}
                updates.append(update_rec)
                _log_changelog(session, importacao_id, "complementacao_tipo", nome_key, None, "UPDATE", old, {**old, **changes})

    for nome_key, old in existing_map.items():
        if nome_key not in sheet_nomes and old["deletado_em"] is None:
            deletes.append(old["id"])
            _log_changelog(session, importacao_id, "complementacao_tipo", nome_key, None, "DELETE", old, None)

    if inserts:
        session.execute(insert(_complementacao_tipo).values(inserts))
    for u in updates:
        session.execute(update(_complementacao_tipo).where(_complementacao_tipo.c.id == u["id"]).values(**u))
    if deletes:
        session.execute(update(_complementacao_tipo).where(_complementacao_tipo.c.id.in_(deletes)).values(deletado_em=now, atualizado_em=now))

    all_rows = session.execute(select(_complementacao_tipo.c.id, _complementacao_tipo.c.nome)).fetchall()
    return {row.nome.strip().upper(): row.id for row in all_rows}


def load_complementacoes_itens(session: Session, df: pd.DataFrame, tipo_map: dict[str, int], importacao_id: int) -> dict[str, int]:
    if df.empty:
        logger.warning("[COMPLEMENTACOES ITENS] DataFrame vazio.")
        return {}

    resolved = []
    skipped_fk = 0
    for record in df.to_dict(orient="records"):
        tipo_nome = record.pop("complementacao_tipo_nome").strip().upper()
        tipo_id = tipo_map.get(tipo_nome)
        if tipo_id is None:
            logger.warning("[COMPLEMENTACOES ITENS] Tipo '%s' não encontrado.", tipo_nome)
            skipped_fk += 1
            continue
        record["complementacao_tipo_id"] = tipo_id
        record["valor_unitario"] = Decimal(str(record["valor_unitario"]))
        resolved.append(record)

    if not resolved:
        return {}

    sheet_desc = [r["descricao"].strip().upper() for r in resolved]
    all_existing = session.execute(select(_complementacao_item)).mappings().fetchall()
    existing_map = {row["descricao"].strip().upper(): dict(row) for row in all_existing}

    inserts = []
    updates = []
    deletes = []
    now = _now()

    for rec in resolved:
        desc_key = rec["descricao"].strip().upper()
        if desc_key not in existing_map:
            rec["criado_em"] = now
            rec["atualizado_em"] = now
            inserts.append(rec)
            _log_changelog(session, importacao_id, "complementacao_item", desc_key, None, "INSERT", None, rec)
        else:
            old = existing_map[desc_key]
            changed = False
            changes = {}
            if old["complementacao_tipo_id"] != rec["complementacao_tipo_id"]:
                changed = True
                changes["complementacao_tipo_id"] = rec["complementacao_tipo_id"]
            if float(old["valor_unitario"]) != float(rec["valor_unitario"]):
                changed = True
                changes["valor_unitario"] = rec["valor_unitario"]
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None

            if changed:
                changes["atualizado_em"] = now
                update_rec = {"id": old["id"], **changes}
                updates.append(update_rec)
                _log_changelog(session, importacao_id, "complementacao_item", desc_key, None, "UPDATE", old, {**old, **changes})

    for desc_key, old in existing_map.items():
        if desc_key not in sheet_desc and old["deletado_em"] is None:
            deletes.append(old["id"])
            _log_changelog(session, importacao_id, "complementacao_item", desc_key, None, "DELETE", old, None)

    if inserts:
        session.execute(insert(_complementacao_item).values(inserts))
    for u in updates:
        session.execute(update(_complementacao_item).where(_complementacao_item.c.id == u["id"]).values(**u))
    if deletes:
        session.execute(update(_complementacao_item).where(_complementacao_item.c.id.in_(deletes)).values(deletado_em=now, atualizado_em=now))

    all_rows = session.execute(select(_complementacao_item.c.id, _complementacao_item.c.descricao)).fetchall()
    return {row.descricao.strip().upper(): row.id for row in all_rows}


def _build_plano_key(numero_vinculo: str, numero_aditivo: object) -> str:
    aditivo_str = "" if pd.isna(numero_aditivo) else str(numero_aditivo).strip()
    if aditivo_str and aditivo_str.lower() != "nan":
        return f"{numero_vinculo}::{aditivo_str}"
    return numero_vinculo


def load_planos_operativos(
    session: Session, 
    df: pd.DataFrame, 
    vinculo_map: dict[str, int], 
    aditivo_map: dict[tuple[int, str], int], 
    importacao_id: int
) -> dict[str, int]:
    if df.empty:
        logger.warning("[PLANOS OPERATIVOS] DataFrame vazio.")
        return {}
        
    resolved = {}
    skipped_fk = 0
    now = _now()
    
    for _, row in df.iterrows():
        numero_vinculo = str(row["numero_vinculo"]).strip()
        numero_aditivo = row.get("numero_aditivo")
        
        vinculo_id = vinculo_map.get(numero_vinculo)
        if not vinculo_id:
            skipped_fk += 1
            continue
            
        aditivo_id = None
        aditivo_str = "" if pd.isna(numero_aditivo) else str(numero_aditivo).strip()
        if aditivo_str and aditivo_str.lower() != "nan":
            aditivo_id = aditivo_map.get((vinculo_id, aditivo_str))
            
        plano_key = _build_plano_key(numero_vinculo, aditivo_str)
        if plano_key not in resolved:
            resolved[plano_key] = {
                "vinculo_id": vinculo_id,
                "aditivo_id": aditivo_id,
            }

    if skipped_fk:
        logger.warning("[PLANOS OPERATIVOS] %d linhas ignoradas por vínculo não encontrado.", skipped_fk)
        
    if not resolved:
        return {}

    all_existing = session.execute(select(_plano_operativo)).mappings().fetchall()
    
    inv_vinculo_map = {v: k for k, v in vinculo_map.items()}
    inv_aditivo_map = {v: k[1] for k, v in aditivo_map.items()}
    
    existing_map = {}
    for row in all_existing:
        v_num = inv_vinculo_map.get(row["vinculo_id"])
        if not v_num:
            continue
        a_num = inv_aditivo_map.get(row["aditivo_id"]) if row["aditivo_id"] else None
        key = _build_plano_key(v_num, a_num)
        existing_map[key] = dict(row)

    inserts = []
    updates = []
    deletes = []

    for key, rec in resolved.items():
        if key not in existing_map:
            rec["criado_em"] = now
            rec["atualizado_em"] = now
            rec["vigente"] = True
            inserts.append(rec)
            _log_changelog(session, importacao_id, "plano_operativo", key, None, "INSERT", None, rec)
        else:
            old = existing_map[key]
            changed = False
            changes = {}
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None
                
            if changed:
                changes["atualizado_em"] = now
                update_rec = {"id": old["id"], **changes}
                updates.append(update_rec)
                _log_changelog(session, importacao_id, "plano_operativo", key, None, "UPDATE", old, {**old, **changes})

    for key, old in existing_map.items():
        if key not in resolved and old["deletado_em"] is None:
            deletes.append(old["id"])
            _log_changelog(session, importacao_id, "plano_operativo", key, None, "DELETE", old, None)

    if inserts:
        session.execute(insert(_plano_operativo).values(inserts))
    for u in updates:
        session.execute(update(_plano_operativo).where(_plano_operativo.c.id == u["id"]).values(**u))
    if deletes:
        session.execute(update(_plano_operativo).where(_plano_operativo.c.id.in_(deletes)).values(deletado_em=now, atualizado_em=now))

    all_rows = session.execute(select(_plano_operativo)).mappings().fetchall()
    plano_key_map = {}
    for row in all_rows:
        v_num = inv_vinculo_map.get(row["vinculo_id"])
        if not v_num:
            continue
        a_num = inv_aditivo_map.get(row["aditivo_id"]) if row["aditivo_id"] else None
        key = _build_plano_key(v_num, a_num)
        plano_key_map[key] = row["id"]
        
    return plano_key_map


def load_plano_operativo_procedimentos(
    session: Session, 
    df: pd.DataFrame, 
    plano_key_map: dict[str, int], 
    importacao_id: int
) -> dict[str, int]:
    if df.empty:
        return {"inseridos": 0, "skipped_vinculo": 0, "skipped_sigtap": 0, "duplicates": 0}
        
    now = _now()
    plano_ids = set()
    inserts = []
    all_codes = {str(row["co_procedimento"]).strip().zfill(10) for _, row in df.iterrows()}
    
    existing_codes = set()
    if all_codes:
        query = text(
            "SELECT co_procedimento "
            "FROM sigtap_tb_procedimento "
            "WHERE co_procedimento = ANY(:codes)"
        )
        existing_codes_rows = session.execute(query, {"codes": list(all_codes)}).mappings().fetchall()
        existing_codes = {row["co_procedimento"] for row in existing_codes_rows}
        
    unknown_codes = all_codes - existing_codes
    for code in sorted(unknown_codes):
        logger.warning("[PLANO_PROCEDIMENTO] co_procedimento '%s' não existe em sigtap_tb_procedimento — ignorado.", code)
        
    skipped_vinculo = 0
    skipped_sigtap = 0

    for _, row in df.iterrows():
        key = _build_plano_key(row["numero_vinculo"], row.get("numero_aditivo"))
        plano_id = plano_key_map.get(key)
        if not plano_id:
            skipped_vinculo += 1
            continue
            
        plano_ids.add(plano_id)
        co_proc = str(row["co_procedimento"]).strip().zfill(10)
        
        if co_proc not in existing_codes:
            skipped_sigtap += 1
            continue
            
        inserts.append({
            "plano_operativo_id": plano_id,
            "co_procedimento": co_proc,
            "quantidade_pactuada_mensal": int(row["quantidade_pactuada_mensal"]),
            "criado_em": now,
            "atualizado_em": now,
        })
        
    if not plano_ids:
        return {"inseridos": 0, "skipped_vinculo": skipped_vinculo, "skipped_sigtap": skipped_sigtap}
        
    session.execute(
        update(_plano_operativo_procedimento)
        .where(_plano_operativo_procedimento.c.plano_operativo_id.in_(plano_ids))
        .where(_plano_operativo_procedimento.c.deletado_em.is_(None))
        .values(deletado_em=now, atualizado_em=now)
    )
    
    if inserts:
        stmt = insert(_plano_operativo_procedimento).values(inserts)
        session.execute(stmt)
        logger.info("[PLANO_PROCEDIMENTO] %d procedimentos inseridos.", len(inserts))

    return {
        "inseridos": len(inserts),
        "skipped_vinculo": skipped_vinculo,
        "skipped_sigtap": skipped_sigtap
    }


def load_plano_operativo_complementacoes(
    session: Session, 
    df: pd.DataFrame, 
    plano_key_map: dict[str, int], 
    item_map: dict[str, int],
    importacao_id: int
) -> None:
    if df.empty:
        return
        
    now = _now()
    plano_ids = set()
    inserts_dict = {}
    skipped_item = 0
    
    for _, row in df.iterrows():
        key = _build_plano_key(row["numero_vinculo"], row.get("numero_aditivo"))
        plano_id = plano_key_map.get(key)
        if not plano_id:
            continue
            
        item_desc = str(row["complementacao_item_descricao"]).strip().upper()
        item_id = item_map.get(item_desc)
        if not item_id:
            skipped_item += 1
            continue
            
        plano_ids.add(plano_id)
        inserts_dict[(plano_id, item_id)] = {
            "plano_operativo_id": plano_id,
            "complementacao_item_id": item_id,
            "quantidade_pactuada_mensal": int(row["quantidade_pactuada_mensal"]),
            "criado_em": now,
            "atualizado_em": now,
        }
        
    if skipped_item:
        logger.warning("[PLANO_COMPLEMENTACAO] %d itens ignorados por não encontrados.", skipped_item)
        
    if not plano_ids:
        return
        
    session.execute(
        update(_plano_operativo_complementacao)
        .where(_plano_operativo_complementacao.c.plano_operativo_id.in_(plano_ids))
        .where(_plano_operativo_complementacao.c.deletado_em.is_(None))
        .values(deletado_em=now, atualizado_em=now)
    )
    
    inserts = list(inserts_dict.values())
    if inserts:
        stmt = pg_insert(_plano_operativo_complementacao).values(inserts)
        stmt = stmt.on_conflict_do_update(
            index_elements=['plano_operativo_id', 'complementacao_item_id'],
            set_={
                'quantidade_pactuada_mensal': stmt.excluded.quantidade_pactuada_mensal,
                'deletado_em': None,
                'atualizado_em': now
            }
        )
        session.execute(stmt)
        logger.info("[PLANO_COMPLEMENTACAO] %d complementacoes inseridas/atualizadas.", len(inserts))


def parse_tipos_aditivo(valor_bruto: object) -> list[str]:
    """Transforma 'ACRÉSCIMO, PRAZO' em ['ACRESCIMO', 'PRAZO'] para o array SQLAlchemy."""
    if pd.isna(valor_bruto) or not valor_bruto or str(valor_bruto).lower() == 'nan':
        return []
        
    normalizacoes = {
        "ACRÉSCIMO": "ACRÉSCIMO",
        "ACRESCIMO": "ACRÉSCIMO",
        "PRAZO": "PRAZO",
        "SUPRESSÃO": "SUPRESSÃO",
        "SUPRESSAO": "SUPRESSÃO",
        "VALOR": "VALOR",
    }
    
    tipos = []
    partes = str(valor_bruto).split(",")
    for p in partes:
        p_clean = p.strip().upper()
        norm = normalizacoes.get(p_clean)
        if norm:
            tipos.append(norm)
    return tipos

def parse_valor_monetario(valor_bruto: object) -> Decimal | None:
    """Converte R$ 1.234,56 em Decimal('1234.56'). Retorna None em caso de falha."""
    if pd.isna(valor_bruto) or not valor_bruto:
        return None
    try:
        limpo = str(valor_bruto).replace("R$", "").replace(".", "").replace(",", ".").strip()
        if not limpo:
            return None
        return Decimal(limpo)
    except ValueError:
        return None

def load_aditivos(session: Session, df: pd.DataFrame, vinculo_cnes_cache: dict[tuple[str, str], int], importacao_id: int) -> None:
    if df.empty:
        logger.warning("[ADITIVOS] DataFrame vazio.")
        return
        
    inserts = []
    updates = []
    skipped_fk = 0
    now = _now()
    
    all_existing = session.execute(select(_aditivo)).mappings().fetchall()
    existing_map = {(row["vinculo_id"], str(row["numero"]).strip()): dict(row) for row in all_existing}
    
    for _, row in df.iterrows():
        cnes = str(row.get("cnes", "")).strip()
        num_vinculo = str(row.get("numero_vinculo", "")).strip()
        
        vinculo_id = vinculo_cnes_cache.get((cnes, num_vinculo))
        if not vinculo_id:
            skipped_fk += 1
            continue
            
        num_aditivo = str(row.get("numero", "")).strip()
        if not num_aditivo:
            continue
            
        chave_aditivo = (vinculo_id, num_aditivo)
        
        payload = {
            "vinculo_id": vinculo_id,
            "numero": num_aditivo,
            "numero_processo_sei": str(row.get("numero_processo_sei", "")).strip(),
            "tipo_aditivo": parse_tipos_aditivo(row.get("tipo_aditivo")),
            "data_da_assinatura": pd.to_datetime(row.get("data_da_assinatura"), dayfirst=True).to_pydatetime() if not pd.isna(row.get("data_da_assinatura")) else None,
            "data_inicio": pd.to_datetime(row.get("data_inicio"), dayfirst=True).to_pydatetime() if not pd.isna(row.get("data_inicio")) else None,
            "data_fim": pd.to_datetime(row.get("data_fim"), dayfirst=True).to_pydatetime() if not pd.isna(row.get("data_fim")) else None,
            "valor_total": parse_valor_monetario(row.get("valor_total")),
        }
        
        if chave_aditivo not in existing_map:
            payload["criado_em"] = now
            payload["atualizado_em"] = now
            inserts.append(payload)
            _log_changelog(session, importacao_id, "aditivo", f"{num_vinculo}::{num_aditivo}", None, "INSERT", None, payload)
        else:
            old = existing_map[chave_aditivo]
            changed = False
            changes = {}
            
            fields_to_compare = ["numero_processo_sei", "tipo_aditivo", "data_da_assinatura", "data_inicio", "data_fim", "valor_total"]
            for f in fields_to_compare:
                old_val = old[f]
                new_val = payload[f]
                
                if f == "tipo_aditivo":
                    old_list = old_val if old_val else []
                    new_list = new_val if new_val else []
                    if set(old_list) != set(new_list):
                        changed = True
                        changes[f] = new_list
                elif f == "valor_total":
                    if old_val is None and new_val is not None:
                        changed = True
                        changes[f] = new_val
                    elif old_val is not None and new_val is None:
                        changed = True
                        changes[f] = new_val
                    elif old_val is not None and new_val is not None and float(old_val) != float(new_val):
                        changed = True
                        changes[f] = new_val
                elif f in ("data_da_assinatura", "data_inicio", "data_fim"):
                    # datetime comparison
                    o_date = old_val.date() if isinstance(old_val, datetime) else old_val
                    n_date = new_val.date() if isinstance(new_val, datetime) else new_val
                    if o_date != n_date:
                        changed = True
                        changes[f] = new_val
                else:
                    if old_val != new_val:
                        changed = True
                        changes[f] = new_val
                        
            if old["deletado_em"] is not None:
                changed = True
                changes["deletado_em"] = None
                
            if changed:
                changes["atualizado_em"] = now
                update_rec = {"id": old["id"], **changes}
                updates.append(update_rec)
                _log_changelog(session, importacao_id, "aditivo", f"{num_vinculo}::{num_aditivo}", None, "UPDATE", old, {**old, **changes})

    if skipped_fk:
        logger.warning("[ADITIVOS] %d ignorados por Vínculo não encontrado.", skipped_fk)
        
    if inserts:
        session.execute(insert(_aditivo).values(inserts))
        logger.info("[ADITIVOS] %d inseridos.", len(inserts))
    for u in updates:
        session.execute(update(_aditivo).where(_aditivo.c.id == u["id"]).values(**u))
    if updates:
        logger.info("[ADITIVOS] %d atualizados.", len(updates))

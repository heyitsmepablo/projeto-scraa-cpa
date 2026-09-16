"""Mapeamento e filtragem cirúrgica vetorial de DataFrames do DATASUS (SIH/SIA)."""

import logging
from typing import Any, Dict, List, Optional, Set
import pandas as pd

from scripts.shared.sanitizers import (
    normalize_cnes,
    normalize_sigtap_code,
    parse_currency_to_decimal as safe_decimal,
    safe_int_str,
    safe_str,
)

logger = logging.getLogger(__name__)


def map_sih_rd_row(row: pd.Series, cnes_ativos: Set[str]) -> Optional[Dict[str, Any]]:
    """Mapeia uma linha individual do DataFrame SIH_RD para dicionário."""
    cnes = normalize_cnes(row.get("CNES"))
    if not cnes or cnes not in cnes_ativos:
        return None

    proc = normalize_sigtap_code(row.get("PROC_REA")) or safe_str(row.get("PROC_REA"))

    return {
        "anoCmpt": safe_str(row.get("ANO_CMPT")),
        "mesCmpt": safe_str(row.get("MES_CMPT")),
        "diInter": safe_str(row.get("DI_INTER")),
        "procRea": proc,
        "cnes": cnes,
        "valTot": safe_decimal(row.get("VAL_TOT")),
        "qtDiarias": safe_decimal(row.get("QT_DIARIAS")),
        "ufZi": safe_str(row.get("UF_ZI")),
        "financ": safe_str(row.get("FINANC")),
        "complex": safe_str(row.get("COMPLEX")),
        "procSolic": safe_str(row.get("PROC_SOLIC")),
        "diagPrinc": safe_str(row.get("DIAG_PRINC")),
    }


def map_sia_pa_row(row: pd.Series, cnes_ativos: Set[str]) -> Optional[Dict[str, Any]]:
    """Mapeia uma linha individual do DataFrame SIA_PA para dicionário."""
    cnes = normalize_cnes(row.get("PA_CODUNI"))
    if not cnes or cnes not in cnes_ativos:
        return None

    proc = normalize_sigtap_code(row.get("PA_PROC_ID")) or safe_str(row.get("PA_PROC_ID"))

    return {
        "paMvm": safe_str(row.get("PA_MVM")),
        "paCmp": safe_str(row.get("PA_CMP")),
        "paProcId": proc,
        "paCoduni": cnes,
        "paValpro": safe_decimal(row.get("PA_VALPRO")),
        "paValapr": safe_decimal(row.get("PA_VALAPR")),
        "paQtdpro": safe_decimal(row.get("PA_QTDPRO")),
        "paQtdapr": safe_decimal(row.get("PA_QTDAPR")),
        "paGestao": safe_str(row.get("PA_GESTAO")),
        "paTpfin": safe_str(row.get("PA_TPFIN")),
        "paNivcpl": safe_str(row.get("PA_NIVCPL")),
        "paSubfin": safe_str(row.get("PA_SUBFIN")),
        "paCnpjCpf": safe_str(row.get("PA_CNPJCPF")),
    }


def filter_and_map_sih_df(
    df: pd.DataFrame,
    cnes_ativos: Set[str],
    mapa_pactos: Optional[Dict[str, Set[str]]] = None,
    todos_procedimentos_pactuados: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """Filtra cirurgicamente e converte o DataFrame SIH_RD para dicionários de inserção.
    
    Aplica pré-filtro vetorial em memória:
    1. Filtro rápido por CNES ativo.
    2. Se mapa_pactos estiver configurado, filtra cirurgicamente pelo par (CNES, PROC_REA).
    """
    if df.empty or not cnes_ativos or "CNES" not in df.columns:
        return []

    # 1. Normalização vetorial do CNES
    df_work = df.copy()
    cnes_norm_series = normalize_cnes(df_work["CNES"])
    df_work["cnes_norm"] = cnes_norm_series

    # Filtro vetorial rápido por CNES
    mask_cnes = df_work["cnes_norm"].isin(cnes_ativos)
    df_filtered = df_work[mask_cnes]

    if df_filtered.empty:
        return []

    # 2. Extração cirúrgica por procedimentos pactuados
    if mapa_pactos is not None and "PROC_REA" in df_filtered.columns:
        proc_norm_series = normalize_sigtap_code(df_filtered["PROC_REA"])
        df_filtered = df_filtered.assign(proc_norm=proc_norm_series)

        if todos_procedimentos_pactuados is not None:
            mask_proc = df_filtered["proc_norm"].isin(todos_procedimentos_pactuados)
            df_filtered = df_filtered[mask_proc]

        # Validação estrita do par (CNES, Procedimento)
        if not df_filtered.empty:
            pares_validos = {
                (c, p) for c, procs in mapa_pactos.items() for p in procs
            }
            # Se existirem procedimentos cadastrados no pacto, filtra apenas os pares contratados
            if pares_validos:
                mask_pares = [
                    (c, p) in pares_validos
                    for c, p in zip(df_filtered["cnes_norm"], df_filtered["proc_norm"])
                ]
                df_filtered = df_filtered[mask_pares]

    if df_filtered.empty:
        return []

    # 3. Mapeamento final dos registros retidos via itertuples (alta performance)
    mapped = []
    for row in df_filtered.itertuples(index=False):
        d = row._asdict()
        cnes = d.get("cnes_norm")
        proc = d.get("proc_norm") or normalize_sigtap_code(d.get("PROC_REA")) or safe_str(d.get("PROC_REA"))
        mapped.append({
            "anoCmpt": safe_str(d.get("ANO_CMPT")),
            "mesCmpt": safe_str(d.get("MES_CMPT")),
            "diInter": safe_str(d.get("DI_INTER")),
            "procRea": proc,
            "cnes": cnes,
            "valTot": safe_decimal(d.get("VAL_TOT")),
            "qtDiarias": safe_decimal(d.get("QT_DIARIAS")),
            "ufZi": safe_str(d.get("UF_ZI")),
            "financ": safe_str(d.get("FINANC")),
            "complex": safe_str(d.get("COMPLEX")),
            "procSolic": safe_str(d.get("PROC_SOLIC")),
            "diagPrinc": safe_str(d.get("DIAG_PRINC")),
        })

    return mapped


def filter_and_map_sia_df(
    df: pd.DataFrame,
    cnes_ativos: Set[str],
    mapa_pactos: Optional[Dict[str, Set[str]]] = None,
    todos_procedimentos_pactuados: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """Filtra cirurgicamente e converte o DataFrame SIA_PA para dicionários de inserção.
    
    Aplica pré-filtro vetorial em memória:
    1. Filtro rápido por CNES ativo.
    2. Se mapa_pactos estiver configurado, filtra cirurgicamente pelo par (PA_CODUNI, PA_PROC_ID).
    """
    if df.empty or not cnes_ativos or "PA_CODUNI" not in df.columns:
        return []

    # 1. Normalização vetorial do CNES
    df_work = df.copy()
    cnes_norm_series = normalize_cnes(df_work["PA_CODUNI"])
    df_work["cnes_norm"] = cnes_norm_series

    # Filtro vetorial rápido por CNES
    mask_cnes = df_work["cnes_norm"].isin(cnes_ativos)
    df_filtered = df_work[mask_cnes]

    if df_filtered.empty:
        return []

    # 2. Extração cirúrgica por procedimentos pactuados
    if mapa_pactos is not None and "PA_PROC_ID" in df_filtered.columns:
        proc_norm_series = normalize_sigtap_code(df_filtered["PA_PROC_ID"])
        df_filtered = df_filtered.assign(proc_norm=proc_norm_series)

        if todos_procedimentos_pactuados is not None:
            mask_proc = df_filtered["proc_norm"].isin(todos_procedimentos_pactuados)
            df_filtered = df_filtered[mask_proc]

        # Validação estrita do par (CNES, Procedimento)
        if not df_filtered.empty:
            pares_validos = {
                (c, p) for c, procs in mapa_pactos.items() for p in procs
            }
            if pares_validos:
                mask_pares = [
                    (c, p) in pares_validos
                    for c, p in zip(df_filtered["cnes_norm"], df_filtered["proc_norm"])
                ]
                df_filtered = df_filtered[mask_pares]

    if df_filtered.empty:
        return []

    # 3. Mapeamento final dos registros retidos via itertuples (alta performance)
    mapped = []
    for row in df_filtered.itertuples(index=False):
        d = row._asdict()
        cnes = d.get("cnes_norm")
        proc = d.get("proc_norm") or normalize_sigtap_code(d.get("PA_PROC_ID")) or safe_str(d.get("PA_PROC_ID"))
        mapped.append({
            "paMvm": safe_str(d.get("PA_MVM")),
            "paCmp": safe_str(d.get("PA_CMP")),
            "paProcId": proc,
            "paCoduni": cnes,
            "paValpro": safe_decimal(d.get("PA_VALPRO")),
            "paValapr": safe_decimal(d.get("PA_VALAPR")),
            "paQtdpro": safe_decimal(d.get("PA_QTDPRO")),
            "paQtdapr": safe_decimal(d.get("PA_QTDAPR")),
            "paGestao": safe_str(d.get("PA_GESTAO")),
            "paTpfin": safe_str(d.get("PA_TPFIN")),
            "paNivcpl": safe_str(d.get("PA_NIVCPL")),
            "paSubfin": safe_str(d.get("PA_SUBFIN")),
            "paCnpjCpf": safe_str(d.get("PA_CNPJCPF")),
        })

    return mapped

import pandas as pd
from typing import Optional, List, Dict, Any, Set
from decimal import Decimal, InvalidOperation

def safe_decimal(val: Any) -> Optional[Decimal]:
    """Converte valores com segurança para Decimal, tratando nulos do pandas."""
    if pd.isna(val) or val is None or val == "":
        return None
    try:
        if isinstance(val, float):
            # Formata para evitar problemas de precisão flutuante como 1234.5000000000001
            return Decimal(f"{val:.2f}")
        return Decimal(str(val).strip())
    except (InvalidOperation, TypeError, ValueError):
        return None

def safe_str(val: Any) -> Optional[str]:
    """Converte para string com strip, tratando nulos."""
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    return s if s else None

def safe_int_str(val: Any) -> Optional[str]:
    """Converte floats que representam ints para string (ex: 7.0 -> '7')."""
    if pd.isna(val) or val is None:
        return None
    try:
        # Se for float, converte pra int pra remover o .0
        if isinstance(val, float):
            return str(int(val))
        return str(val).strip()
    except (ValueError, TypeError):
        return str(val).strip()

def normalize_cnes(val: Any) -> Optional[str]:
    """Normaliza CNES para string de 7 dígitos com zero-padding."""
    raw = safe_int_str(val)
    if not raw:
        return None
    return raw.zfill(7)

def map_sih_rd_row(row: pd.Series, cnes_ativos: Set[str]) -> Optional[Dict[str, Any]]:
    """Mapeia uma linha do DataFrame SIH_RD para dicionário."""
    cnes = normalize_cnes(row.get("CNES"))
    if not cnes or cnes not in cnes_ativos:
        return None

    return {
        "anoCmpt": safe_str(row.get("ANO_CMPT")),
        "mesCmpt": safe_str(row.get("MES_CMPT")),
        "diInter": safe_str(row.get("DI_INTER")),
        "procRea": safe_int_str(row.get("PROC_REA")),
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
    """Mapeia uma linha do DataFrame SIA_PA para dicionário."""
    cnes = normalize_cnes(row.get("PA_CODUNI"))
    if not cnes or cnes not in cnes_ativos:
        return None

    return {
        "paMvm": safe_str(row.get("PA_MVM")),
        "paCmp": safe_str(row.get("PA_CMP")),
        "paProcId": safe_int_str(row.get("PA_PROC_ID")),
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

def filter_and_map_sih_df(df: pd.DataFrame, cnes_ativos: Set[str]) -> List[Dict[str, Any]]:
    """Filtra e converte o DataFrame inteiro do SIH."""
    if df.empty or not cnes_ativos:
        return []
        
    mapped = []
    # Otimização: primeiro filtrar pelo pandas (mais rápido)
    # Precisamos ter certeza que o CNES no pandas tá tratado (pode vir como float, string...)
    if "CNES" not in df.columns:
        return []
        
    # Converter CNES para string sem .0 se for float
    # Isso pode ser lento se a base for enorme, iterrows com verificação é ok.
    # Pra bases do DATASUS (centenas de milhares de linhas por mês), 
    # to_dict('records') e processar é mais rápido que iterrows.
    
    for row in df.to_dict('records'):
        # row is a dict now
        cnes = normalize_cnes(row.get("CNES"))
        if cnes and cnes in cnes_ativos:
            mapped_row = {
                "anoCmpt": safe_str(row.get("ANO_CMPT")),
                "mesCmpt": safe_str(row.get("MES_CMPT")),
                "diInter": safe_str(row.get("DI_INTER")),
                "procRea": safe_int_str(row.get("PROC_REA")),
                "cnes": cnes,
                "valTot": safe_decimal(row.get("VAL_TOT")),
                "qtDiarias": safe_decimal(row.get("QT_DIARIAS")),
                "ufZi": safe_str(row.get("UF_ZI")),
                "financ": safe_str(row.get("FINANC")),
                "complex": safe_str(row.get("COMPLEX")),
                "procSolic": safe_str(row.get("PROC_SOLIC")),
                "diagPrinc": safe_str(row.get("DIAG_PRINC")),
            }
            mapped.append(mapped_row)
            
    return mapped

def filter_and_map_sia_df(df: pd.DataFrame, cnes_ativos: Set[str]) -> List[Dict[str, Any]]:
    """Filtra e converte o DataFrame inteiro do SIA."""
    if df.empty or not cnes_ativos:
        return []
        
    mapped = []
    if "PA_CODUNI" not in df.columns:
        return []
        
    for row in df.to_dict('records'):
        cnes = normalize_cnes(row.get("PA_CODUNI"))
        if cnes and cnes in cnes_ativos:
            mapped_row = {
                "paMvm": safe_str(row.get("PA_MVM")),
                "paCmp": safe_str(row.get("PA_CMP")),
                "paProcId": safe_int_str(row.get("PA_PROC_ID")),
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
            mapped.append(mapped_row)
            
    return mapped

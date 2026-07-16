import re
import pandas as pd

def sanitize_code(raw: object) -> str:
    """
    Remove espaços e caracteres não numéricos de um código bruto.
    """
    if pd.isna(raw) or raw is None:
        return ""
    
    if isinstance(raw, float):
        raw = int(raw)
        
    str_val = str(raw).strip()
    
    # Remove tudo que não for dígito numérico
    return re.sub(r'\D', '', str_val)
def is_valid_sigtap_code(code: str) -> bool:
    """
    Retorna True se o código tiver exatamente 10 dígitos numéricos.
    
    Args:
        code: Código já sanitizado.
        
    Returns:
        True se for válido, False caso contrário.
    """
    return len(code) == 10 and code.isdigit()


def try_autocorrect_zero_prefix(code: str) -> str | None:
    """
    Tenta auto-corrigir um código que teve um zero inicial omitido.
    
    Se o código possui exatamente 9 dígitos e não começa com '0',
    assume-se que houve perda de um '0' à esquerda e retorna o código corrigido.
    Caso contrário, retorna None.
    
    Args:
        code: Código sanitizado.
        
    Returns:
        O código corrigido com 10 dígitos, ou None se a regra não se aplicar.
    """
    if len(code) == 9 and code.isdigit() and not code.startswith("0"):
        return "0" + code
    return None

def try_extract_sigtap_prefix(code: str) -> str | None:
    """
    Para códigos sujos com mais de 10 dígitos, retorna os primeiros 9
    dígitos como prefixo de busca (LIKE 'XXXXXXXXX%').
    
    Args:
        code: Código sanitizado.
        
    Returns:
        O prefixo de 9 dígitos, ou None se não se aplicar.
    """
    if len(code) > 10 and code.isdigit() and code.startswith("0"):
        return code[:9]
    return None

def sanitize_cnpj(raw: object) -> str:
    """
    Remove caracteres não numéricos do CNPJ.
    Se o resultado tiver menos de 14 dígitos, preenche com zeros à esquerda.
    Se for vazio, retorna string vazia.
    """
    if pd.isna(raw) or raw is None:
        return ""
        
    if isinstance(raw, float):
        raw = int(raw)
        
    str_val = str(raw).strip()
    digits = re.sub(r'\D', '', str_val)
    
    if digits:
        return digits.zfill(14)
    return ""

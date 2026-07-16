from sqlalchemy import text
from sqlalchemy.orm import Session

from format_and_validate_cpa_data.domain.models import ProcedimentoSigtap


def search_by_prefix(session: Session, prefix: str) -> list[ProcedimentoSigtap]:
    """Busca registros onde co_procedimento começa com o prefixo.
    Limitado a 20 resultados.
    """
    # Evita injeção de SQL forçando o prefixo a ter apenas dígitos,
    # já que ele deve vir de um código sanitizado.
    if not prefix.isdigit():
        return []
        
    query = text(
        "SELECT co_procedimento, no_procedimento "
        "FROM sigtap_tb_procedimento "
        "WHERE co_procedimento LIKE :prefix "
        "ORDER BY co_procedimento "
        "LIMIT 20"
    )
    
    result = session.execute(query, {"prefix": f"{prefix}%"}).mappings().all()
    
    return [
        ProcedimentoSigtap(
            co_procedimento=row["co_procedimento"],
            no_procedimento=row["no_procedimento"]
        )
        for row in result
    ]


def find_by_exact_code(session: Session, code: str) -> ProcedimentoSigtap | None:
    """Busca o registro exato pelo código."""
    if not code.isdigit() or len(code) != 10:
        return None
        
    query = text(
        "SELECT co_procedimento, no_procedimento "
        "FROM sigtap_tb_procedimento "
        "WHERE co_procedimento = :code"
    )
    
    row = session.execute(query, {"code": code}).mappings().first()
    
    if row:
        return ProcedimentoSigtap(
            co_procedimento=row["co_procedimento"],
            no_procedimento=row["no_procedimento"]
        )
    return None


def get_existing_codes(session: Session, codes: set[str]) -> set[str]:
    """Busca em lote quais códigos informados existem na base de dados."""
    if not codes:
        return set()
        
    query = text(
        "SELECT co_procedimento "
        "FROM sigtap_tb_procedimento "
        "WHERE co_procedimento = ANY(:codes)"
    )
    
    result = session.execute(query, {"codes": list(codes)}).mappings().all()
    return {row["co_procedimento"] for row in result}

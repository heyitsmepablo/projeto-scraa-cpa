"""Utilitários de logging padronizado e telemetria para processos de ETL."""

import logging
import sys
from pathlib import Path
from typing import Optional, Any, Dict


def setup_logger(
    name: str = "etl",
    log_level: str = "INFO",
    log_file: Optional[Path] = None,
) -> logging.Logger:
    """Configura e retorna um logger padronizado."""
    logger = logging.getLogger(name)
    level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(level)

    # Evita duplicação de handlers se já configurado
    if not logger.handlers:
        fmt = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        # Handler para stdout
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(fmt)
        console_handler.setLevel(level)
        logger.addHandler(console_handler)

        # Handler opcional para arquivo
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(str(log_file), encoding="utf-8")
            file_handler.setFormatter(fmt)
            file_handler.setLevel(level)
            logger.addHandler(file_handler)

    return logger


def log_etl_summary(
    modulo: str,
    duracao_segundos: float,
    registros_lidos: int,
    registros_filtrados: int,
    registros_inseridos: int,
    registros_descartados: int = 0,
    erros: int = 0,
    detalhes: Optional[Dict[str, Any]] = None,
    logger: Optional[logging.Logger] = None,
) -> None:
    """Formata e imprime um sumário tabular de telemetria da execução do ETL."""
    log = logger or logging.getLogger("etl")
    
    separator = "=" * 70
    sub_separator = "-" * 70
    
    taxa_retencao = (
        (registros_inseridos / registros_lidos * 100) if registros_lidos > 0 else 0.0
    )
    
    summary_lines = [
        "",
        separator,
        f" RESUMO DE EXECUÇÃO ETL: {modulo.upper()}",
        separator,
        f" Duração total               : {duracao_segundos:.2f}s",
        f" Registros lidos (origem)    : {registros_lidos:,}",
        f" Registros após pré-filtro   : {registros_filtrados:,}",
        f" Registros retidos/inseridos : {registros_inseridos:,} ({taxa_retencao:.1f}%)",
        f" Registros descartados       : {registros_descartados:,}",
        f" Erros operacionais          : {erros}",
    ]
    
    if detalhes:
        summary_lines.append(sub_separator)
        summary_lines.append(" Detalhamento adicional:")
        for k, v in detalhes.items():
            summary_lines.append(f"   - {k}: {v}")
            
    summary_lines.append(separator)
    summary_lines.append("")
    
    log.info("\n".join(summary_lines))

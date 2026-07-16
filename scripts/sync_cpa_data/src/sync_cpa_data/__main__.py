"""Entrypoint: allows running the pipeline with ``python -m sync_cpa_data``."""

import argparse
import sys

from sync_cpa_data.pipeline import run

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sincronizar dados CPA a partir da planilha.")
    parser.add_argument(
        "--reset", 
        action="store_true", 
        help="AVISO: Reseta todas as tabelas relacionadas à CPA antes de executar a importação."
    )
    parser.add_argument(
        "--reset-only", 
        action="store_true", 
        help="AVISO: Reseta todas as tabelas relacionadas à CPA e ENCERRA o script sem importar dados."
    )
    args = parser.parse_args()

    reset = args.reset or args.reset_only

    if reset:
        print("!" * 80)
        print("AVISO CRÍTICO: A flag de reset foi fornecida.")
        print("Isso apagará TODOS os dados das tabelas de:")
        print(" - Instituições, Vínculos e Aditivos")
        print(" - Planos Operativos e seus Procedimentos/Complementações")
        print(" - Histórico e logs de Importação da CPA")
        print("!" * 80)
        resp = input("Tem certeza absoluta que deseja prosseguir com o RESET físico dos dados? [y/N]: ")
        if resp.strip().lower() != 'y':
            print("Abortado pelo usuário.")
            sys.exit(0)
            
    try:
        run(reset=reset, exit_after_reset=args.reset_only)
    except (FileNotFoundError, EnvironmentError) as exc:
        # Configuration or file errors: no need for a stack trace
        print(f"ERRO: {exc}", file=sys.stderr)
        sys.exit(1)

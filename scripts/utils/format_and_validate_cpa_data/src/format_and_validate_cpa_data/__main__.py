import sys
import os
from datetime import datetime

from sqlalchemy.exc import SQLAlchemyError

from format_and_validate_cpa_data import settings
from format_and_validate_cpa_data.repository import get_existing_codes
from format_and_validate_cpa_data.sanitizer import sanitize_code, is_valid_sigtap_code, try_autocorrect_zero_prefix
from format_and_validate_cpa_data.db import get_engine, get_session
from format_and_validate_cpa_data.loader import (
    load_workbook_and_sheet,
    load_vinculos_lookup,
    pre_sanitize_all_codes,
    apply_auto_corrections,
    extract_inconsistencies,
    apply_corrections,
    save_workbook,
    freeze_formulas_as_values,
    _find_column_by_keyword,
    sanitize_instituicoes_cnpj
)
from format_and_validate_cpa_data.cli import (
    prompt_database_url,
    run_interactive_loop,
    print_autocorrection_summary,
    print_summary,
    Colors
)
import questionary
import pandas as pd


def main() -> None:
    try:
        print(f"{Colors.BOLD}{Colors.OKBLUE}=== Sanitizador de Códigos SIGTAP ==={Colors.ENDC}\n")
        
        # 1. Obter URL do banco
        db_url = settings.DATABASE_URL
        if not db_url:
            db_url = prompt_database_url()
            # Salvar temporariamente na env para esta execução
            os.environ["DATABASE_URL"] = db_url
            
        print(f"{Colors.OKCYAN}Conectando ao banco de dados...{Colors.ENDC}")
        engine = get_engine(db_url)
        
        # 2. Carregar Planilha
        print(f"{Colors.OKCYAN}Lendo planilha: {settings.SPREADSHEET_PATH}{Colors.ENDC}")
        if not settings.SPREADSHEET_PATH.exists():
            print(f"{Colors.FAIL}Erro: Arquivo não encontrado em {settings.SPREADSHEET_PATH}{Colors.ENDC}")
            sys.exit(1)
            
        wb, df = load_workbook_and_sheet(settings.SPREADSHEET_PATH)
        vinculos_lookup = load_vinculos_lookup(settings.SPREADSHEET_PATH)
        
        # 3. PRÉ-SANITIZAÇÃO (Etapa 0)
        print(f"{Colors.OKCYAN}Pré-sanitizando coluna de código SIGTAP (removendo textos e caracteres não-numéricos)...{Colors.ENDC}")
        try:
            pre_sanitize_changes = pre_sanitize_all_codes(df)
        except ValueError as e:
            print(f"{Colors.FAIL}Erro de estrutura na planilha: {e}{Colors.ENDC}")
            sys.exit(1)

        if pre_sanitize_changes:
            print(f"{Colors.OKGREEN}✔ {len(pre_sanitize_changes)} células pré-sanitizadas (lixo removido).{Colors.ENDC}")

        # Coletar códigos únicos para verificação em lote
        print(f"{Colors.OKCYAN}Verificando códigos na base de dados (SIGTAP)...{Colors.ENDC}")
        col_codigo = _find_column_by_keyword(df.columns.tolist(), ["codigo", "código", "sigtap"])
        unique_codes_to_check = set()
        if col_codigo:
            for _, row in df.iterrows():
                raw_code = row[col_codigo] if pd.notna(row[col_codigo]) else None
                sanitized = sanitize_code(raw_code)
                if is_valid_sigtap_code(sanitized):
                    unique_codes_to_check.add(sanitized)
                autocorrected = try_autocorrect_zero_prefix(sanitized)
                if autocorrected:
                    unique_codes_to_check.add(autocorrected)
                    
        with get_session(engine) as session:
            existing_codes = get_existing_codes(session, unique_codes_to_check)
            
            # 4. Auto-correção
            print(f"{Colors.OKCYAN}Executando auto-correções preliminares na aba 'PLANOS OPERATIVOS'...{Colors.ENDC}")
            auto_corrections, auto_count, auto_logs = apply_auto_corrections(df, existing_codes=existing_codes, vinculos_lookup=vinculos_lookup)
            all_logs = auto_logs.copy()
            
            # 5. Extrair inconsistências restantes
            try:
                inconsistencies = extract_inconsistencies(df, vinculos_lookup=vinculos_lookup, existing_codes=existing_codes)
            except ValueError as e:
                print(f"{Colors.FAIL}Erro de estrutura na planilha: {e}{Colors.ENDC}")
                sys.exit(1)
                
            if auto_count > 0 or len(inconsistencies) > 0:
                print_autocorrection_summary(auto_count, len(inconsistencies))
                
            if not inconsistencies and auto_count == 0:
                print(f"{Colors.OKGREEN}Tudo certo! Nenhuma inconsistência encontrada nos códigos SIGTAP.{Colors.ENDC}")
                sys.exit(0)
                
            # Pergunta de auto-resolve
            auto_resolve_single_match = False
            if inconsistencies:
                try:
                    auto_resolve_single_match = questionary.confirm(
                        "Deseja corrigir AUTOMATICAMENTE os códigos que tiverem exatamente 1 correspondência no banco de dados?"
                    ).ask()
                except KeyboardInterrupt:
                    sys.exit(130)
                    
            # 5. Loop Interativo
            manual_corrections = {}
            if inconsistencies:
                manual_corrections, manual_logs = run_interactive_loop(
                    inconsistencies, session, auto_resolve_single_match=auto_resolve_single_match
                )
                all_logs.extend(manual_logs)
                
        # 7. Salvar Correções (Merge pre-sanitize + auto + manual)
        all_corrections = {**pre_sanitize_changes, **auto_corrections, **manual_corrections}
        
        inst_corrections = {}
        print(f"{Colors.OKCYAN}Sanitizando aba 'INSTITUICOES' (CNPJ)...{Colors.ENDC}")
        try:
            df_inst = pd.read_excel(settings.SPREADSHEET_PATH, sheet_name="INSTITUICOES", dtype=str)
            inst_corrections = sanitize_instituicoes_cnpj(df_inst)
            if inst_corrections:
                col_cnpj = _find_column_by_keyword(df_inst.columns.tolist(), ["cnpj"])
                if col_cnpj:
                    apply_corrections(wb, "INSTITUICOES", col_cnpj, inst_corrections)
                    print(f"{Colors.OKGREEN}✔ {len(inst_corrections)} CNPJs corrigidos.{Colors.ENDC}")
        except ValueError:
            print(f"{Colors.WARNING}Aba 'INSTITUICOES' não encontrada. Pulando sanitização de CNPJ.{Colors.ENDC}")
        
        if all_corrections or inst_corrections:
            if all_corrections:
                print(f"{Colors.OKCYAN}\nAplicando {len(all_corrections)} correções de SIGTAP no arquivo...{Colors.ENDC}")
                col_codigo = _find_column_by_keyword(df.columns.tolist(), ["codigo", "código", "sigtap"])
                if not col_codigo:
                    print(f"{Colors.FAIL}Erro inesperado: Coluna de código sumiu.{Colors.ENDC}")
                    sys.exit(1)
                    
                apply_corrections(wb, "PLANOS OPERATIVOS", col_codigo, all_corrections)
                
                # Congela as fórmulas do openpyxl em valores estáticos
                freeze_formulas_as_values(wb, "PLANOS OPERATIVOS", df)
            
            output_dir = settings.OUTPUT_PATH.parent
            if not output_dir.exists():
                output_dir.mkdir(parents=True, exist_ok=True)
                
            save_workbook(wb, settings.OUTPUT_PATH)
            
            # Salvar log de auditoria
            if all_logs:
                logs_dir = output_dir / "logs-scripts"
                logs_dir.mkdir(parents=True, exist_ok=True)
                
                timestamp = datetime.now().strftime("%d%m%Y-%H%M")
                log_filename = f"cpa_corrections_log-{timestamp}.csv"
                log_filepath = logs_dir / log_filename
                
                log_df = pd.DataFrame([
                    {
                        "Linha Excel": log.linha_excel,
                        "Instituição": log.instituicao or "N/A",
                        "Vínculo": log.vinculo or "N/A",
                        "CNES": log.cnes or "N/A",
                        "Aditivo": log.aditivo or "N/A",
                        "Código Original": log.codigo_original,
                        "Código Corrigido": log.codigo_corrigido,
                        "Nome do Procedimento": log.procedimento_nome or "",
                        "Modo de Correção": log.modo_correcao
                    }
                    for log in all_logs
                ])
                log_df.to_csv(log_filepath, index=False, encoding="utf-8-sig")
                print(f"{Colors.OKGREEN}Log de auditoria gerado: {log_filepath}{Colors.ENDC}")
            
        print_summary(len(inconsistencies), len(manual_corrections), str(settings.OUTPUT_PATH))
        
    except SQLAlchemyError as e:
        print(f"{Colors.FAIL}\nErro de Banco de Dados:{Colors.ENDC} {e}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.FAIL}\nErro Inesperado:{Colors.ENDC} {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

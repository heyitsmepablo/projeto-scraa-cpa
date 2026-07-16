import sys
from collections import Counter
import questionary
from sqlalchemy.orm import Session

from format_and_validate_cpa_data.domain.models import InconsistenciaRegistro, CorrectionLogEntry
from format_and_validate_cpa_data.repository import search_by_prefix, find_by_exact_code
from format_and_validate_cpa_data.sanitizer import is_valid_sigtap_code

# ANSI colors for basic styling
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def prompt_database_url() -> str:
    """Solicita a URL do banco se não existir no ambiente."""
    print(f"{Colors.WARNING}Aviso: DATABASE_URL não definida.{Colors.ENDC}")
    url = questionary.password("Por favor, insira a URL de conexão do PostgreSQL:").ask()
    if not url:
        print(f"{Colors.FAIL}Erro: Conexão com o banco é obrigatória.{Colors.ENDC}")
        sys.exit(1)
    return url


def display_context(record: InconsistenciaRegistro, index: int, total: int, remaining: int) -> None:
    """Exibe o contexto visual de uma inconsistência."""
    print(f"\n{Colors.BOLD}{Colors.HEADER}=== Registro {index}/{total} (Linha Excel: {record.linha_excel}) ==={Colors.ENDC}")
    
    if record.instituicao:
        print(f"{Colors.BOLD}Instituição:{Colors.ENDC} {record.instituicao}")
    if record.cnes:
        print(f"{Colors.BOLD}CNES:{Colors.ENDC} {record.cnes}")
        
    print(f"{Colors.BOLD}Plano Operativo:{Colors.ENDC} {record.plano_operativo}")
    print(f"{Colors.BOLD}Vínculo:{Colors.ENDC} {record.vinculo} | {Colors.BOLD}Aditivo:{Colors.ENDC} {record.aditivo or 'N/A'}")
    
    if record.quantidade_mensal_pactuada:
        print(f"{Colors.BOLD}Quantidade Mês Pactuada:{Colors.ENDC} {record.quantidade_mensal_pactuada}")
        
    print(f"{Colors.BOLD}Descrição na Planilha:{Colors.ENDC} {record.descricao_planilha or '(sem descrição)'}")
    print(f"{Colors.BOLD}Código Atual (Incompleto):{Colors.ENDC} {Colors.FAIL}{record.codigo_atual}{Colors.ENDC}")
    
    # Alerta contextual baseado no tipo de código inválido
    if len(record.codigo_atual) > 10:
        print(f"{Colors.WARNING}⚠ Código com dígitos extras (possível concatenação de dados). Busca baseada nos primeiros 9 dígitos.{Colors.ENDC}")
    elif len(record.codigo_atual) < 10 and record.codigo_atual.startswith("0"):
        print(f"{Colors.WARNING}⚠ Código incompleto ({len(record.codigo_atual)} dígitos). Faltam dígitos finais.{Colors.ENDC}")
    
    if remaining > 0:
        print(f"{Colors.WARNING}Este código incompleto aparece mais {remaining} vezes na planilha.{Colors.ENDC}")
        
    print("-" * 60)



def _get_search_prefix(code: str) -> str:
    """Retorna o melhor prefixo de busca independente do tamanho do código."""
    if len(code) > 10:
        code = code[:9]
    if not code.startswith("0"):
        code = "0" + code
    return code


def prompt_correction(record: InconsistenciaRegistro, session: Session) -> str | None:
    """Guia o usuário para corrigir um registro."""
    prefix_results = search_by_prefix(session, _get_search_prefix(record.codigo_atual))
    
    choices = []
    # Opções do banco
    for p in prefix_results:
        choices.append(questionary.Choice(title=f"[{p.co_procedimento}] {p.no_procedimento}", value=p.co_procedimento))
        
    choices.append(questionary.Choice(title=f"{Colors.OKCYAN}[+] Inserir código manualmente{Colors.ENDC}", value="MANUAL"))
    choices.append(questionary.Choice(title=f"{Colors.WARNING}[~] Pular este registro (manter como está){Colors.ENDC}", value="SKIP"))
    
    try:
        action = questionary.select(
            "Selecione a ação:",
            choices=choices,
            use_indicator=True
        ).ask()
    except KeyboardInterrupt:
        return "ABORT"

    if action == "SKIP" or action is None:
        return None
    elif action == "ABORT":
        return "ABORT"
    elif action == "MANUAL":
        while True:
            try:
                manual_code = questionary.text("Digite o código correto de 10 dígitos (ou deixe em branco para cancelar):").ask()
            except KeyboardInterrupt:
                return "ABORT"
                
            if not manual_code:
                return None
                
            if is_valid_sigtap_code(manual_code):
                proc = find_by_exact_code(session, manual_code)
                if proc:
                    print(f"\n{Colors.OKCYAN}Procedimento encontrado: {proc.no_procedimento}{Colors.ENDC}")
                    try:
                        confirm = questionary.confirm("Confirma a associação com este procedimento?").ask()
                    except KeyboardInterrupt:
                        return "ABORT"
                    if confirm:
                        return manual_code
                else:
                    print(f"{Colors.WARNING}Aviso: Código não encontrado no banco local, mas possui formato válido.{Colors.ENDC}")
                    try:
                        confirm = questionary.confirm("Deseja forçar a utilização deste código?").ask()
                    except KeyboardInterrupt:
                        return "ABORT"
                    if confirm:
                        return manual_code
            else:
                print(f"{Colors.FAIL}Erro: O código deve conter exatamente 10 dígitos numéricos.{Colors.ENDC}")
    else:
        # Usuário selecionou uma opção do banco
        return action


def run_interactive_loop(
    inconsistencies: list[InconsistenciaRegistro], 
    session: Session,
    auto_resolve_single_match: bool = False
) -> tuple[dict[int, str], list[CorrectionLogEntry]]:
    """Executa o loop interativo para correção manual. Retorna correções e log."""
    corrections = {}
    logs = []
    
    total = len(inconsistencies)
    
    # Contagem de ocorrências
    freq_map = {}
    for record in inconsistencies:
        freq_map[record.codigo_atual] = freq_map.get(record.codigo_atual, 0) + 1
    
    try:
        for idx, record in enumerate(inconsistencies, 1):
            
            # --- Modo Auto-Resolve ---
            if auto_resolve_single_match:
                search_term = _get_search_prefix(record.codigo_atual)
                prefix_results = search_by_prefix(session, search_term)
                
                if len(prefix_results) == 1:
                    match = prefix_results[0]
                    corrections[record.linha_excel] = match.co_procedimento
                    freq_map[record.codigo_atual] -= 1
                    
                    print(f"\n{Colors.OKGREEN}✓ Linha {record.linha_excel}: Auto-corrigido para {match.co_procedimento} ({match.no_procedimento}){Colors.ENDC}")
                    
                    logs.append(CorrectionLogEntry(
                        linha_excel=record.linha_excel,
                        instituicao=record.instituicao,
                        vinculo=record.vinculo,
                        cnes=record.cnes,
                        aditivo=record.aditivo,
                        codigo_original=record.codigo_atual,
                        codigo_corrigido=match.co_procedimento,
                        modo_correcao="Auto-Resolve (1 Match)",
                        procedimento_nome=match.no_procedimento
                    ))
                    continue
            # -------------------------
            
            remaining = freq_map[record.codigo_atual] - 1
            display_context(record, idx, total, remaining)
            
            freq_map[record.codigo_atual] -= 1
            
            new_code = prompt_correction(record, session)
            
            if new_code == "ABORT":
                raise KeyboardInterrupt
                
            if new_code:
                corrections[record.linha_excel] = new_code
                print(f"{Colors.OKGREEN}✓ Registrado para correção.{Colors.ENDC}\n")
                
                # Para log, buscar o nome se possível
                proc_name = None
                proc = find_by_exact_code(session, new_code)
                if proc:
                    proc_name = proc.no_procedimento
                logs.append(CorrectionLogEntry(
                    linha_excel=record.linha_excel,
                    instituicao=record.instituicao,
                    vinculo=record.vinculo,
                    cnes=record.cnes,
                    aditivo=record.aditivo,
                    codigo_original=record.codigo_atual,
                    codigo_corrigido=new_code,
                    modo_correcao="Manual",
                    procedimento_nome=proc_name
                ))
            else:
                print(f"{Colors.WARNING}⚠ Pulado.{Colors.ENDC}\n")
                
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Interrupção detectada!{Colors.ENDC}")
        print(f"{Colors.FAIL}Nenhuma correção manual em andamento foi concluída. Saindo sem salvar os pendentes.{Colors.ENDC}")
        sys.exit(130)
        
    return corrections, logs


def print_autocorrection_summary(auto_count: int, remaining: int) -> None:
    """Exibe um resumo da fase de auto-correção pré-interativa."""
    if auto_count > 0:
        print(f"{Colors.OKGREEN}✔ Foram corrigidos automaticamente {auto_count} códigos com omissão de zero à esquerda.{Colors.ENDC}")
    print(f"{Colors.WARNING}Restam {remaining} inconsistências para análise manual.{Colors.ENDC}")


def print_summary(total: int, corrected: int, output_path: str) -> None:
    """Exibe o resumo final das operações."""
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}=== RESUMO DA OPERAÇÃO ==={Colors.ENDC}")
    print(f"Total de inconsistências analisadas: {total}")
    print(f"Corrigidas: {Colors.OKGREEN}{corrected}{Colors.ENDC}")
    print(f"Ignoradas: {Colors.WARNING}{total - corrected}{Colors.ENDC}")
    print(f"Planilha salva em: {Colors.BOLD}{output_path}{Colors.ENDC}\n")


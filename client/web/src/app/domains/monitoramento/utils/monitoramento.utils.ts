import { StatusExecucao, calcularStatusExecucao } from '../../../core/models/domain-enums.model';

export { calcularStatusExecucao };

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

/**
 * Formata um valor numérico para o padrão de moeda brasileira (BRL).
 */
export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  return currencyFormatter.format(value);
}

/**
 * Formata o código SIGTAP de 10 dígitos com a máscara oficial (00.00.00.000-0).
 */
export function formatSigtapCode(code?: string): string {
  if (!code) return '-';
  const clean = code.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  return code;
}

/**
 * Retorna a severidade PrimeNG para a complexidade do procedimento.
 */
export function getComplexidadeSeverity(
  c?: string
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  switch (c) {
    case '1':
      return 'info';
    case '2':
      return 'warn';
    case '3':
      return 'danger';
    case '0':
      return 'secondary';
    default:
      return 'secondary';
  }
}

/**
 * Retorna o rótulo legível para a complexidade do procedimento.
 */
export function getComplexidadeLabel(c?: string): string {
  switch (c) {
    case '1':
      return 'Atenção Básica';
    case '2':
      return 'Média Complexidade';
    case '3':
      return 'Alta Complexidade';
    case '0':
      return 'Não se aplica';
    default:
      return c || '-';
  }
}

/**
 * Retorna a severidade PrimeNG de acordo com o status de execução da meta.
 */
export function getStatusSeverity(
  status?: StatusExecucao | string
): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
  switch (status) {
    case 'DENTRO':
      return 'success';
    case 'ACIMA':
      return 'warn';
    case 'ABAIXO':
      return 'danger';
    case 'SEM_PACTO':
      return 'secondary';
    default:
      return 'info';
  }
}

/**
 * Retorna o rótulo textual legível para o status de execução da meta.
 */
export function getStatusLabel(status?: StatusExecucao | string): string {
  switch (status) {
    case 'DENTRO':
      return 'Dentro da Meta';
    case 'ACIMA':
      return 'Acima da Meta';
    case 'ABAIXO':
      return 'Abaixo da Meta';
    case 'SEM_PACTO':
      return 'Sem Pacto';
    default:
      return status || '-';
  }
}

/**
 * Limita o valor percentual entre 0% e 100% para renderização segura em barras de progresso.
 */
export function getClampedPercent(perc?: number | null): number {
  if (perc === null || perc === undefined) return 0;
  return Math.min(Math.max(perc, 0), 100);
}

/**
 * Retorna a classe CSS customizada para a barra de progresso conforme o status.
 */
export function getProgressBarClass(status?: StatusExecucao | string): string {
  switch (status) {
    case 'DENTRO':
      return 'p-progressbar-emerald';
    case 'ACIMA':
      return 'p-progressbar-amber';
    case 'ABAIXO':
      return 'p-progressbar-rose';
    default:
      return 'p-progressbar-slate';
  }
}

/**
 * Retorna a classe utilitária de cor Tailwind para o texto de percentual.
 */
export function getPercTextClass(status?: StatusExecucao | string): string {
  switch (status) {
    case 'DENTRO':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'ACIMA':
      return 'text-amber-600 dark:text-amber-400';
    case 'ABAIXO':
      return 'text-rose-600 dark:text-rose-400';
    default:
      return 'text-surface-600 dark:text-surface-400';
  }
}

/**
 * Retorna a classe de cor do saldo financeiro conforme valor positivo, negativo ou status sem pacto.
 */
export function getSaldoFinanceiroClass(saldo: number, status?: StatusExecucao | string): string {
  if (status === 'SEM_PACTO') {
    return 'text-surface-600 dark:text-surface-400';
  }
  if (saldo > 0) {
    return 'text-amber-600 dark:text-amber-400';
  }
  if (saldo < 0) {
    return 'text-rose-600 dark:text-rose-400';
  }
  return 'text-emerald-600 dark:text-emerald-400';
}

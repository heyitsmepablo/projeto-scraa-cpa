export interface DashboardKpis {
  totalValorAprovado: number;
  totalValorProduzido: number;
  totalQtdAprovada: number;
  totalQtdProduzida: number;
  totalQtdPactuada: number;
  taxaExecucaoGeral: number;
  statusGeralLabel: string;
  statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info';
  totalProcedimentos: number;
  totalDentro: number;
  totalAcima: number;
  totalAbaixo: number;
  totalSemPacto: number;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

import { ProducaoPorProcedimento } from '../../../core/models/producao.model';
import { StatusExecucao } from '../../../core/models/domain-enums';

export interface MonitoramentoProcedimentoItem extends ProducaoPorProcedimento {
  coProcedimentoFormatado: string;
  diferencaFisico: number | null;
}

export interface SigtapTreeNodeData {
  tipo: 'GRUPO' | 'SUBGRUPO' | 'PROCEDIMENTO';
  coCodigo: string;
  descricao: string;
  coProcedimento?: string;
  coProcedimentoFormatado?: string;
  noProcedimento?: string;
  coFinanciamento?: string;
  noFinanciamento?: string;
  complexidade?: string;
  vlUnitario?: number;
  qtdPactuadaMensal: number | null;
  qtdAprovada: number;
  diferencaFisico: number | null;
  vlrPactuado: number | null;
  vlrAprovado: number;
  saldoFinanceiro: number;
  percExecucao: number | null;
  percExecucaoFinanceira: number | null;
  statusExecucao: StatusExecucao;
  totalProcedimentos?: number;
}

export interface MonitoramentoKpis {
  totalPactuado: number;
  totalAprovado: number;
  saldoFisico: number;
  totalFinanceiroPactuado: number;
  totalFinanceiro: number;
  saldoFinanceiroGlobal: number;
  percentualGlobal: number;
  percentualGlobalFinanceiro: number;
  statusGeralLabel: string;
  statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info';
  statusFinanceiroGlobalLabel: string;
  statusFinanceiroGlobalSeverity: 'success' | 'warn' | 'danger' | 'info';
  totalItens: number;
  totalComPacto: number;
  totalDentro: number;
  totalAcima: number;
  totalAbaixo: number;
  totalSemPacto: number;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

import { StatusExecucao } from './domain-enums.model';

export interface ProducaoResumoMensal {
  competencia: string;
  ano: string;
  mes: string;
  nomeMes: string;
  quadrimestre: string;
  tipoContrato: string;
  cnes: string;
  nomeInstituicao: string;
  coFinanciamento: string;
  noFinanciamento: string;
  complexidade: string;
  totalFreq: number;
  totalVlrAprovado: number;
  totalVlrProduzido: number;
}

export interface ProducaoPorProcedimento {
  competencia: string;
  ano: string;
  mes: string;
  nomeMes: string;
  quadrimestre: string;
  tipoContrato: string;
  cnes: string;
  nomeInstituicao: string;
  tipoVinculo: string;
  vinculoId?: number;
  coFinanciamento: string;
  noFinanciamento: string;
  complexidade: string;
  coProcedimento: string;
  noProcedimento: string;

  // Hierarquia SIGTAP
  coGrupo?: string;
  noGrupo?: string;
  coSubGrupo?: string;
  noSubGrupo?: string;

  // Valores Unitários & Totais
  vlUnitario?: number;
  qtdAprovada: number;
  vlrAprovado: number;
  qtdProduzida: number;
  vlrProduzido: number;

  // Pactuação e Execução Física
  qtdPactuadaMensal: number | null;
  percExecucao: number | null;
  statusExecucao: StatusExecucao;

  // Pactuação e Execução Financeira
  vlrPactuado?: number | null;
  saldoFinanceiro?: number;
  percExecucaoFinanceira?: number | null;
}

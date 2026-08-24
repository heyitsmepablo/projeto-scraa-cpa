import { StatusExecucao } from './domain-enums';

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
  coFinanciamento: string;
  noFinanciamento: string;
  complexidade: string;
  coProcedimento: string;
  noProcedimento: string;
  qtdAprovada: number;
  vlrAprovado: number;
  qtdProduzida: number;
  vlrProduzido: number;
  qtdPactuadaMensal: number | null;
  percExecucao: number | null;
  statusExecucao: StatusExecucao;
}

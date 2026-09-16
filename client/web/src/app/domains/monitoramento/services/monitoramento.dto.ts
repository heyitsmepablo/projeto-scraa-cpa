export interface MonitoramentoResumoDto {
  totalFisicoPactuado: number;
  totalFisicoRealizado: number;
  totalFinanceiroPactuado: number;
  totalFinanceiroRealizado: number;
  percentualFisico: number;
  percentualFinanceiro: number;
}

export interface MonitoramentoItemAnaliticoDto {
  coProcedimento: string;
  noProcedimento: string;
  coGrupo: string;
  noGrupo: string;
  coSubGrupo: string;
  noSubGrupo: string;
  complexidade: string;
  vlUnitario: number;
  metaFisica: number;
  fisicoRealizado: number;
  saldoFisico: number;
  percentualFisico: number;
  metaFinanceira: number;
  financeiroRealizado: number;
  saldoFinanceiro: number;
  percentualFinanceiro: number;
  status: 'ACIMA' | 'ABAIXO' | 'DENTRO' | 'SEM_PACTO';
}

export interface MonitoramentoAnaliticoDto {
  itens: MonitoramentoItemAnaliticoDto[];
}

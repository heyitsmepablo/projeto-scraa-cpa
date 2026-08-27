export type TipoInstituicao = 'FILANTRÓPICO' | 'EMPRESA';

export type TipoVinculo = 'CONVÊNIO' | 'CONTRATO';

export type TipoAditivo = 'ACRÉSCIMO' | 'SUPRESSÃO' | 'PRAZO';

export type TipoComplexidade = 'BC' | 'MC' | 'AC';

export type StatusExecucao = 'ACIMA' | 'ABAIXO' | 'DENTRO' | 'SEM_PACTO';

export function calcularStatusExecucao(perc: number | null | undefined): StatusExecucao {
  if (perc === null || perc === undefined) return 'SEM_PACTO';
  if (perc > 105) return 'ACIMA';
  if (perc < 95) return 'ABAIXO';
  return 'DENTRO';
}

export type TipoOperacao = 'INSERT' | 'UPDATE' | 'DELETE';

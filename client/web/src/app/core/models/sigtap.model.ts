export interface SigtapProcedimento {
  coProcedimento: string;
  noProcedimento: string;
  tpComplexidade: string;
  tpSexo: string;
  qtMaximaExecucao: number;
  qtDiasPermanencia: number;
  qtPontos: number;
  vlIdadeMinima: number;
  vlIdadeMaxima: number;
  vlSh: number;
  vlSa: number;
  vlSp: number;
  coFinanciamento: string;
  coRubrica?: string | null;
  qtTempoPermanencia: number;
  dtCompetencia: string;
  deletadoNaCompetencia?: string | null;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
}

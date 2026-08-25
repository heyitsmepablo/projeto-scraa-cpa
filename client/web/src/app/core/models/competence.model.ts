export type PeriodMode = 'SPECIFIC' | 'RANGE' | 'GLOBAL';

export interface PeriodFilter {
  mode: PeriodMode;
  competencia: string | null;       // YYYYMM (modo SPECIFIC)
  competenciaInicio: string | null; // YYYYMM (RANGE e GLOBAL)
  competenciaFim: string | null;    // YYYYMM (RANGE e GLOBAL)
  mesesCount: number;               // N meses
  descricaoFormatada: string;
}

export interface CompetenciaOption {
  value: string;
  label: string;
  ano: number;
  mes: number;
}

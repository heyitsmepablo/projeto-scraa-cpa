import { Vinculo, Aditivo } from './vinculo.model';
import { SigtapProcedimento } from './sigtap.model';

export interface PlanoOperativo {
  id: number;
  vinculoId: number;
  aditivoId?: number | null;
  vigente: boolean;
  expiradoEm?: string | Date | null;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
  vinculo?: Vinculo;
  aditivo?: Aditivo | null;
  procedimentos?: PlanoOperativoProcedimento[];
  planoOperativoComplementacaos?: PlanoOperativoComplementacao[];
}

export interface PlanoOperativoProcedimento {
  id: number;
  planoOperativoId: number;
  coProcedimento: string;
  quantidadePactuadaMensal: number;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
  planoOperativo?: PlanoOperativo;
  procedimento?: SigtapProcedimento;
}

export interface PlanoOperativoComplementacao {
  id: number;
  planoOperativoId: number;
  complementacaoItemId: number;
  quantidadePactuadaMensal: number;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
}

export interface DistribuicaoComplexidade {
  bc: number;
  mc: number;
  ac: number;
}

export interface PlanoOperativoResumo {
  planoOperativoId: number;
  totalProcedimentos: number;
  metaFisicaTotal: number;
  distribuicaoComplexidade: DistribuicaoComplexidade;
}

export interface VinculoPlanoOption {
  planoOperativoId: number;
  vinculoId: number;
  label: string;
  instituicaoNome: string;
  numeroVinculo: string;
  vigente: boolean;
}

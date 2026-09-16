import { Vinculo } from '../../../core/models/vinculo.model';
import { SigtapProcedimento } from '../../../core/models/sigtap.model';

export interface PlanoOperativo {
  id: number;
  vinculoId: number;
  vigente: boolean;
  criadoEm?: Date | string;
  expiradoEm?: Date | string;
  vinculo?: Vinculo;
  procedimentos?: PlanoOperativoProcedimento[];
}

export interface PlanoOperativoProcedimento {
  id: number;
  planoOperativoId: number;
  coProcedimento: string;
  quantidadePactuadaMensal: number;
  procedimento?: SigtapProcedimento;
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
  totalPactuado?: number;
  valorFinanceiroPrevisto?: number;
}

export interface VinculoPlanoOption {
  planoOperativoId: number;
  vinculoId: number;
  label: string;
  instituicaoNome: string;
  numeroVinculo: string;
  vigente: boolean;
}

export interface ProcedimentoViewItem extends PlanoOperativoProcedimento {
  coProcedimentoFormatado: string;
}

import { TipoAditivo, TipoComplexidade, TipoVinculo } from './domain-enums';
import { Instituicao } from './instituicao.model';
import { PlanoOperativo } from './plano-operativo.model';

export interface Vinculo {
  id: number;
  instituicaoId: number;
  numero: string;
  numeroProcessoSei: string;
  tipoVinculo: TipoVinculo;
  objeto: string;
  complexidade: TipoComplexidade[];
  dataDaAssinatura: string | Date;
  dataInicio: string | Date;
  dataFim?: string | Date | null;
  valorTotal: number;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
  instituicao?: Instituicao;
  aditivos?: Aditivo[];
  planosOperativos?: PlanoOperativo[];
}

export interface Aditivo {
  id: number;
  vinculoId: number;
  numero: string;
  numeroProcessoSei: string;
  tipoAditivo: TipoAditivo[];
  dataDaAssinatura: string | Date;
  dataInicio: string | Date;
  dataFim: string | Date;
  valorTotal?: number | null;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
  vinculo?: Vinculo;
  planoOperativos?: PlanoOperativo[];
}

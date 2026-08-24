import { TipoInstituicao } from './domain-enums';
import { Vinculo } from './vinculo.model';

export interface Instituicao {
  id: number;
  nome: string;
  cnes: string;
  cnpj?: string | null;
  tipoInstituicao: TipoInstituicao;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  deletadoEm?: string | Date | null;
  vinculos?: Vinculo[];
}

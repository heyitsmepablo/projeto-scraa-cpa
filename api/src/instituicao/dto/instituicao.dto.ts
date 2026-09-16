import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoInstituicao } from '../../../generated/prisma/client';

export class InstituicaoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'HOSPITAL SÃO LUCAS' })
  nome: string;

  @ApiProperty({ example: '1234567' })
  cnes: string;

  @ApiPropertyOptional({ example: '12345678000199' })
  cnpj?: string;

  @ApiProperty({ enum: TipoInstituicao, example: TipoInstituicao.FILANTRÓPICO })
  tipoInstituicao: TipoInstituicao;
}

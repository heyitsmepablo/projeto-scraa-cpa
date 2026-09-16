import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoVinculo, TipoComplexidade } from '../../../generated/prisma/client';
import { InstituicaoDto } from '../../instituicao/dto/instituicao.dto';

export class AditivoDto {
  @ApiProperty() id: number;
  @ApiProperty() numero: string;
  @ApiProperty() numeroProcessoSei: string;
  @ApiProperty() dataInicio: Date;
  @ApiProperty() dataFim: Date;
  @ApiPropertyOptional() valorTotal?: number;
}

export class VinculoDto {
  @ApiProperty() id: number;
  @ApiProperty() numero: string;
  @ApiProperty() numeroProcessoSei: string;
  @ApiProperty({ enum: TipoVinculo }) tipoVinculo: TipoVinculo;
  @ApiProperty() objeto: string;
  @ApiProperty({ enum: TipoComplexidade, isArray: true }) complexidade: TipoComplexidade[];
  @ApiProperty() dataDaAssinatura: Date;
  @ApiProperty() dataInicio: Date;
  @ApiPropertyOptional() dataFim?: Date;
  @ApiProperty() valorTotal: number;

  @ApiPropertyOptional({ type: () => InstituicaoDto })
  instituicao?: InstituicaoDto;
  
  @ApiPropertyOptional({ type: () => [AditivoDto] })
  aditivos?: AditivoDto[];
}

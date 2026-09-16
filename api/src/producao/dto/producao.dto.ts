import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ProducaoResumoFilterDto {
  @ApiProperty()
  @IsString()
  competencia: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnes?: string;
}

export class ProducaoFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competenciaInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competenciaFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mesesCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  instituicaoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vinculoId?: number;
}

export class ProducaoResumoDto {
  @ApiProperty() competencia: string;
  @ApiPropertyOptional() cnes?: string;
  @ApiProperty() totalAprovado: number;
  @ApiProperty() totalProduzido: number;
}

export class ProducaoPorPeriodoDto {
  @ApiProperty() coProcedimento: string;
  @ApiProperty() noProcedimento: string;
  @ApiProperty() quantidadePactuada: number;
  @ApiProperty() quantidadeProduzida: number;
  @ApiProperty() valorPactuado: number;
  @ApiProperty() valorProduzido: number;
}

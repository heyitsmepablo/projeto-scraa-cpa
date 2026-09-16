import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubgruposFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por Código do Grupo' })
  @IsOptional()
  @IsString()
  grupoCodigo?: string;
}

export class FormasOrganizacaoFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por Código do Grupo' })
  @IsOptional()
  @IsString()
  grupoCodigo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por Código do Subgrupo' })
  @IsOptional()
  @IsString()
  subgrupoCodigo?: string;
}

export class ProcedimentosFilterDto {
  @ApiPropertyOptional({ description: 'Termo de busca (Código ou Nome)' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({ description: 'Complexidade (BC, MC, AC)', enum: ['BC', 'MC', 'AC'] })
  @IsOptional()
  @IsString()
  complexidade?: string;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Competência (ex: 202301). Padrão: última disponível.' })
  @IsOptional()
  @IsString()
  competencia?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsDateString } from 'class-validator';

export class GetMonitoramentoFilterDto {
  @ApiPropertyOptional({
    description: 'Filtro por mês/ano específico no formato YYYYMM. Ex: 202301',
    example: '202301',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'mesAno deve estar no formato YYYYMM' })
  mesAno?: string;

  @ApiPropertyOptional({
    description: 'Data de início para filtro de período no formato YYYY-MM-DD',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data de fim para filtro de período no formato YYYY-MM-DD',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

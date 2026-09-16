import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanoOperativoProcedimentoDto {
  @ApiProperty() id: number;
  @ApiProperty() coProcedimento: string;
  @ApiProperty() quantidadePactuadaMensal: number;
}

export class PlanoOperativoDto {
  @ApiProperty() id: number;
  @ApiProperty() vinculoId: number;
  @ApiPropertyOptional() aditivoId?: number;
  @ApiProperty() vigente: boolean;
  @ApiPropertyOptional() expiradoEm?: Date;
  @ApiPropertyOptional({ type: () => [PlanoOperativoProcedimentoDto] }) procedimentos?: PlanoOperativoProcedimentoDto[];
}

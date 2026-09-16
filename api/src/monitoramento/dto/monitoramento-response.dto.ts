import { ApiProperty } from '@nestjs/swagger';

export class MonitoramentoResumoDto {
  @ApiProperty({ description: 'Total físico pactuado no período' })
  totalFisicoPactuado: number;

  @ApiProperty({ description: 'Total físico realizado no período' })
  totalFisicoRealizado: number;

  @ApiProperty({ description: 'Total financeiro pactuado no período' })
  totalFinanceiroPactuado: number;

  @ApiProperty({
    description: 'Total financeiro aprovado/realizado no período',
  })
  totalFinanceiroRealizado: number;

  @ApiProperty({ description: 'Percentual de execução física' })
  percentualFisico: number;

  @ApiProperty({ description: 'Percentual de execução financeira' })
  percentualFinanceiro: number;
}

export class MonitoramentoItemAnaliticoDto {
  @ApiProperty({ description: 'Código do procedimento' })
  coProcedimento: string;

  @ApiProperty({ description: 'Nome do procedimento' })
  noProcedimento: string;

  @ApiProperty({ description: 'Código do grupo' })
  coGrupo: string;

  @ApiProperty({ description: 'Nome do grupo' })
  noGrupo: string;

  @ApiProperty({ description: 'Código do subgrupo' })
  coSubGrupo: string;

  @ApiProperty({ description: 'Nome do subgrupo' })
  noSubGrupo: string;

  @ApiProperty({ description: 'Complexidade (ex: MC, AC)' })
  complexidade: string;

  @ApiProperty({ description: 'Valor unitário aproximado' })
  vlUnitario: number;

  @ApiProperty({ description: 'Quantidade física pactuada' })
  metaFisica: number;

  @ApiProperty({ description: 'Quantidade física realizada' })
  fisicoRealizado: number;

  @ApiProperty({ description: 'Saldo físico (Realizado - Pactuado)' })
  saldoFisico: number;

  @ApiProperty({ description: 'Percentual de execução física' })
  percentualFisico: number;

  @ApiProperty({ description: 'Valor financeiro pactuado' })
  metaFinanceira: number;

  @ApiProperty({ description: 'Valor financeiro aprovado/realizado' })
  financeiroRealizado: number;

  @ApiProperty({ description: 'Saldo financeiro (Realizado - Pactuado)' })
  saldoFinanceiro: number;

  @ApiProperty({ description: 'Percentual de execução financeira' })
  percentualFinanceiro: number;

  @ApiProperty({
    description: 'Status de execução (ACIMA, ABAIXO, DENTRO, SEM_PACTO)',
    enum: ['ACIMA', 'ABAIXO', 'DENTRO', 'SEM_PACTO'],
  })
  status: string;
}

export class MonitoramentoAnaliticoDto {
  @ApiProperty({ type: [MonitoramentoItemAnaliticoDto] })
  itens: MonitoramentoItemAnaliticoDto[];
}

import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MonitoramentoService } from './monitoramento.service';
import { GetMonitoramentoFilterDto } from './dto/get-monitoramento-filter.dto';
import {
  MonitoramentoResumoDto,
  MonitoramentoAnaliticoDto,
} from './dto/monitoramento-response.dto';

@ApiTags('Monitoramento')
@Controller('monitoramento')
export class MonitoramentoController {
  constructor(private readonly monitoramentoService: MonitoramentoService) {}

  @Get(':vinculoId/resumo')
  @ApiOperation({ summary: 'Obter o resumo do monitoramento' })
  @ApiParam({ name: 'vinculoId', description: 'ID do Vínculo', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Resumo retornado com sucesso',
    type: MonitoramentoResumoDto,
  })
  async getResumo(
    @Param('vinculoId', ParseIntPipe) vinculoId: number,
    @Query() filter: GetMonitoramentoFilterDto,
  ): Promise<MonitoramentoResumoDto> {
    return this.monitoramentoService.getResumo(vinculoId, filter);
  }

  @Get(':vinculoId/analitico')
  @ApiOperation({
    summary: 'Obter os dados analíticos do monitoramento por procedimento',
  })
  @ApiParam({ name: 'vinculoId', description: 'ID do Vínculo', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Dados analíticos retornados com sucesso',
    type: MonitoramentoAnaliticoDto,
  })
  async getAnalitico(
    @Param('vinculoId', ParseIntPipe) vinculoId: number,
    @Query() filter: GetMonitoramentoFilterDto,
  ): Promise<MonitoramentoAnaliticoDto> {
    return this.monitoramentoService.getAnalitico(vinculoId, filter);
  }
}

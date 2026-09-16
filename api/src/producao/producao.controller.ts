import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProducaoService } from './producao.service';
import { 
  ProducaoResumoDto, 
  ProducaoPorPeriodoDto, 
  ProducaoResumoFilterDto, 
  ProducaoFilterDto 
} from './dto/producao.dto';

@ApiTags('Produção')
@Controller('producao')
export class ProducaoController {
  constructor(private readonly producaoService: ProducaoService) {}

  @Get('resumo-mensal')
  @ApiOperation({ summary: 'Resumo mensal de produção' })
  @ApiResponse({ status: 200, type: ProducaoResumoDto })
  async getResumoMensal(@Query() filter: ProducaoResumoFilterDto) {
    return this.producaoService.getResumoMensal(filter.competencia, filter.cnes);
  }

  @Get('por-periodo')
  @ApiOperation({ summary: 'Produção por período cruzada com metas' })
  @ApiResponse({ status: 200, type: [ProducaoPorPeriodoDto] })
  async getPorPeriodo(@Query() filter: ProducaoFilterDto) {
    return this.producaoService.getPorPeriodo(
      filter.mode,
      filter.competencia,
      filter.competenciaInicio,
      filter.competenciaFim,
      filter.mesesCount,
      filter.instituicaoId,
      filter.cnes,
      filter.vinculoId
    );
  }
}

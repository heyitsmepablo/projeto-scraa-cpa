import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlanoOperativoService } from './plano-operativo.service';
import { PlanoOperativoDto, PlanoOperativoProcedimentoDto } from './dto/plano-operativo.dto';

@ApiTags('Planos Operativos')
@Controller('planos-operativos')
export class PlanoOperativoController {
  constructor(private readonly planoOperativoService: PlanoOperativoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planos operativos' })
  @ApiResponse({ status: 200, type: [PlanoOperativoDto] })
  async findAll() {
    return this.planoOperativoService.findAll();
  }

  @Get('opcoes/vinculos')
  @ApiOperation({ summary: 'Opções de vínculos e planos' })
  async getVinculoOptions() {
    return this.planoOperativoService.getVinculoOptions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do plano operativo' })
  @ApiResponse({ status: 200, type: PlanoOperativoDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planoOperativoService.findOne(id);
  }

  @Get('vinculo/:vinculoId')
  @ApiOperation({ summary: 'Planos associados a um vínculo' })
  @ApiResponse({ status: 200, type: [PlanoOperativoDto] })
  async findByVinculo(@Param('vinculoId', ParseIntPipe) vinculoId: number) {
    return this.planoOperativoService.findByVinculo(vinculoId);
  }

  @Get('vinculo/:vinculoId/vigente')
  @ApiOperation({ summary: 'Plano operativo vigente de um vínculo' })
  @ApiResponse({ status: 200, type: PlanoOperativoDto })
  async findVigenteByVinculo(@Param('vinculoId', ParseIntPipe) vinculoId: number) {
    return this.planoOperativoService.findVigenteByVinculo(vinculoId);
  }

  @Get(':id/procedimentos')
  @ApiOperation({ summary: 'Procedimentos pactuados' })
  @ApiResponse({ status: 200, type: [PlanoOperativoProcedimentoDto] })
  async findProcedimentos(@Param('id', ParseIntPipe) id: number) {
    return this.planoOperativoService.findProcedimentos(id);
  }

  @Get(':id/resumo')
  @ApiOperation({ summary: 'Resumo do plano operativo' })
  async getResumo(@Param('id', ParseIntPipe) id: number) {
    return this.planoOperativoService.getResumo(id);
  }
}

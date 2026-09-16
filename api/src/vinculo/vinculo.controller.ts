import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VinculoService } from './vinculo.service';
import { VinculoDto, AditivoDto } from './dto/vinculo.dto';

@ApiTags('Vínculos')
@Controller('vinculos')
export class VinculoController {
  constructor(private readonly vinculoService: VinculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vínculos' })
  @ApiResponse({ status: 200, type: [VinculoDto] })
  async findAll() {
    return this.vinculoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do vínculo' })
  @ApiResponse({ status: 200, type: VinculoDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vinculoService.findOne(id);
  }

  @Get('instituicao/:instituicaoId')
  @ApiOperation({ summary: 'Vínculos de uma instituição' })
  @ApiResponse({ status: 200, type: [VinculoDto] })
  async findByInstituicao(@Param('instituicaoId', ParseIntPipe) instituicaoId: number) {
    return this.vinculoService.findByInstituicao(instituicaoId);
  }

  @Get(':id/aditivos')
  @ApiOperation({ summary: 'Aditivos do vínculo' })
  @ApiResponse({ status: 200, type: [AditivoDto] })
  async findAditivos(@Param('id', ParseIntPipe) id: number) {
    return this.vinculoService.findAditivos(id);
  }
}

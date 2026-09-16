import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InstituicaoService } from './instituicao.service';
import { InstituicaoDto } from './dto/instituicao.dto';
import { TipoInstituicao } from '../../generated/prisma/client';

@ApiTags('Instituições')
@Controller('instituicoes')
export class InstituicaoController {
  constructor(private readonly instituicaoService: InstituicaoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as instituições' })
  @ApiQuery({ name: 'cnes', required: false })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoInstituicao })
  @ApiResponse({ status: 200, type: [InstituicaoDto] })
  async findAll(@Query('cnes') cnes?: string, @Query('tipo') tipo?: TipoInstituicao) {
    return this.instituicaoService.findAll(cnes, tipo);
  }

  @Get('cnes/:cnes')
  @ApiOperation({ summary: 'Buscar instituição por CNES' })
  @ApiResponse({ status: 200, type: InstituicaoDto })
  async findByCnes(@Param('cnes') cnes: string) {
    return this.instituicaoService.findByCnes(cnes);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar instituição por ID' })
  @ApiResponse({ status: 200, type: InstituicaoDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instituicaoService.findOne(id);
  }
}

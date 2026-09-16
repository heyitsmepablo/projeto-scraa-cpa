import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SigtapService } from './sigtap.service';
import { SubgruposFilterDto, FormasOrganizacaoFilterDto, ProcedimentosFilterDto } from './dto/sigtap-filters.dto';

@ApiTags('SIGTAP (Dicionários)')
@Controller('api/sigtap')
export class SigtapController {
  constructor(private readonly sigtapService: SigtapService) {}

  @Get('grupos')
  @ApiOperation({ summary: 'Listar Grupos do SIGTAP' })
  @ApiResponse({ status: 200, description: 'Lista de Grupos retornada com sucesso' })
  getGrupos() {
    return this.sigtapService.getGrupos();
  }

  @Get('subgrupos')
  @ApiOperation({ summary: 'Listar Subgrupos do SIGTAP' })
  @ApiResponse({ status: 200, description: 'Lista de Subgrupos retornada com sucesso' })
  getSubgrupos(@Query() filters: SubgruposFilterDto) {
    return this.sigtapService.getSubgrupos(filters);
  }

  @Get('formas-organizacao')
  @ApiOperation({ summary: 'Listar Formas de Organização do SIGTAP' })
  @ApiResponse({ status: 200, description: 'Lista de Formas de Organização retornada com sucesso' })
  getFormasOrganizacao(@Query() filters: FormasOrganizacaoFilterDto) {
    return this.sigtapService.getFormasOrganizacao(filters);
  }

  @Get('procedimentos')
  @ApiOperation({ summary: 'Listar Autocomplete de Procedimentos do SIGTAP' })
  @ApiResponse({ status: 200, description: 'Lista de Procedimentos retornada com sucesso' })
  getProcedimentos(@Query() filters: ProcedimentosFilterDto) {
    return this.sigtapService.getProcedimentos(filters);
  }
}

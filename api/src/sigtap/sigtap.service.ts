import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubgruposFilterDto, FormasOrganizacaoFilterDto, ProcedimentosFilterDto } from './dto/sigtap-filters.dto';

@Injectable()
export class SigtapService {
  // In-memory cache for static domain tables
  private cache: {
    grupos: any[] | null;
    subgrupos: any[] | null;
    formasOrganizacao: any[] | null;
  } = {
    grupos: null,
    subgrupos: null,
    formasOrganizacao: null,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getGrupos() {
    if (this.cache.grupos) {
      return this.cache.grupos;
    }

    const grupos = await this.prisma.sigtapGrupo.findMany({
      select: {
        coGrupo: true,
        noGrupo: true,
      },
      distinct: ['coGrupo'],
      orderBy: { coGrupo: 'asc' },
    });

    this.cache.grupos = grupos;
    return grupos;
  }

  async getSubgrupos(filters: SubgruposFilterDto) {
    // Return all if no filters, but cache the 'all' query to speed up filter in-memory if desired
    if (!this.cache.subgrupos) {
      this.cache.subgrupos = await this.prisma.sigtapSubGrupo.findMany({
        select: {
          coGrupo: true,
          coSubGrupo: true,
          noSubGrupo: true,
        },
        distinct: ['coGrupo', 'coSubGrupo'],
        orderBy: [{ coGrupo: 'asc' }, { coSubGrupo: 'asc' }],
      });
    }

    let result = this.cache.subgrupos || [];
    if (filters.grupoCodigo) {
      result = result.filter((s: any) => s.coGrupo === filters.grupoCodigo);
    }
    return result;
  }

  async getFormasOrganizacao(filters: FormasOrganizacaoFilterDto) {
    if (!this.cache.formasOrganizacao) {
      this.cache.formasOrganizacao = await this.prisma.sigtapFormaOrganizacao.findMany({
        select: {
          coGrupo: true,
          coSubGrupo: true,
          coFormaOrganizacao: true,
          noFormaOrganizacao: true,
        },
        distinct: ['coGrupo', 'coSubGrupo', 'coFormaOrganizacao'],
        orderBy: [{ coGrupo: 'asc' }, { coSubGrupo: 'asc' }, { coFormaOrganizacao: 'asc' }],
      });
    }

    let result = this.cache.formasOrganizacao || [];
    if (filters.grupoCodigo) {
      result = result.filter((f: any) => f.coGrupo === filters.grupoCodigo);
    }
    if (filters.subgrupoCodigo) {
      result = result.filter((f: any) => f.coSubGrupo === filters.subgrupoCodigo);
    }
    return result;
  }

  async getLatestCompetencia(): Promise<string> {
    const latest = await this.prisma.sigtapImportacao.findFirst({
      where: { status: 'SUCESSO' },
      orderBy: { competencia: 'desc' },
      select: { competencia: true },
    });
    
    // Fallback in case there is no import in the database yet
    return latest?.competencia || '';
  }

  async getProcedimentos(filters: ProcedimentosFilterDto) {
    const { busca, complexidade, limit = 50 } = filters;
    let { competencia } = filters;

    if (!competencia) {
      competencia = await this.getLatestCompetencia();
    }

    const where: any = {};

    if (competencia) {
      where.dtCompetencia = competencia;
    }

    if (complexidade) {
      where.tpComplexidade = complexidade;
    }

    if (busca) {
      where.OR = [
        {
          coProcedimento: {
            contains: busca,
            mode: 'insensitive',
          },
        },
        {
          noProcedimento: {
            contains: busca,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.sigtapProcedimento.findMany({
      where,
      take: limit,
      select: {
        coProcedimento: true,
        noProcedimento: true,
        tpComplexidade: true,
        dtCompetencia: true,
      },
      orderBy: {
        noProcedimento: 'asc',
      },
    });
  }
}

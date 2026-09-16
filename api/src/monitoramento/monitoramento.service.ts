import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMonitoramentoFilterDto } from './dto/get-monitoramento-filter.dto';
import {
  MonitoramentoResumoDto,
  MonitoramentoAnaliticoDto,
  MonitoramentoItemAnaliticoDto,
} from './dto/monitoramento-response.dto';

@Injectable()
export class MonitoramentoService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumo(
    vinculoId: number,
    filter: GetMonitoramentoFilterDto,
  ): Promise<MonitoramentoResumoDto> {
    const analitico = await this.getAnalitico(vinculoId, filter);

    const resumo = new MonitoramentoResumoDto();
    resumo.totalFisicoPactuado = analitico.itens.reduce(
      (acc, item) => acc + item.metaFisica,
      0,
    );
    resumo.totalFisicoRealizado = analitico.itens.reduce(
      (acc, item) => acc + item.fisicoRealizado,
      0,
    );
    resumo.totalFinanceiroPactuado = analitico.itens.reduce(
      (acc, item) => acc + item.metaFinanceira,
      0,
    );
    resumo.totalFinanceiroRealizado = analitico.itens.reduce(
      (acc, item) => acc + item.financeiroRealizado,
      0,
    );

    resumo.percentualFisico =
      resumo.totalFisicoPactuado > 0
        ? (resumo.totalFisicoRealizado / resumo.totalFisicoPactuado) * 100
        : 0;

    resumo.percentualFinanceiro =
      resumo.totalFinanceiroPactuado > 0
        ? (resumo.totalFinanceiroRealizado / resumo.totalFinanceiroPactuado) *
          100
        : 0;

    return resumo;
  }

  async getAnalitico(
    vinculoId: number,
    filter: GetMonitoramentoFilterDto,
  ): Promise<MonitoramentoAnaliticoDto> {
    const planoOperativo = await this.prisma.planoOperativo.findFirst({
      where: { vinculoId, vigente: true },
      include: {
        vinculo: { include: { instituicao: true } },
        procedimentos: { include: { procedimento: true } },
      },
    });

    if (!planoOperativo) {
      throw new NotFoundException(
        `Nenhum plano operativo vigente encontrado para o vínculo ${vinculoId}`,
      );
    }

    const cnes = planoOperativo.vinculo.instituicao.cnes;

    // Identifica competências baseadas no filtro
    let competencias: string[] = [];
    let mesesCount = 1;

    if (filter.mesAno) {
      competencias.push(filter.mesAno);
    } else if (filter.dataInicio && filter.dataFim) {
      // Simplificação: apenas pega a competência do mes/ano de início e conta a diferença de meses
      const start = new Date(filter.dataInicio);
      const end = new Date(filter.dataFim);
      if (end < start)
        throw new BadRequestException(
          'dataFim não pode ser menor que dataInicio',
        );

      mesesCount =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

      let curr = new Date(start);
      while (
        curr <= end ||
        (curr.getFullYear() === end.getFullYear() &&
          curr.getMonth() === end.getMonth())
      ) {
        const comp = `${curr.getFullYear()}${String(curr.getMonth() + 1).padStart(2, '0')}`;
        if (!competencias.includes(comp)) competencias.push(comp);
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      // Default: mês atual
      const now = new Date();
      competencias.push(
        `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
      );
    }

    // Buscando produção
    const siaProducao = await this.prisma.datasusSiaTbPa.findMany({
      where: { paCoduni: cnes, paCmp: { in: competencias } },
    });

    const sihProducao = await Promise.all(
      competencias.map((comp) => {
        return this.prisma.datasusSihTbRd.findMany({
          where: {
            cnes,
            anoCmpt: comp.substring(0, 4),
            mesCmpt: comp.substring(4, 6),
          },
        });
      }),
    ).then((results) => results.flat());

    const analitico = new MonitoramentoAnaliticoDto();
    analitico.itens = [];

    // Map para acumular produção por procedimento
    const producaoMap = new Map<
      string,
      { fisico: number; financeiro: number }
    >();

    siaProducao.forEach((pa) => {
      const current = producaoMap.get(pa.paProcId) || {
        fisico: 0,
        financeiro: 0,
      };
      current.fisico += Number(pa.paQtdapr);
      current.financeiro += Number(pa.paValapr);
      producaoMap.set(pa.paProcId, current);
    });

    sihProducao.forEach((rd) => {
      const current = producaoMap.get(rd.procRea) || {
        fisico: 0,
        financeiro: 0,
      };
      current.fisico += 1; // Assuming 1 per AIH
      current.financeiro += Number(rd.valTot);
      producaoMap.set(rd.procRea, current);
    });

    // Fetch all grupos and subgrupos to map names efficiently
    const grupos = await this.prisma.sigtapGrupo.findMany();
    const subGrupos = await this.prisma.sigtapSubGrupo.findMany();

    const grupoMap = new Map(grupos.map((g) => [g.coGrupo, g.noGrupo]));
    const subGrupoMap = new Map(
      subGrupos.map((sg) => [`${sg.coGrupo}${sg.coSubGrupo}`, sg.noSubGrupo]),
    );

    // Construindo o resultado
    for (const pacto of planoOperativo.procedimentos) {
      const proc = pacto.procedimento;
      const produzido = producaoMap.get(pacto.coProcedimento) || {
        fisico: 0,
        financeiro: 0,
      };

      const metaFisica = pacto.quantidadePactuadaMensal * mesesCount;
      const vlUnitario =
        Number(proc.vlSa) + Number(proc.vlSh) + Number(proc.vlSp);
      const metaFinanceira = metaFisica * vlUnitario;

      const coGrupo = pacto.coProcedimento.substring(0, 2);
      const coSubGrupo = pacto.coProcedimento.substring(2, 4);

      const item = new MonitoramentoItemAnaliticoDto();
      item.coProcedimento = pacto.coProcedimento;
      item.noProcedimento = proc.noProcedimento;

      item.coGrupo = coGrupo;
      item.noGrupo = grupoMap.get(coGrupo) || `Grupo ${coGrupo}`;
      item.coSubGrupo = coSubGrupo;
      item.noSubGrupo =
        subGrupoMap.get(`${coGrupo}${coSubGrupo}`) || `Subgrupo ${coSubGrupo}`;
      item.complexidade = proc.tpComplexidade;
      item.vlUnitario = vlUnitario;

      item.metaFisica = metaFisica;
      item.fisicoRealizado = produzido.fisico;
      item.saldoFisico = item.fisicoRealizado - item.metaFisica;
      item.percentualFisico =
        item.metaFisica > 0
          ? (item.fisicoRealizado / item.metaFisica) * 100
          : 0;

      item.metaFinanceira = metaFinanceira;
      item.financeiroRealizado = produzido.financeiro;
      item.saldoFinanceiro = item.financeiroRealizado - item.metaFinanceira;
      item.percentualFinanceiro =
        item.metaFinanceira > 0
          ? (item.financeiroRealizado / item.metaFinanceira) * 100
          : 0;

      if (item.percentualFisico === 0 && item.metaFisica === 0)
        item.status = 'SEM_PACTO';
      else if (item.percentualFisico < 90) item.status = 'ABAIXO';
      else if (item.percentualFisico > 110) item.status = 'ACIMA';
      else item.status = 'DENTRO';

      analitico.itens.push(item);
    }

    return analitico;
  }
}

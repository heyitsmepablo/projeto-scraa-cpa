import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumoMensal(competencia: string, cnes?: string) {
    const compSafe = competencia || '';
    const ano = compSafe.length >= 4 ? compSafe.substring(0, 4) : '';
    const mes = compSafe.length >= 6 ? compSafe.substring(4, 6) : '';
    
    const siaTotal = await this.prisma.datasusSiaTbPa.aggregate({
      where: {
        paCmp: compSafe,
        ...(cnes && { paCoduni: cnes }),
      },
      _sum: {
        paQtdapr: true,
        paValapr: true,
      },
    });

    let sihTotal: any = { _sum: { qtDiarias: null, valTot: null } };
    if (ano) {
      sihTotal = await this.prisma.datasusSihTbRd.aggregate({
        where: {
          anoCmpt: ano,
          mesCmpt: mes,
          ...(cnes && { cnes }),
        },
        _sum: {
          qtDiarias: true,
          valTot: true,
        },
      });
    }

    return {
      competencia: compSafe,
      cnes,
      totalAprovado: Number(siaTotal._sum.paValapr || 0) + Number(sihTotal._sum.valTot || 0),
      totalProduzido: Number(siaTotal._sum.paQtdapr || 0) + Number(sihTotal._sum.qtDiarias || 0),
    };
  }

  async getPorPeriodo(
    mode: string = '',
    competencia: string = '',
    competenciaInicio: string = '',
    competenciaFim: string = '',
    mesesCount: number = 1,
    instituicaoId: number = 0,
    cnes: string = '',
    vinculoId: number = 0
  ) {
    const plano = await this.prisma.planoOperativo.findFirst({
      where: { vinculoId, vigente: true },
      include: {
        procedimentos: {
          include: { procedimento: true }
        }
      }
    });

    const results = [];
    if (plano && plano.procedimentos && plano.procedimentos.length > 0) {
        const procedimentosIds = plano.procedimentos.map(p => p.coProcedimento);
        const compInicio = competenciaInicio || competencia || '';
        const compFim = competenciaFim || competencia || '';
        
        const siaGrouped = await this.prisma.datasusSiaTbPa.groupBy({
            by: ['paProcId'],
            where: {
                paProcId: { in: procedimentosIds },
                ...(cnes && { paCoduni: cnes }),
                ...(compInicio && compFim && { paCmp: { gte: compInicio, lte: compFim } })
            },
            _sum: { paQtdapr: true, paValapr: true }
        });
        
        const siaMap = new Map(siaGrouped.map(item => [item.paProcId, item._sum]));
        
        const anoInicio = compInicio.length >= 4 ? compInicio.substring(0,4) : '';
        const anoFim = compFim.length >= 4 ? compFim.substring(0,4) : '';
        
        let sihMap = new Map();
        if (anoInicio && anoFim) {
            const sihGrouped = await this.prisma.datasusSihTbRd.groupBy({
                by: ['procRea'],
                where: {
                    procRea: { in: procedimentosIds },
                    ...(cnes && { cnes }),
                    anoCmpt: { gte: anoInicio, lte: anoFim }
                },
                _sum: { qtDiarias: true, valTot: true }
            });
            sihMap = new Map(sihGrouped.map(item => [item.procRea, item._sum]));
        }

        for (const proc of plano.procedimentos) {
            const coProcedimento = proc.coProcedimento;
            const noProcedimento = proc.procedimento?.noProcedimento || '';
            const val = Number(proc.procedimento?.vlSa || 0) + Number(proc.procedimento?.vlSh || 0) + Number(proc.procedimento?.vlSp || 0);
            
            const siaSum = siaMap.get(coProcedimento) || { paQtdapr: 0, paValapr: 0 };
            const sihSum = sihMap.get(coProcedimento) || { qtDiarias: 0, valTot: 0 };
            
            results.push({
                coProcedimento,
                noProcedimento,
                quantidadePactuada: proc.quantidadePactuadaMensal * (mesesCount || 1),
                valorPactuado: Number((proc.quantidadePactuadaMensal * val * (mesesCount || 1)).toFixed(2)),
                quantidadeProduzida: Number(siaSum.paQtdapr || 0) + Number(sihSum.qtDiarias || 0),
                valorProduzido: Number((Number(siaSum.paValapr || 0) + Number(sihSum.valTot || 0)).toFixed(2))
            });
        }
    }

    return results;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanoOperativoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.planoOperativo.findMany({
      where: { deletadoEm: null },
      include: { vinculo: true, aditivo: true },
    });
  }

  async findOne(id: number) {
    const plano = await this.prisma.planoOperativo.findUnique({
      where: { id },
      include: { vinculo: true, aditivo: true },
    });
    if (!plano) throw new NotFoundException(`Plano Operativo ${id} não encontrado`);
    return plano;
  }

  async findByVinculo(vinculoId: number) {
    return this.prisma.planoOperativo.findMany({
      where: { vinculoId, deletadoEm: null },
      include: { aditivo: true },
    });
  }

  async findVigenteByVinculo(vinculoId: number) {
    const plano = await this.prisma.planoOperativo.findFirst({
      where: { vinculoId, vigente: true, deletadoEm: null },
      include: { aditivo: true },
    });
    if (!plano) throw new NotFoundException(`Plano Operativo vigente para o Vínculo ${vinculoId} não encontrado`);
    return plano;
  }

  async findProcedimentos(id: number) {
    return this.prisma.planoOperativoProcedimento.findMany({
      where: { planoOperativoId: id, deletadoEm: null },
      include: { procedimento: true },
    });
  }

  async getResumo(id: number) {
    const procedimentos = await this.findProcedimentos(id);
    const totalProcedimentos = procedimentos.length;
    const totalPactuado = procedimentos.reduce((acc, curr) => acc + (Number(curr.quantidadePactuadaMensal) || 0), 0);
    const valorFinanceiroPrevisto = procedimentos.reduce((acc, curr) => {
        const valSa = Number(curr.procedimento?.vlSa) || 0;
        const valSh = Number(curr.procedimento?.vlSh) || 0;
        const valSp = Number(curr.procedimento?.vlSp) || 0;
        const val = valSa + valSh + valSp;
        return acc + ((Number(curr.quantidadePactuadaMensal) || 0) * val);
    }, 0);
    const distribuicao = { bc: 0, mc: 0, ac: 0 };
    for (const proc of procedimentos) {
      const complexidade = proc.procedimento?.tpComplexidade?.toUpperCase();
      const qtd = Number(proc.quantidadePactuadaMensal) || 0;
      if (complexidade === 'BC') distribuicao.bc += qtd;
      else if (complexidade === 'MC') distribuicao.mc += qtd;
      else if (complexidade === 'AC') distribuicao.ac += qtd;
    }

    return {
      planoOperativoId: id,
      totalProcedimentos,
      metaFisicaTotal: totalPactuado,
      distribuicaoComplexidade: distribuicao,
      totalPactuado,
      valorFinanceiroPrevisto: Number(valorFinanceiroPrevisto.toFixed(2)),
    };
  }

  async getVinculoOptions() {
    const planos = await this.prisma.planoOperativo.findMany({
      where: { deletadoEm: null },
      include: {
        vinculo: {
          include: {
            instituicao: true
          }
        }
      }
    });
    
    return planos.map(p => ({
      planoOperativoId: p.id,
      vinculoId: p.vinculoId,
      instituicaoNome: p.vinculo?.instituicao?.nome ?? 'Desconhecida',
      numeroVinculo: p.vinculo?.numero ?? `Vínculo #${p.vinculoId}`,
      tipoVinculo: p.vinculo?.tipoVinculo ?? 'Desconhecido',
      vigente: p.vigente,
      label: `${p.vinculo?.instituicao?.nome ?? 'Instituição'} - ${p.vinculo?.numero ?? 'Contrato'} ${p.vigente ? '(Vigente)' : '(Inativo)'}`
    }));
  }
}

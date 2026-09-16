import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VinculoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vinculo.findMany({
      where: { deletadoEm: null },
      include: { instituicao: true, aditivos: true },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findOne(id: number) {
    const vinculo = await this.prisma.vinculo.findUnique({
      where: { id },
      include: { instituicao: true, aditivos: true },
    });
    if (!vinculo) throw new NotFoundException(`Vínculo ${id} não encontrado`);
    return vinculo;
  }

  async findByInstituicao(instituicaoId: number) {
    return this.prisma.vinculo.findMany({
      where: { instituicaoId, deletadoEm: null },
      include: { aditivos: true },
      orderBy: { dataInicio: 'desc' },
    });
  }

  async findAditivos(vinculoId: number) {
    return this.prisma.aditivo.findMany({
      where: { vinculoId, deletadoEm: null },
      orderBy: { dataInicio: 'desc' },
    });
  }
}

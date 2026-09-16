import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoInstituicao } from '../../generated/prisma/client';

@Injectable()
export class InstituicaoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(cnes?: string, tipo?: TipoInstituicao) {
    return this.prisma.instituicao.findMany({
      where: {
        ...(cnes && { cnes }),
        ...(tipo && { tipoInstituicao: tipo }),
        deletadoEm: null,
      },
    });
  }

  async findOne(id: number) {
    const instituicao = await this.prisma.instituicao.findUnique({
      where: { id },
    });
    if (!instituicao) {
      throw new NotFoundException(`Instituição com ID ${id} não encontrada`);
    }
    return instituicao;
  }

  async findByCnes(cnes: string) {
    const instituicao = await this.prisma.instituicao.findFirst({
      where: { cnes, deletadoEm: null },
    });
    if (!instituicao) {
      throw new NotFoundException(`Instituição com CNES ${cnes} não encontrada`);
    }
    return instituicao;
  }
}

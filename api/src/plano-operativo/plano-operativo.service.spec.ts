import { Test, TestingModule } from '@nestjs/testing';
import { PlanoOperativoService } from './plano-operativo.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  planoOperativo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  planoOperativoProcedimento: {
    findMany: jest.fn(),
  },
};

describe('PlanoOperativoService', () => {
  let service: PlanoOperativoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanoOperativoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PlanoOperativoService>(PlanoOperativoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of planos operativos', async () => {
      const mockResult = [{ id: 1 }];
      mockPrismaService.planoOperativo.findMany.mockResolvedValue(mockResult);

      const result = await service.findAll();
      expect(result).toEqual(mockResult);
      expect(prisma.planoOperativo.findMany).toHaveBeenCalledWith({
        where: { deletadoEm: null },
        include: { vinculo: true, aditivo: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a plano operativo if found', async () => {
      const mockResult = { id: 1 };
      mockPrismaService.planoOperativo.findUnique.mockResolvedValue(mockResult);

      const result = await service.findOne(1);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.planoOperativo.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByVinculo', () => {
    it('should return planos operativos by vinculo', async () => {
      const mockResult = [{ id: 1 }];
      mockPrismaService.planoOperativo.findMany.mockResolvedValue(mockResult);

      const result = await service.findByVinculo(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findVigenteByVinculo', () => {
    it('should return the vigente plano operativo if found', async () => {
      const mockResult = { id: 1, vigente: true };
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(mockResult);

      const result = await service.findVigenteByVinculo(1);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(null);

      await expect(service.findVigenteByVinculo(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getResumo', () => {
    it('should return a summary of the plano operativo', async () => {
      const mockProcedimentos = [
        {
          quantidadePactuadaMensal: 10,
          procedimento: { vlSa: 10, vlSh: 20, vlSp: 30, tpComplexidade: 'MC' },
        },
        {
          quantidadePactuadaMensal: 5,
          procedimento: { vlSa: null, vlSh: null, vlSp: null, tpComplexidade: 'BC' },
        },
      ];
      mockPrismaService.planoOperativoProcedimento.findMany.mockResolvedValue(
        mockProcedimentos,
      );

      const result = await service.getResumo(1);
      expect(result).toEqual({
        planoOperativoId: 1,
        totalProcedimentos: 2,
        metaFisicaTotal: 15,
        distribuicaoComplexidade: {
          bc: 5,
          mc: 10,
          ac: 0,
        },
        totalPactuado: 15,
        valorFinanceiroPrevisto: 600,
      });
    });
  });

  describe('getVinculoOptions', () => {
    it('should return mapped vinculo options', async () => {
      const mockPlanos = [
        {
          id: 1,
          vinculoId: 10,
          vigente: true,
          vinculo: {
            numero: '123/2024',
            tipoVinculo: 'CONTRATO',
            instituicao: { nome: 'Hospital Central' },
          },
        },
      ];
      mockPrismaService.planoOperativo.findMany.mockResolvedValue(mockPlanos);

      const result = await service.getVinculoOptions();
      expect(result).toEqual([
        {
          planoOperativoId: 1,
          vinculoId: 10,
          instituicaoNome: 'Hospital Central',
          numeroVinculo: '123/2024',
          tipoVinculo: 'CONTRATO',
          vigente: true,
          label: 'Hospital Central - 123/2024 (Vigente)',
        },
      ]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProducaoService } from './producao.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  datasusSiaTbPa: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  datasusSihTbRd: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  planoOperativo: {
    findFirst: jest.fn(),
  },
};

describe('ProducaoService', () => {
  let service: ProducaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducaoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProducaoService>(ProducaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getResumoMensal', () => {
    it('should calculate the monthly summary correctly', async () => {
      mockPrismaService.datasusSiaTbPa.aggregate.mockResolvedValue({
        _sum: { paQtdapr: 100, paValapr: 500 },
      });
      mockPrismaService.datasusSihTbRd.aggregate.mockResolvedValue({
        _sum: { qtDiarias: 50, valTot: 1000 },
      });

      const result = await service.getResumoMensal('202301', '1234567');
      expect(result).toEqual({
        competencia: '202301',
        cnes: '1234567',
        totalAprovado: 1500,
        totalProduzido: 150,
      });
    });

    it('should handle null values from aggregation safely', async () => {
      mockPrismaService.datasusSiaTbPa.aggregate.mockResolvedValue({
        _sum: { paQtdapr: null, paValapr: null },
      });
      mockPrismaService.datasusSihTbRd.aggregate.mockResolvedValue({
        _sum: { qtDiarias: null, valTot: null },
      });

      const result = await service.getResumoMensal('202301');
      expect(result.totalAprovado).toBe(0);
      expect(result.totalProduzido).toBe(0);
    });
  });

  describe('getPorPeriodo', () => {
    it('should return results correctly based on the plano operativo', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue({
        procedimentos: [
          {
            coProcedimento: '010101',
            procedimento: { noProcedimento: 'Teste', vlSa: 10, vlSh: 0, vlSp: 0 },
            quantidadePactuadaMensal: 10,
          }
        ]
      });

      mockPrismaService.datasusSiaTbPa.groupBy.mockResolvedValue([
        { paProcId: '010101', _sum: { paQtdapr: 5, paValapr: 50 } },
      ]);
      mockPrismaService.datasusSihTbRd.groupBy.mockResolvedValue([
        { procRea: '010101', _sum: { qtDiarias: 0, valTot: 0 } },
      ]);

      const result = await service.getPorPeriodo(
        'mode', '202301', '202301', '202303', 3, 1, '1234567', 1
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        coProcedimento: '010101',
        noProcedimento: 'Teste',
        quantidadePactuada: 30, // 10 * 3
        valorPactuado: 300, // 10 * 10 * 3
        quantidadeProduzida: 5,
        valorProduzido: 50,
      });
    });

    it('should return empty array if no plano is found', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(null);

      const result = await service.getPorPeriodo(
        'mode', '202301', '202301', '202303', 3, 1, '1234567', 1
      );

      expect(result).toEqual([]);
    });
  });
});

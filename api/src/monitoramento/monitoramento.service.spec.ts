import { Test, TestingModule } from '@nestjs/testing';
import { MonitoramentoService } from './monitoramento.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => {
  return {
    PrismaService: class {},
  };
});

import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MonitoramentoService', () => {
  let service: MonitoramentoService;

  const mockPrismaService = {
    planoOperativo: {
      findFirst: jest.fn(),
    },
    datasusSiaTbPa: {
      findMany: jest.fn(),
    },
    datasusSihTbRd: {
      findMany: jest.fn(),
    },
    sigtapGrupo: {
      findMany: jest.fn(),
    },
    sigtapSubGrupo: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoramentoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MonitoramentoService>(MonitoramentoService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalitico e getResumo', () => {
    const defaultPlanoOperativo = {
      vinculo: {
        instituicao: {
          cnes: '1234567',
        },
      },
      procedimentos: [
        {
          coProcedimento: '0301010072',
          quantidadePactuadaMensal: 100,
          procedimento: {
            noProcedimento: 'Consulta Médica',
            vlSa: 10,
            vlSh: 0,
            vlSp: 0,
            tpComplexidade: 'MC',
          },
        },
        {
          coProcedimento: '0401010015',
          quantidadePactuadaMensal: 50,
          procedimento: {
            noProcedimento: 'Cirurgia',
            vlSa: 0,
            vlSh: 100,
            vlSp: 50,
            tpComplexidade: 'AC',
          },
        },
      ],
    };

    it('deve lançar NotFoundException quando nenhum plano vigente for encontrado', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(null);

      await expect(service.getAnalitico(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve calcular corretamente analitico e resumo com dados SIA e SIH', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(
        defaultPlanoOperativo,
      );
      
      mockPrismaService.datasusSiaTbPa.findMany.mockResolvedValue([
        {
          paProcId: '0301010072',
          paQtdapr: 80,
          paValapr: 800,
        },
      ]);
      
      mockPrismaService.datasusSihTbRd.findMany.mockResolvedValue([
        {
          procRea: '0401010015',
          valTot: 150,
        },
        {
          procRea: '0401010015',
          valTot: 150,
        },
      ]);
      
      mockPrismaService.sigtapGrupo.findMany.mockResolvedValue([
        { coGrupo: '03', noGrupo: 'Procedimentos Clínicos' },
        { coGrupo: '04', noGrupo: 'Procedimentos Cirúrgicos' },
      ]);
      
      mockPrismaService.sigtapSubGrupo.findMany.mockResolvedValue([
        { coGrupo: '03', coSubGrupo: '01', noSubGrupo: 'Consultas' },
        { coGrupo: '04', coSubGrupo: '01', noSubGrupo: 'Pequenas Cirurgias' },
      ]);

      const resumo = await service.getResumo(1, { mesAno: '202310' });
      
      expect(resumo.totalFisicoPactuado).toBe(150);
      expect(resumo.totalFisicoRealizado).toBe(82);
      expect(resumo.totalFinanceiroPactuado).toBe(8500);
      expect(resumo.totalFinanceiroRealizado).toBe(1100);
      
      const analitico = await service.getAnalitico(1, { mesAno: '202310' });
      
      expect(analitico.itens.length).toBe(2);
      
      const itemSia = analitico.itens.find(i => i.coProcedimento === '0301010072');
      expect(itemSia).toBeDefined();
      expect(itemSia?.fisicoRealizado).toBe(80);
      expect(itemSia?.financeiroRealizado).toBe(800);
      expect(itemSia?.status).toBe('ABAIXO');
      
      const itemSih = analitico.itens.find(i => i.coProcedimento === '0401010015');
      expect(itemSih).toBeDefined();
      expect(itemSih?.fisicoRealizado).toBe(2);
      expect(itemSih?.financeiroRealizado).toBe(300);
      expect(itemSih?.status).toBe('ABAIXO');
    });

    it('deve realizar cálculo proporcional multiplicando pelo número de meses quando dataInicio e dataFim são fornecidos', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(
        defaultPlanoOperativo,
      );
      
      mockPrismaService.datasusSiaTbPa.findMany.mockResolvedValue([]);
      mockPrismaService.datasusSihTbRd.findMany.mockResolvedValue([]);
      mockPrismaService.sigtapGrupo.findMany.mockResolvedValue([]);
      mockPrismaService.sigtapSubGrupo.findMany.mockResolvedValue([]);

      const dataInicio = '2023-01-02';
      const dataFim = '2023-03-02';
      
      const analitico = await service.getAnalitico(1, { dataInicio, dataFim });
      
      expect(analitico.itens.length).toBe(2);
      
      const itemSia = analitico.itens.find(i => i.coProcedimento === '0301010072');
      expect(itemSia?.metaFisica).toBe(300); // 100 * 3
      expect(itemSia?.metaFinanceira).toBe(3000); // 300 * 10
      
      const itemSih = analitico.itens.find(i => i.coProcedimento === '0401010015');
      expect(itemSih?.metaFisica).toBe(150); // 50 * 3
      expect(itemSih?.metaFinanceira).toBe(22500); // 150 * 150
    });
    
    it('deve lançar erro se dataFim for menor que dataInicio', async () => {
      mockPrismaService.planoOperativo.findFirst.mockResolvedValue(
        defaultPlanoOperativo,
      );
      
      const dataInicio = '2023-03-31';
      const dataFim = '2023-01-01';
      
      await expect(service.getAnalitico(1, { dataInicio, dataFim })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SigtapService } from './sigtap.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SigtapService', () => {
  let service: SigtapService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sigtapGrupo: {
      findMany: jest.fn(),
    },
    sigtapSubGrupo: {
      findMany: jest.fn(),
    },
    sigtapFormaOrganizacao: {
      findMany: jest.fn(),
    },
    sigtapProcedimento: {
      findMany: jest.fn(),
    },
    sigtapImportacao: {
      findFirst: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SigtapService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SigtapService>(SigtapService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // clear internal cache
    (service as any).cache = { grupos: null, subgrupos: null, formasOrganizacao: null };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGrupos', () => {
    it('should return from db and cache it', async () => {
      const mockResult = [{ coGrupo: '01', noGrupo: 'Grupo 1' }];
      mockPrismaService.sigtapGrupo.findMany.mockResolvedValueOnce(mockResult);

      const result = await service.getGrupos();
      expect(result).toEqual(mockResult);
      expect(mockPrismaService.sigtapGrupo.findMany).toHaveBeenCalledTimes(1);

      // Call again to check cache
      const cachedResult = await service.getGrupos();
      expect(cachedResult).toEqual(mockResult);
      expect(mockPrismaService.sigtapGrupo.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSubgrupos', () => {
    it('should return from db and filter by grupoCodigo', async () => {
      const mockResult = [
        { coGrupo: '01', coSubGrupo: '01', noSubGrupo: 'Subgrupo 1' },
        { coGrupo: '02', coSubGrupo: '01', noSubGrupo: 'Subgrupo 2' },
      ];
      mockPrismaService.sigtapSubGrupo.findMany.mockResolvedValueOnce(mockResult);

      const result = await service.getSubgrupos({ grupoCodigo: '01' });
      expect(result).toEqual([mockResult[0]]);
      expect(mockPrismaService.sigtapSubGrupo.findMany).toHaveBeenCalledTimes(1);
    });
    
    it('should return all if no filter', async () => {
      const mockResult = [
        { coGrupo: '01', coSubGrupo: '01', noSubGrupo: 'Subgrupo 1' },
      ];
      mockPrismaService.sigtapSubGrupo.findMany.mockResolvedValueOnce(mockResult);

      const result = await service.getSubgrupos({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('getFormasOrganizacao', () => {
    it('should filter by grupoCodigo and subgrupoCodigo', async () => {
      const mockResult = [
        { coGrupo: '01', coSubGrupo: '01', coFormaOrganizacao: '01', noFormaOrganizacao: 'Forma 1' },
        { coGrupo: '01', coSubGrupo: '02', coFormaOrganizacao: '01', noFormaOrganizacao: 'Forma 2' },
      ];
      mockPrismaService.sigtapFormaOrganizacao.findMany.mockResolvedValueOnce(mockResult);

      const result = await service.getFormasOrganizacao({ grupoCodigo: '01', subgrupoCodigo: '02' });
      expect(result).toEqual([mockResult[1]]);
      expect(mockPrismaService.sigtapFormaOrganizacao.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProcedimentos', () => {
    it('should fallback to latest competencia if not provided', async () => {
      mockPrismaService.sigtapImportacao.findFirst.mockResolvedValueOnce({ competencia: '202310' });
      mockPrismaService.sigtapProcedimento.findMany.mockResolvedValueOnce([]);

      await service.getProcedimentos({});
      
      expect(mockPrismaService.sigtapImportacao.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.sigtapProcedimento.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ dtCompetencia: '202310' })
      }));
    });

    it('should use provided competencia', async () => {
      mockPrismaService.sigtapProcedimento.findMany.mockResolvedValueOnce([]);

      await service.getProcedimentos({ competencia: '202309' });
      
      expect(mockPrismaService.sigtapImportacao.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.sigtapProcedimento.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ dtCompetencia: '202309' })
      }));
    });
    
    it('should filter by busca', async () => {
      mockPrismaService.sigtapProcedimento.findMany.mockResolvedValueOnce([]);

      await service.getProcedimentos({ busca: 'teste' });
      
      expect(mockPrismaService.sigtapProcedimento.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { coProcedimento: { contains: 'teste', mode: 'insensitive' } },
            { noProcedimento: { contains: 'teste', mode: 'insensitive' } },
          ]
        })
      }));
    });
  });
});

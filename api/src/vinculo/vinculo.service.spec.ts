import { Test, TestingModule } from '@nestjs/testing';
import { VinculoService } from './vinculo.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  vinculo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  aditivo: {
    findMany: jest.fn(),
  },
};

describe('VinculoService', () => {
  let service: VinculoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VinculoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VinculoService>(VinculoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all vinculos', async () => {
      const mockResult = [{ id: 1 }];
      mockPrismaService.vinculo.findMany.mockResolvedValue(mockResult);

      const result = await service.findAll();
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a vinculo if found', async () => {
      const mockResult = { id: 1 };
      mockPrismaService.vinculo.findUnique.mockResolvedValue(mockResult);

      const result = await service.findOne(1);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.vinculo.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByInstituicao', () => {
    it('should return vinculos for a given instituicao', async () => {
      const mockResult = [{ id: 1 }];
      mockPrismaService.vinculo.findMany.mockResolvedValue(mockResult);

      const result = await service.findByInstituicao(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAditivos', () => {
    it('should return aditivos for a given vinculo', async () => {
      const mockResult = [{ id: 1 }];
      mockPrismaService.aditivo.findMany.mockResolvedValue(mockResult);

      const result = await service.findAditivos(1);
      expect(result).toEqual(mockResult);
    });
  });
});

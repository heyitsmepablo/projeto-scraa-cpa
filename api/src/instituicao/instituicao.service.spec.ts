import { Test, TestingModule } from '@nestjs/testing';
import { InstituicaoService } from './instituicao.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { TipoInstituicao } from '../../generated/prisma/client';

const mockPrismaService = {
  instituicao: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
};

describe('InstituicaoService', () => {
  let service: InstituicaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstituicaoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InstituicaoService>(InstituicaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of instituicoes', async () => {
      const mockResult = [{ id: 1, cnes: '123' }];
      mockPrismaService.instituicao.findMany.mockResolvedValue(mockResult);

      const result = await service.findAll();
      expect(result).toEqual(mockResult);
      expect(prisma.instituicao.findMany).toHaveBeenCalledWith({
        where: { deletadoEm: null },
      });
    });
  });

  describe('findOne', () => {
    it('should return an instituicao if found', async () => {
      const mockResult = { id: 1, cnes: '123' };
      mockPrismaService.instituicao.findUnique.mockResolvedValue(mockResult);

      const result = await service.findOne(1);
      expect(result).toEqual(mockResult);
      expect(prisma.instituicao.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.instituicao.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCnes', () => {
    it('should return an instituicao if found', async () => {
      const mockResult = { id: 1, cnes: '123' };
      mockPrismaService.instituicao.findFirst.mockResolvedValue(mockResult);

      const result = await service.findByCnes('123');
      expect(result).toEqual(mockResult);
      expect(prisma.instituicao.findFirst).toHaveBeenCalledWith({
        where: { cnes: '123', deletadoEm: null },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.instituicao.findFirst.mockResolvedValue(null);

      await expect(service.findByCnes('123')).rejects.toThrow(NotFoundException);
    });
  });
});

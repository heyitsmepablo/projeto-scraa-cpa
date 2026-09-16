import { Test, TestingModule } from '@nestjs/testing';
import { SigtapController } from './sigtap.controller';
import { SigtapService } from './sigtap.service';

describe('SigtapController', () => {
  let controller: SigtapController;
  let service: SigtapService;

  const mockSigtapService = {
    getGrupos: jest.fn(),
    getSubgrupos: jest.fn(),
    getFormasOrganizacao: jest.fn(),
    getProcedimentos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SigtapController],
      providers: [
        {
          provide: SigtapService,
          useValue: mockSigtapService,
        },
      ],
    }).compile();

    controller = module.get<SigtapController>(SigtapController);
    service = module.get<SigtapService>(SigtapService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getGrupos', async () => {
    mockSigtapService.getGrupos.mockResolvedValueOnce([]);
    await controller.getGrupos();
    expect(service.getGrupos).toHaveBeenCalled();
  });

  it('should call getSubgrupos with filters', async () => {
    mockSigtapService.getSubgrupos.mockResolvedValueOnce([]);
    const filters = { grupoCodigo: '01' };
    await controller.getSubgrupos(filters);
    expect(service.getSubgrupos).toHaveBeenCalledWith(filters);
  });

  it('should call getFormasOrganizacao with filters', async () => {
    mockSigtapService.getFormasOrganizacao.mockResolvedValueOnce([]);
    const filters = { grupoCodigo: '01', subgrupoCodigo: '01' };
    await controller.getFormasOrganizacao(filters);
    expect(service.getFormasOrganizacao).toHaveBeenCalledWith(filters);
  });

  it('should call getProcedimentos with filters', async () => {
    mockSigtapService.getProcedimentos.mockResolvedValueOnce([]);
    const filters = { busca: 'teste' };
    await controller.getProcedimentos(filters);
    expect(service.getProcedimentos).toHaveBeenCalledWith(filters);
  });
});

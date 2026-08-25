import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProducaoService } from './producao.service';
import { ProducaoPorProcedimento, ProducaoResumoMensal } from '../models/producao.model';
import { MOCK_PRODUCAO_PROCEDIMENTOS, MOCK_PRODUCAO_RESUMO } from '../mocks/producao.mock';

describe('ProducaoService', () => {
  let service: ProducaoService;
  let httpMock: HttpTestingController;

  const mockResumo: ProducaoResumoMensal[] = [
    {
      competencia: '202401',
      ano: '2024',
      mes: '01',
      nomeMes: 'Janeiro',
      quadrimestre: '1º Quadrimestre',
      tipoContrato: 'CONVÊNIO',
      cnes: '2078015',
      nomeInstituicao: 'Hospital São Francisco de Assis',
      coFinanciamento: '02',
      noFinanciamento: 'MÉDIA E ALTA COMPLEXIDADE (MAC)',
      complexidade: 'MC',
      totalFreq: 600,
      totalVlrAprovado: 105000,
      totalVlrProduzido: 105000,
    },
  ];

  const mockPorProcedimento: ProducaoPorProcedimento[] = [
    {
      competencia: '202401',
      ano: '2024',
      mes: '01',
      nomeMes: 'Janeiro',
      quadrimestre: '1º Quadrimestre',
      tipoContrato: 'CONVÊNIO',
      cnes: '2078015',
      nomeInstituicao: 'Hospital São Francisco de Assis',
      tipoVinculo: 'CONVÊNIO',
      coFinanciamento: '02',
      noFinanciamento: 'MÉDIA E ALTA COMPLEXIDADE (MAC)',
      complexidade: 'MC',
      coProcedimento: '0301010072',
      noProcedimento: 'CONSULTA MEDICA EM ATENCAO ESPECIALIZADA',
      qtdAprovada: 120,
      vlrAprovado: 6000,
      qtdProduzida: 120,
      vlrProduzido: 6000,
      qtdPactuadaMensal: 150,
      percExecucao: 80.0,
      statusExecucao: 'ABAIXO',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProducaoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProducaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch resumo mensal via GET /api/producao/resumo-mensal with params', () => {
    service.getResumoMensal('202401', '2078015').subscribe((resumo) => {
      expect(resumo.length).toBe(1);
      expect(resumo).toEqual(mockResumo);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === '/api/producao/resumo-mensal' &&
        request.params.get('competencia') === '202401' &&
        request.params.get('cnes') === '2078015'
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResumo);
  });

  it('should fallback to mock data if getResumoMensal encounters an HTTP error', () => {
    service.getResumoMensal('202401').subscribe((resumo) => {
      expect(resumo.length).toBeGreaterThan(0);
      expect(resumo.every((r) => r.competencia === '202401')).toBe(true);
    });

    const req = httpMock.expectOne('/api/producao/resumo-mensal?competencia=202401');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should fetch producao por procedimento without instituicaoId or cnes', () => {
    service.getProducaoPorProcedimento('202401').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res).toEqual(mockPorProcedimento);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === '/api/producao/por-procedimento' &&
        request.params.get('competencia') === '202401' &&
        !request.params.has('instituicaoId') &&
        !request.params.has('cnes')
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockPorProcedimento);
  });

  it('should fetch producao por procedimento with instituicaoId and cnes params', () => {
    service.getProducaoPorProcedimento('202401', 1, '2078015').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].cnes).toBe('2078015');
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === '/api/producao/por-procedimento' &&
        request.params.get('competencia') === '202401' &&
        request.params.get('instituicaoId') === '1' &&
        request.params.get('cnes') === '2078015'
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockPorProcedimento);
  });

  it('should fallback to mock data if getProducaoPorProcedimento encounters an HTTP error', () => {
    service.getProducaoPorProcedimento('202401', undefined, '2078015').subscribe((res) => {
      expect(res.length).toBeGreaterThan(0);
      expect(res.every((p) => p.cnes === '2078015' && p.competencia === '202401')).toBe(true);
    });

    const req = httpMock.expectOne('/api/producao/por-procedimento?competencia=202401&cnes=2078015');
    req.flush('Gateway Timeout', { status: 504, statusText: 'Gateway Timeout' });
  });

  it('should filter mock resumo mensal accurately by competencia and cnes', () => {
    service.getMockResumoMensal('202401', '2078015').subscribe((res) => {
      expect(res.every((r) => r.competencia === '202401' && r.cnes === '2078015')).toBe(true);
    });

    service.getMockResumoMensal().subscribe((res) => {
      expect(res.length).toBe(MOCK_PRODUCAO_RESUMO.length);
    });
  });

  it('should filter mock producao por procedimento accurately by competencia and cnes', () => {
    service.getMockProducaoPorProcedimento('202401', '2078015').subscribe((res) => {
      expect(res.every((p) => p.competencia === '202401' && p.cnes === '2078015')).toBe(true);
    });

    service.getMockProducaoPorProcedimento().subscribe((res) => {
      expect(res.length).toBe(MOCK_PRODUCAO_PROCEDIMENTOS.length);
    });
  });

  it('should fetch producao por procedimento with vinculoId param', () => {
    service.getProducaoPorProcedimento('202401', undefined, undefined, 2).subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === '/api/producao/por-procedimento' &&
        request.params.get('competencia') === '202401' &&
        request.params.get('vinculoId') === '2'
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockPorProcedimento);
  });

  it('should filter mock producao por procedimento by vinculoId', () => {
    service.getMockProducaoPorProcedimento(undefined, undefined, 1).subscribe((res) => {
      expect(res.every((p) => p.vinculoId === 1)).toBe(true);
    });
  });
});

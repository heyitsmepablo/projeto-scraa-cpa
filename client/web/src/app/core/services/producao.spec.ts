import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProducaoService } from './producao';
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
    TestBed.resetTestingModule();
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
        request.url === '/api/producao/por-periodo' &&
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
        request.url === '/api/producao/por-periodo' &&
        request.params.get('competencia') === '202401' &&
        request.params.get('instituicaoId') === '1' &&
        request.params.get('cnes') === '2078015'
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockPorProcedimento);
  });

  it('should fallback to mock data if getProducaoPorProcedimento encounters an HTTP error', () => {
    service.getProducaoPorProcedimento('202401', undefined, '1234567').subscribe((res) => {
      expect(res.length).toBeGreaterThan(0);
      expect(res.every((p) => p.cnes === '1234567')).toBe(true);
    });

    const req = httpMock.expectOne((request) => request.url === '/api/producao/por-periodo');
    req.flush('Gateway Timeout', { status: 504, statusText: 'Gateway Timeout' });
  });

  it('should filter mock resumo mensal accurately by competencia and cnes', () => {
    service.getMockResumoMensal('202401', '1234567').subscribe((res) => {
      expect(res.every((r) => r.competencia === '202401' && r.cnes === '1234567')).toBe(true);
    });

    service.getMockResumoMensal().subscribe((res) => {
      expect(res.length).toBe(MOCK_PRODUCAO_RESUMO.length);
    });
  });

  it('should filter mock producao por procedimento accurately by competencia and cnes', () => {
    service.getMockProducaoPorProcedimento('202401', '1234567').subscribe((res) => {
      expect(res.every((p) => p.competencia === '202401' && p.cnes === '1234567')).toBe(true);
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
        request.url === '/api/producao/por-periodo' &&
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

  it('should fetch and aggregate mock producao accurately for RANGE mode (N = 4 months)', () => {
    service
      .getProducaoPorPeriodo({
        mode: 'RANGE',
        competencia: null,
        competenciaInicio: '202401',
        competenciaFim: '202404',
        mesesCount: 4,
        descricaoFormatada: '1º Quadrimestre 2024 (Jan-Abr)',
      }, undefined, '1234567', 1)
      .subscribe((res) => {
        expect(res.length).toBeGreaterThan(0);
        expect(res.every((p) => p.competencia === '202401 a 202404')).toBe(true);

        // Procedimento com meta pactuada: Consulta Médica (coProcedimento: 0301010072, base mensal 2000)
        const consultaProc = res.find((p) => p.coProcedimento === '0301010072');
        expect(consultaProc).toBeDefined();
        if (consultaProc) {
          // Meta quadrimestral (4 meses) = 2000 * 4 = 8000
          expect(consultaProc.qtdPactuadaMensal).toBe(8000);
          expect(consultaProc.vlUnitario).toBe(10.00);
          expect(consultaProc.vlrPactuado).toBe(80000.00);
          // Projeção escalonada a partir dos 3 meses existentes (2000 + 2050 + 1980 = 6030; 6030 * 4 / 3 = 8040)
          expect(consultaProc.qtdAprovada).toBe(8040);
          expect(consultaProc.vlrAprovado).toBe(80400.00);
          expect(consultaProc.saldoFinanceiro).toBe(400.00);
          expect(consultaProc.percExecucao).toBe(100.50);
          expect(consultaProc.statusExecucao).toBe('DENTRO');
        }

        // Procedimento com desvio abaixo: Tratamento Cardiopatias (coProcedimento: 0303010037, base mensal 1000)
        const cardioProc = res.find((p) => p.coProcedimento === '0303010037');
        expect(cardioProc).toBeDefined();
        if (cardioProc) {
          // Meta quadrimestral = 1000 * 4 = 4000
          expect(cardioProc.qtdPactuadaMensal).toBe(4000);
          // 750 + 780 + 720 = 2250; 2250 * 4 / 3 = 3000
          expect(cardioProc.qtdAprovada).toBe(3000);
          expect(cardioProc.percExecucao).toBe(75.00);
          expect(cardioProc.statusExecucao).toBe('ABAIXO');
        }
      });

    const req = httpMock.expectOne((request) => request.url === '/api/producao/por-periodo');
    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });

  it('should fetch and aggregate mock producao accurately for GLOBAL mode (N = 48 months)', () => {
    service
      .getProducaoPorPeriodo({
        mode: 'GLOBAL',
        competencia: null,
        competenciaInicio: '202301',
        competenciaFim: '202612',
        mesesCount: 48,
        descricaoFormatada: 'Vigência Global (2023 a 2026)',
      }, undefined, '1234567', 1)
      .subscribe((res) => {
        expect(res.length).toBeGreaterThan(0);
        expect(res.every((p) => p.competencia === '202301 a 202612')).toBe(true);

        const consultaProc = res.find((p) => p.coProcedimento === '0301010072');
        expect(consultaProc).toBeDefined();
        if (consultaProc) {
          // Meta global (48 meses) = 2000 * 48 = 96000
          expect(consultaProc.qtdPactuadaMensal).toBe(96000);
          expect(consultaProc.vlUnitario).toBe(10.00);
          expect(consultaProc.vlrPactuado).toBe(960000.00);
          // Projeção a partir das 4 competências (1950 + 2000 + 2050 + 1980 = 7980; 7980 * 48 / 4 = 95760)
          expect(consultaProc.qtdAprovada).toBe(95760);
          expect(consultaProc.vlrAprovado).toBe(957600.00);
          expect(consultaProc.saldoFinanceiro).toBe(-2400.00);
          expect(consultaProc.percExecucao).toBe(99.75);
          expect(consultaProc.statusExecucao).toBe('DENTRO');
        }

        // Procedimento sem pacto
        const biopsiaProc = res.find((p) => p.coProcedimento === '0201010020');
        expect(biopsiaProc).toBeDefined();
        if (biopsiaProc) {
          expect(biopsiaProc.qtdPactuadaMensal).toBeNull();
          expect(biopsiaProc.vlrPactuado).toBeNull();
          expect(biopsiaProc.percExecucao).toBeNull();
          expect(biopsiaProc.statusExecucao).toBe('SEM_PACTO');
          expect(biopsiaProc.qtdAprovada).toBe(2160); // 45 * 48
        }
      });

    const req = httpMock.expectOne((request) => request.url === '/api/producao/por-periodo');
    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });
});

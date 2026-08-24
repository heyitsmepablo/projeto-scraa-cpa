import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VinculoService } from './vinculo.service';
import { Vinculo, Aditivo } from '../models/vinculo.model';
import { TipoVinculo, TipoAditivo, TipoComplexidade } from '../models/domain-enums';

describe('VinculoService', () => {
  let service: VinculoService;
  let httpMock: HttpTestingController;

  const mockVinculos: Vinculo[] = [
    {
      id: 10,
      instituicaoId: 1,
      numero: '001/2024',
      numeroProcessoSei: 'SEI-123456/2024',
      tipoVinculo: 'CONVÊNIO' as TipoVinculo,
      objeto: 'Prestação de serviços hospitalares SUS',
      complexidade: ['MC', 'AC'] as TipoComplexidade[],
      dataDaAssinatura: '2024-01-01T00:00:00.000Z',
      dataInicio: '2024-01-01T00:00:00.000Z',
      dataFim: '2024-12-31T00:00:00.000Z',
      valorTotal: 1200000,
      criadoEm: '2024-01-01T00:00:00.000Z',
      atualizadoEm: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockAditivos: Aditivo[] = [
    {
      id: 100,
      vinculoId: 10,
      numero: '1º Termo Aditivo',
      numeroProcessoSei: 'SEI-123456/2024-AD1',
      tipoAditivo: ['PRAZO', 'ACRÉSCIMO'] as TipoAditivo[],
      dataDaAssinatura: '2024-06-01T00:00:00.000Z',
      dataInicio: '2024-06-01T00:00:00.000Z',
      dataFim: '2025-06-01T00:00:00.000Z',
      valorTotal: 300000,
      criadoEm: '2024-06-01T00:00:00.000Z',
      atualizadoEm: '2024-06-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VinculoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(VinculoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all vinculos via GET /api/vinculos', () => {
    service.findAll().subscribe((vinculos) => {
      expect(vinculos.length).toBe(1);
      expect(vinculos).toEqual(mockVinculos);
    });

    const req = httpMock.expectOne('/api/vinculos');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculos);
  });

  it('should fetch vinculo by id via GET /api/vinculos/:id', () => {
    service.findById(10).subscribe((vinculo) => {
      expect(vinculo).toEqual(mockVinculos[0]);
    });

    const req = httpMock.expectOne('/api/vinculos/10');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculos[0]);
  });

  it('should fetch vinculos by instituicaoId via GET /api/vinculos/instituicao/:instituicaoId', () => {
    service.findByInstituicaoId(1).subscribe((vinculos) => {
      expect(vinculos.length).toBe(1);
      expect(vinculos[0].instituicaoId).toBe(1);
    });

    const req = httpMock.expectOne('/api/vinculos/instituicao/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculos);
  });

  it('should fetch aditivos by vinculoId via GET /api/vinculos/:vinculoId/aditivos', () => {
    service.findAditivosByVinculoId(10).subscribe((aditivos) => {
      expect(aditivos.length).toBe(1);
      expect(aditivos[0].vinculoId).toBe(10);
      expect(aditivos).toEqual(mockAditivos);
    });

    const req = httpMock.expectOne('/api/vinculos/10/aditivos');
    expect(req.request.method).toBe('GET');
    req.flush(mockAditivos);
  });
});

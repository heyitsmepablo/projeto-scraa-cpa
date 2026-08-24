import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlanoOperativoService } from './plano-operativo.service';
import { PlanoOperativo, PlanoOperativoProcedimento } from '../models/plano-operativo.model';

describe('PlanoOperativoService', () => {
  let service: PlanoOperativoService;
  let httpMock: HttpTestingController;

  const mockPlanos: PlanoOperativo[] = [
    {
      id: 5,
      vinculoId: 10,
      vigente: true,
      criadoEm: '2024-01-01T00:00:00.000Z',
      atualizadoEm: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockProcedimentos: PlanoOperativoProcedimento[] = [
    {
      id: 501,
      planoOperativoId: 5,
      coProcedimento: '0301010072',
      quantidadePactuadaMensal: 150,
      criadoEm: '2024-01-01T00:00:00.000Z',
      atualizadoEm: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanoOperativoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlanoOperativoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all planos operativos via GET /api/planos-operativos', () => {
    service.findAll().subscribe((planos) => {
      expect(planos.length).toBe(1);
      expect(planos).toEqual(mockPlanos);
    });

    const req = httpMock.expectOne('/api/planos-operativos');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanos);
  });

  it('should fetch plano operativo by id via GET /api/planos-operativos/:id', () => {
    service.findById(5).subscribe((plano) => {
      expect(plano).toEqual(mockPlanos[0]);
    });

    const req = httpMock.expectOne('/api/planos-operativos/5');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanos[0]);
  });

  it('should fetch planos by vinculoId via GET /api/planos-operativos/vinculo/:vinculoId', () => {
    service.findByVinculoId(10).subscribe((planos) => {
      expect(planos.length).toBe(1);
      expect(planos[0].vinculoId).toBe(10);
    });

    const req = httpMock.expectOne('/api/planos-operativos/vinculo/10');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanos);
  });

  it('should fetch procedimentos by planoOperativoId via GET /api/planos-operativos/:id/procedimentos', () => {
    service.findProcedimentos(5).subscribe((procedimentos) => {
      expect(procedimentos.length).toBe(1);
      expect(procedimentos).toEqual(mockProcedimentos);
      expect(procedimentos[0].coProcedimento).toBe('0301010072');
      expect(procedimentos[0].quantidadePactuadaMensal).toBe(150);
    });

    const req = httpMock.expectOne('/api/planos-operativos/5/procedimentos');
    expect(req.request.method).toBe('GET');
    req.flush(mockProcedimentos);
  });
});

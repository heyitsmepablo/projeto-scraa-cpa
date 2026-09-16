import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VinculoService } from './vinculo';

describe('VinculoService', () => {
  let service: VinculoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VinculoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ],
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

  it('should fetch all vinculos', () => {
    const mockVinculos = [
      { id: 1, numero: 'CONV-001/2023' },
      { id: 2, numero: 'CONT-042/2022' }
    ] as any;

    service.findAll().subscribe(vinculos => {
      expect(vinculos.length).toBe(2);
      expect(vinculos[0].numero).toBe('CONV-001/2023');
    });

    const req = httpMock.expectOne('/api/vinculos');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculos);
  });

  it('should fetch vinculo by id', () => {
    const mockVinculo = { id: 1, numero: 'CONV-001/2023' } as any;

    service.findById(1).subscribe(vinculo => {
      expect(vinculo.numero).toBe('CONV-001/2023');
    });

    const req = httpMock.expectOne('/api/vinculos/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculo);
  });

  it('should fetch vinculos by instituicaoId', () => {
    const mockVinculos = [
      { id: 1, instituicaoId: 1, numero: 'CONV-001/2023' }
    ] as any;

    service.findByInstituicaoId(1).subscribe(vinculos => {
      expect(vinculos.length).toBe(1);
      expect(vinculos[0].instituicaoId).toBe(1);
    });

    const req = httpMock.expectOne('/api/vinculos/instituicao/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockVinculos);
  });

  it('should fetch aditivos by vinculoId', () => {
    const mockAditivos = [
      { id: 1, vinculoId: 1, numeroAditivo: '01/2024' }
    ] as any;

    service.findAditivosByVinculoId(1).subscribe(aditivos => {
      expect(aditivos.length).toBe(1);
      expect(aditivos[0].vinculoId).toBe(1);
    });

    const req = httpMock.expectOne('/api/vinculos/1/aditivos');
    expect(req.request.method).toBe('GET');
    req.flush(mockAditivos);
  });
});

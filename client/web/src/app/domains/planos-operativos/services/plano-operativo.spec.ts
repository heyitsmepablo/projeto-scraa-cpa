import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlanoOperativoService } from './plano-operativo';

describe('PlanoOperativoService', () => {
  let service: PlanoOperativoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlanoOperativoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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

  it('should return all planos operativos', () => {
    const mockPlanos = [{ id: 1, vigente: true }] as any;
    service.findAll().subscribe(planos => {
      expect(planos.length).toBe(1);
      expect(planos[0].vigente).toBe(true);
    });
    const req = httpMock.expectOne('/api/planos-operativos');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanos);
  });

  it('should find plano operativo by id', () => {
    const mockPlano = { id: 1, vinculo: { numero: 'CONV-001/2023' } } as any;
    service.findById(1).subscribe(plano => {
      expect(plano?.id).toBe(1);
      expect(plano?.vinculo?.numero).toBe('CONV-001/2023');
    });
    const req = httpMock.expectOne('/api/planos-operativos/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlano);
  });

  it('should find planos by vinculoId', () => {
    const mockPlanos = [{ id: 1, vinculoId: 1 }] as any;
    service.findByVinculoId(1).subscribe(planos => {
      expect(planos.length).toBe(1);
      expect(planos[0].vinculoId).toBe(1);
    });
    const req = httpMock.expectOne('/api/planos-operativos/vinculo/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanos);
  });

  it('should find vigente plano by vinculoId', () => {
    const mockPlano = { id: 1, vigente: true } as any;
    service.findVigenteByVinculoId(1).subscribe(plano => {
      expect(plano?.vigente).toBe(true);
    });
    const req = httpMock.expectOne('/api/planos-operativos/vinculo/1/vigente');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlano);
  });

  it('should return empty/undefined for non-existing vinculo or plano', () => {
    service.findById(9999).subscribe(nonExistent => {
      expect(nonExistent).toBeNull();
    });
    const req1 = httpMock.expectOne('/api/planos-operativos/9999');
    req1.flush(null);

    service.findByVinculoId(9999).subscribe(emptyList => {
      expect(emptyList.length).toBe(0);
    });
    const req2 = httpMock.expectOne('/api/planos-operativos/vinculo/9999');
    req2.flush([]);
  });

  it('should find procedimentos for a plano', () => {
    const mockProcs = [
      { coProcedimento: '0301010072', procedimento: {} },
      { coProcedimento: '123' }, { coProcedimento: '123' },
      { coProcedimento: '123' }, { coProcedimento: '123' }, { coProcedimento: '123' }
    ] as any;
    service.findProcedimentos(1).subscribe(procs => {
      expect(procs.length).toBe(6);
      expect(procs[0].coProcedimento).toBe('0301010072');
    });
    const req = httpMock.expectOne('/api/planos-operativos/1/procedimentos');
    req.flush(mockProcs);
  });

  it('should return empty array for procedimentos when plano not found', () => {
    service.findProcedimentos(999).subscribe(procs => {
      expect(procs).toEqual([]);
    });
    const req = httpMock.expectOne('/api/planos-operativos/999/procedimentos');
    req.flush([]);
  });

  it('should calculate resumo correctly with complexity distribution', () => {
    const mockResumo = {
      totalProcedimentos: 6,
      metaFisicaTotal: 1200 + 350 + 180 + 85 + 25 + 480,
      distribuicaoComplexidade: {
        mc: 1200 + 350 + 180,
        ac: 85 + 25 + 480,
        bc: 0
      }
    } as any;
    service.getResumo(1).subscribe(resumo => {
      expect(resumo?.totalProcedimentos).toBe(6);
      expect(resumo?.distribuicaoComplexidade.mc).toBe(1200 + 350 + 180);
    });
    const req = httpMock.expectOne('/api/planos-operativos/1/resumo');
    req.flush(mockResumo);
  });

  it('should return undefined resumo for non-existent plano', () => {
    service.getResumo(999).subscribe(resumo => {
      expect(resumo).toBeNull();
    });
    const req = httpMock.expectOne('/api/planos-operativos/999/resumo');
    req.flush(null);
  });

  it('should return vinculo options with labels', () => {
    const mockOptions = [
      { planoOperativoId: 1, label: 'SANTA CASA DE MISERICÓRDIA' }
    ] as any;
    service.getVinculoOptions().subscribe(options => {
      expect(options.length).toBeGreaterThan(0);
      expect(options[0].planoOperativoId).toBe(1);
      expect(options[0].label).toContain('SANTA CASA DE MISERICÓRDIA');
    });
    const req = httpMock.expectOne('/api/planos-operativos/opcoes/vinculos');
    req.flush(mockOptions);
  });
});

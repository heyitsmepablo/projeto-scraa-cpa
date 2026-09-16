import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InstituicaoService } from './instituicao';

describe('InstituicaoService', () => {
  let service: InstituicaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstituicaoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    });

    service = TestBed.inject(InstituicaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all institutions', () => {
    const mockInstituicoes = [
      { id: 1, nome: 'SANTA CASA DE MISERICÓRDIA' },
      { id: 2, nome: 'HOSPITAL SÃO PAULO' }
    ] as any;

    service.findAll().subscribe(instituicoes => {
      expect(instituicoes.length).toBe(2);
      expect(instituicoes[0].nome).toBe('SANTA CASA DE MISERICÓRDIA');
    });

    const req = httpMock.expectOne('/api/instituicoes');
    expect(req.request.method).toBe('GET');
    req.flush(mockInstituicoes);
  });

  it('should fetch institution by id', () => {
    const mockInst = { id: 1, nome: 'SANTA CASA DE MISERICÓRDIA' } as any;

    service.findById(1).subscribe(instituicao => {
      expect(instituicao.nome).toBe('SANTA CASA DE MISERICÓRDIA');
    });

    const req = httpMock.expectOne('/api/instituicoes/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockInst);
  });

  it('should fetch institution by cnes', () => {
    const mockInst = { id: 1, nome: 'SANTA CASA DE MISERICÓRDIA', cnes: '1234567' } as any;

    service.findByCnes('1234567').subscribe(instituicao => {
      expect(instituicao.nome).toBe('SANTA CASA DE MISERICÓRDIA');
    });

    const req = httpMock.expectOne('/api/instituicoes/cnes/1234567');
    expect(req.request.method).toBe('GET');
    req.flush(mockInst);
  });
});

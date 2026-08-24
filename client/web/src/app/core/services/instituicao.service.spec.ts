import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InstituicaoService } from './instituicao.service';
import { Instituicao } from '../models/instituicao.model';
import { TipoInstituicao } from '../models/domain-enums';

describe('InstituicaoService', () => {
  let service: InstituicaoService;
  let httpMock: HttpTestingController;

  const mockInstituicoes: Instituicao[] = [
    {
      id: 1,
      cnes: '2078015',
      nome: 'Hospital São Francisco de Assis',
      cnpj: '00.000.000/0001-91',
      tipoInstituicao: 'FILANTRÓPICO' as TipoInstituicao,
      criadoEm: '2024-01-01T00:00:00.000Z',
      atualizadoEm: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      cnes: '2080000',
      nome: 'Clínica Santa Maria',
      cnpj: '11.111.111/0001-11',
      tipoInstituicao: 'EMPRESA' as TipoInstituicao,
      criadoEm: '2024-01-01T00:00:00.000Z',
      atualizadoEm: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstituicaoService, provideHttpClient(), provideHttpClientTesting()],
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

  it('should fetch all institutions via GET /api/instituicoes', () => {
    service.findAll().subscribe((instituicoes) => {
      expect(instituicoes.length).toBe(2);
      expect(instituicoes).toEqual(mockInstituicoes);
    });

    const req = httpMock.expectOne('/api/instituicoes');
    expect(req.request.method).toBe('GET');
    req.flush(mockInstituicoes);
  });

  it('should fetch institution by id via GET /api/instituicoes/:id', () => {
    const mockInst = mockInstituicoes[0];
    service.findById(1).subscribe((instituicao) => {
      expect(instituicao).toEqual(mockInst);
    });

    const req = httpMock.expectOne('/api/instituicoes/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockInst);
  });

  it('should fetch institution by cnes via GET /api/instituicoes/cnes/:cnes', () => {
    const mockInst = mockInstituicoes[0];
    service.findByCnes('2078015').subscribe((instituicao) => {
      expect(instituicao).toEqual(mockInst);
      expect(instituicao.cnes).toBe('2078015');
    });

    const req = httpMock.expectOne('/api/instituicoes/cnes/2078015');
    expect(req.request.method).toBe('GET');
    req.flush(mockInst);
  });
});

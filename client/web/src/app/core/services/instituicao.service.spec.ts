import { TestBed } from '@angular/core/testing';
import { InstituicaoService } from './instituicao.service';
import { firstValueFrom } from 'rxjs';

describe('InstituicaoService', () => {
  let service: InstituicaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstituicaoService],
    });

    service = TestBed.inject(InstituicaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all institutions', async () => {
    const instituicoes = await firstValueFrom(service.findAll());
    expect(instituicoes.length).toBe(5);
    expect(instituicoes[0].nome).toBe('SANTA CASA DE MISERICÓRDIA');
  });

  it('should fetch institution by id', async () => {
    const instituicao = await firstValueFrom(service.findById(1));
    expect(instituicao.nome).toBe('SANTA CASA DE MISERICÓRDIA');
  });

  it('should fetch institution by cnes', async () => {
    const instituicao = await firstValueFrom(service.findByCnes('1234567'));
    expect(instituicao.nome).toBe('SANTA CASA DE MISERICÓRDIA');
  });
});

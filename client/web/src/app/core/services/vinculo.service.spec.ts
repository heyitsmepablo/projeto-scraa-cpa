import { TestBed } from '@angular/core/testing';
import { VinculoService } from './vinculo.service';
import { firstValueFrom } from 'rxjs';

describe('VinculoService', () => {
  let service: VinculoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VinculoService],
    });

    service = TestBed.inject(VinculoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all vinculos', async () => {
    const vinculos = await firstValueFrom(service.findAll());
    expect(vinculos.length).toBe(4);
    expect(vinculos[0].numero).toBe('CONV-001/2023');
  });

  it('should fetch vinculo by id', async () => {
    const vinculo = await firstValueFrom(service.findById(1));
    expect(vinculo.numero).toBe('CONV-001/2023');
  });

  it('should fetch vinculos by instituicaoId', async () => {
    const vinculos = await firstValueFrom(service.findByInstituicaoId(1));
    expect(vinculos.length).toBeGreaterThan(0);
    expect(vinculos[0].instituicaoId).toBe(1);
  });

  it('should fetch aditivos by vinculoId', async () => {
    const aditivos = await firstValueFrom(service.findAditivosByVinculoId(1));
    expect(aditivos.length).toBeGreaterThan(0);
    expect(aditivos[0].vinculoId).toBe(1);
  });
});

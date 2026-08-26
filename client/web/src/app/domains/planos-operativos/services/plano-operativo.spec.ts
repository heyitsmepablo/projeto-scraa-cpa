import { TestBed } from '@angular/core/testing';
import { PlanoOperativoService } from './plano-operativo';
import { firstValueFrom } from 'rxjs';

describe('PlanoOperativoService', () => {
  let service: PlanoOperativoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanoOperativoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all planos operativos', async () => {
    const planos = await firstValueFrom(service.findAll());
    expect(planos.length).toBeGreaterThan(0);
    expect(planos.some((p) => p.vigente)).toBe(true);
  });

  it('should find plano operativo by id', async () => {
    const plano = await firstValueFrom(service.findById(1));
    expect(plano).toBeDefined();
    expect(plano?.id).toBe(1);
    expect(plano?.vinculo?.numero).toBe('CONV-001/2023');
  });

  it('should find planos by vinculoId', async () => {
    const planos = await firstValueFrom(service.findByVinculoId(1));
    expect(planos.length).toBe(1);
    expect(planos[0].vinculoId).toBe(1);
  });

  it('should find vigente plano by vinculoId', async () => {
    const plano = await firstValueFrom(service.findVigenteByVinculoId(1));
    expect(plano).toBeDefined();
    expect(plano?.vigente).toBe(true);
  });

  it('should return empty/undefined for non-existing vinculo or plano', async () => {
    const nonExistent = await firstValueFrom(service.findById(9999));
    expect(nonExistent).toBeUndefined();
    const emptyList = await firstValueFrom(service.findByVinculoId(9999));
    expect(emptyList.length).toBe(0);
  });

  it('should find procedimentos for a plano', async () => {
    const procs = await firstValueFrom(service.findProcedimentos(1));
    expect(procs.length).toBe(6);
    expect(procs[0].coProcedimento).toBe('0301010072');
    expect(procs[0].procedimento).toBeDefined();
  });

  it('should return empty array for procedimentos when plano not found', async () => {
    const procs = await firstValueFrom(service.findProcedimentos(999));
    expect(procs).toEqual([]);
  });

  it('should calculate resumo correctly with complexity distribution', async () => {
    const resumo = await firstValueFrom(service.getResumo(1));
    expect(resumo).toBeDefined();
    expect(resumo?.totalProcedimentos).toBe(6);
    expect(resumo?.metaFisicaTotal).toBe(1200 + 350 + 180 + 85 + 25 + 480);
    expect(resumo?.distribuicaoComplexidade.mc).toBe(1200 + 350 + 180);
    expect(resumo?.distribuicaoComplexidade.ac).toBe(85 + 25 + 480);
    expect(resumo?.distribuicaoComplexidade.bc).toBe(0);
  });

  it('should return undefined resumo for non-existent plano', async () => {
    const resumo = await firstValueFrom(service.getResumo(999));
    expect(resumo).toBeUndefined();
  });

  it('should return vinculo options with labels', async () => {
    const options = await firstValueFrom(service.getVinculoOptions());
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].planoOperativoId).toBe(1);
    expect(options[0].label).toContain('SANTA CASA DE MISERICÓRDIA');
  });
});

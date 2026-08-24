import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, beforeEach, it, expect } from 'vitest';
import { PlanoOperativoService } from './plano-operativo.service';

describe('PlanoOperativoService', () => {
  let service: PlanoOperativoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanoOperativoService],
    });

    service = TestBed.inject(PlanoOperativoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all planos operativos', async () => {
    const planos = await firstValueFrom(service.findAll());
    expect(planos).toBeDefined();
    expect(planos.length).toBe(4);
    expect(planos[0].id).toBe(1);
    expect(planos[0].vinculo?.instituicao?.nome).toBe('SANTA CASA DE MISERICÓRDIA');
  });

  it('should fetch plano operativo by id', async () => {
    const plano = await firstValueFrom(service.findById(1));
    expect(plano).toBeDefined();
    expect(plano?.id).toBe(1);
    expect(plano?.vinculoId).toBe(1);
    expect(plano?.vigente).toBe(true);
    expect(plano?.procedimentos?.length).toBe(6);
  });

  it('should return undefined when plano id is not found', async () => {
    const plano = await firstValueFrom(service.findById(999));
    expect(plano).toBeUndefined();
  });

  it('should fetch planos by vinculoId', async () => {
    const planos = await firstValueFrom(service.findByVinculoId(1));
    expect(planos.length).toBe(1);
    expect(planos[0].id).toBe(1);
    expect(planos[0].vinculoId).toBe(1);
  });

  it('should return empty array when vinculoId has no planos', async () => {
    const planos = await firstValueFrom(service.findByVinculoId(999));
    expect(planos).toEqual([]);
  });

  it('should fetch active (vigente) plano by vinculoId', async () => {
    const plano = await firstValueFrom(service.findVigenteByVinculoId(1));
    expect(plano).toBeDefined();
    expect(plano?.id).toBe(1);
    expect(plano?.vigente).toBe(true);
  });

  it('should return undefined for findVigenteByVinculoId when plano is not vigente', async () => {
    // Vinculo 3 has only an expired (vigente: false) plano (id: 3)
    const plano = await firstValueFrom(service.findVigenteByVinculoId(3));
    expect(plano).toBeUndefined();
  });

  it('should fetch procedimentos for a given planoOperativoId', async () => {
    const procedimentos = await firstValueFrom(service.findProcedimentos(1));
    expect(procedimentos.length).toBe(6);
    expect(procedimentos[0].coProcedimento).toBe('0301010072');
    expect(procedimentos[0].quantidadePactuadaMensal).toBe(1200);
    expect(procedimentos[0].procedimento?.noProcedimento).toBe('CONSULTA MEDICA EM ATENCAO ESPECIALIZADA');
  });

  it('should return empty array when fetching procedimentos for non-existent plano', async () => {
    const procedimentos = await firstValueFrom(service.findProcedimentos(999));
    expect(procedimentos).toEqual([]);
  });

  it('should get resumo with accurate calculations and complexity breakdown', async () => {
    const resumo = await firstValueFrom(service.getResumo(1));
    expect(resumo).toBeDefined();
    expect(resumo?.planoOperativoId).toBe(1);
    expect(resumo?.totalProcedimentos).toBe(6);
    // Total: 1200 + 350 + 180 + 85 + 25 + 480 = 2320
    expect(resumo?.metaFisicaTotal).toBe(2320);
    // BC: 0, MC: 1200+350+180 = 1730, AC: 85+25+480 = 590
    expect(resumo?.distribuicaoComplexidade).toEqual({
      bc: 0,
      mc: 1730,
      ac: 590,
    });
  });

  it('should return undefined when getResumo is called with non-existent plano id', async () => {
    const resumo = await firstValueFrom(service.getResumo(999));
    expect(resumo).toBeUndefined();
  });

  it('should get vinculo options formatted for dropdowns', async () => {
    const options = await firstValueFrom(service.getVinculoOptions());
    expect(options).toBeDefined();
    expect(options.length).toBe(4);
    expect(options[0]).toEqual({
      planoOperativoId: 1,
      vinculoId: 1,
      label: 'SANTA CASA DE MISERICÓRDIA - CONV-001/2023 (Vigente)',
      instituicaoNome: 'SANTA CASA DE MISERICÓRDIA',
      numeroVinculo: 'CONV-001/2023',
      vigente: true,
    });
    expect(options[2].vigente).toBe(false);
    expect(options[2].label).toContain('(Inativo)');
  });
});

import { TestBed } from '@angular/core/testing';
import { CompetenceService } from './competence';

describe('CompetenceService', () => {
  let service: CompetenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompetenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial competence set to 202403', () => {
    expect(service.competencia()).toBe('202403');
    expect(service.competenciaFormatada()).toBe('03/2024');
  });

  it('should list competencies covering 2023 to 2026', () => {
    const list = service.competencias();
    expect(list.length).toBe(48);
    expect(list[0].value).toBe('202612');
    expect(list[list.length - 1].value).toBe('202301');
  });

  it('should update competence and formatted string', () => {
    service.setCompetence('202406');
    expect(service.competencia()).toBe('202406');
    expect(service.competenciaFormatada()).toBe('06/2024');
  });

  it('should not update competence with invalid format', () => {
    service.setCompetence('202406');
    service.setCompetence('invalid');
    expect(service.competencia()).toBe('202406');
    service.setCompetence('');
    expect(service.competencia()).toBe('202406');
  });

  it('should return selected option correctly', () => {
    service.setCompetence('202403');
    const option = service.selectedOption();
    expect(option).toEqual({
      value: '202403',
      label: '03/2024 - Março',
      ano: 2024,
      mes: 3,
    });
  });

  it('should navigate to next competence', () => {
    service.setCompetence('202405');
    service.nextCompetence();
    expect(service.competencia()).toBe('202406');
    expect(service.competenciaFormatada()).toBe('06/2024');
  });

  it('should navigate across year boundary forward', () => {
    service.setCompetence('202412');
    service.nextCompetence();
    expect(service.competencia()).toBe('202501');
    expect(service.competenciaFormatada()).toBe('01/2025');
  });

  it('should navigate to previous competence', () => {
    service.setCompetence('202405');
    service.previousCompetence();
    expect(service.competencia()).toBe('202404');
    expect(service.competenciaFormatada()).toBe('04/2024');
  });

  it('should set range filter correctly', () => {
    service.setRange('202401', '202404');
    const filter = service.periodFilter();
    expect(filter.mode).toBe('RANGE');
    expect(filter.competenciaInicio).toBe('202401');
    expect(filter.competenciaFim).toBe('202404');
    expect(filter.mesesCount).toBe(4);
    expect(service.periodMode()).toBe('RANGE');
    expect(service.mesesCount()).toBe(4);
    expect(service.periodoFormatado()).toContain('01/2024 a 04/2024 (4 meses)');
  });

  it('should set global filter correctly', () => {
    service.setGlobal('202301', '202612');
    const filter = service.periodFilter();
    expect(filter.mode).toBe('GLOBAL');
    expect(filter.competenciaInicio).toBe('202301');
    expect(filter.competenciaFim).toBe('202612');
    expect(filter.mesesCount).toBe(48);
    expect(service.periodMode()).toBe('GLOBAL');
    expect(service.mesesCount()).toBe(48);
    expect(service.periodoFormatado()).toContain('Vigência Global');
  });

  it('should calculate month differences accurately', () => {
    expect(service.countMonthsBetween('202401', '202401')).toBe(1);
    expect(service.countMonthsBetween('202401', '202404')).toBe(4);
    expect(service.countMonthsBetween('202301', '202412')).toBe(24);
    expect(service.countMonthsBetween('', '202412')).toBe(1);
    expect(service.countMonthsBetween('202401', '')).toBe(1);
  });

  it('should automatically reverse range dates if start > end', () => {
    service.setRange('202408', '202402');
    const filter = service.periodFilter();
    expect(filter.mode).toBe('RANGE');
    expect(filter.competenciaInicio).toBe('202402');
    expect(filter.competenciaFim).toBe('202408');
    expect(filter.mesesCount).toBe(7);
    expect(service.periodoFormatado()).toContain('02/2024 a 08/2024 (7 meses)');
  });

  it('should ignore setRange with invalid formats', () => {
    service.setRange('202401', '202403');
    service.setRange('invalid', '202404');
    expect(service.periodFilter().competenciaFim).toBe('202403');
  });

  it('should shift range window forward and backward with next/previous competence in RANGE mode', () => {
    service.setRange('202402', '202404');
    service.nextCompetence();
    expect(service.periodFilter().competenciaInicio).toBe('202403');
    expect(service.periodFilter().competenciaFim).toBe('202405');

    service.previousCompetence();
    expect(service.periodFilter().competenciaInicio).toBe('202402');
    expect(service.periodFilter().competenciaFim).toBe('202404');
  });

  it('should support custom global bounds configuration and reset', () => {
    const customBounds = {
      competenciaInicio: '202306',
      competenciaFim: '202506',
      descricao: 'Vigência Customizada',
      mesesCount: 25,
      contexto: 'MONITORAMENTO' as const,
      contratoNumero: 'CONT-123/2023',
    };
    service.setGlobalBounds(customBounds);
    expect(service.globalBounds()).toEqual(customBounds);

    service.applyGlobal();
    const filter = service.periodFilter();
    expect(filter.mode).toBe('GLOBAL');
    expect(filter.competenciaInicio).toBe('202306');
    expect(filter.competenciaFim).toBe('202506');
    expect(filter.descricaoFormatada).toContain('Vigência Contrato CONT-123/2023');

    service.resetGlobalBounds();
    expect(service.globalBounds().contexto).toBe('DASHBOARD');
    expect(service.globalBounds().competenciaInicio).toBe('202301');
    expect(service.globalBounds().competenciaFim).toBe('202612');
  });
});

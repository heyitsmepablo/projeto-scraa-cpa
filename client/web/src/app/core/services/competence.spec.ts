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

  it('should have initial competence set to 202401', () => {
    expect(service.competencia()).toBe('202401');
    expect(service.competenciaFormatada()).toBe('01/2024');
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
  });
});

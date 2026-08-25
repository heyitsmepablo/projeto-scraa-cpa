import { TestBed } from '@angular/core/testing';
import { CompetenceService } from './competence.service';

describe('CompetenceService', () => {
  let service: CompetenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CompetenceService],
    });
    service = TestBed.inject(CompetenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default competence 202401', () => {
    expect(service.competencia()).toBe('202401');
    expect(service.competenciaFormatada()).toBe('01/2024');
  });

  it('should have a non-empty list of generated competencias', () => {
    const list = service.competencias();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].value).toBe('202612');
    expect(list[list.length - 1].value).toBe('202301');
  });

  it('should update competence when setCompetence is called with valid 6-char string', () => {
    service.setCompetence('202406');
    expect(service.competencia()).toBe('202406');
    expect(service.competenciaFormatada()).toBe('06/2024');
  });

  it('should ignore invalid competence formats', () => {
    service.setCompetence('202406');
    service.setCompetence('invalid');
    expect(service.competencia()).toBe('202406');
    service.setCompetence('');
    expect(service.competencia()).toBe('202406');
  });

  it('should return the correct selectedOption matching the active competence', () => {
    service.setCompetence('202403');
    const option = service.selectedOption();
    expect(option).not.toBeNull();
    expect(option?.value).toBe('202403');
    expect(option?.label).toContain('03/2024');
    expect(option?.label).toContain('Março');
    expect(option?.ano).toBe(2024);
    expect(option?.mes).toBe(3);
  });

  it('should advance to next month within the same year', () => {
    service.setCompetence('202405');
    service.nextCompetence();
    expect(service.competencia()).toBe('202406');
    expect(service.competenciaFormatada()).toBe('06/2024');
  });

  it('should advance to next year when nextCompetence is called on December', () => {
    service.setCompetence('202412');
    service.nextCompetence();
    expect(service.competencia()).toBe('202501');
    expect(service.competenciaFormatada()).toBe('01/2025');
  });

  it('should go back to previous month within the same year', () => {
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

  it('should calculate months count between competencies', () => {
    expect(service.countMonthsBetween('202401', '202401')).toBe(1);
    expect(service.countMonthsBetween('202401', '202404')).toBe(4);
    expect(service.countMonthsBetween('202301', '202412')).toBe(24);
  });
});


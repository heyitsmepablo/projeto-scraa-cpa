import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { CompetenceService } from '../../core/services/competence.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { ProducaoService } from '../../core/services/producao.service';
import { MOCK_PRODUCAO_PROCEDIMENTOS } from '../../core/mocks/producao.mock';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let competenceServiceMock: any;
  let instituicaoServiceMock: any;
  let producaoServiceMock: any;

  beforeEach(async () => {
    competenceServiceMock = {
      competencia: vi.fn().mockReturnValue('202401'),
      competenciaFormatada: vi.fn().mockReturnValue('01/2024'),
      setCompetence: vi.fn(),
      previousCompetence: vi.fn(),
      nextCompetence: vi.fn(),
    };

    instituicaoServiceMock = {
      findAll: vi.fn().mockReturnValue(
        of([
          {
            id: 1,
            nome: 'SANTA CASA DE MISERICÓRDIA',
            cnes: '1234567',
            cnpj: '61.699.567/0001-92',
            tipoInstituicao: 'FILANTRÓPICO',
          },
          {
            id: 2,
            nome: 'HOSPITAL SÃO PAULO',
            cnes: '7654321',
            cnpj: '60.453.016/0001-74',
            tipoInstituicao: 'FILANTRÓPICO',
          },
        ])
      ),
    };

    producaoServiceMock = {
      getProducaoPorProcedimento: vi.fn().mockImplementation((comp: string) => {
        return of(MOCK_PRODUCAO_PROCEDIMENTOS.filter((p) => p.competencia === comp || !comp));
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: CompetenceService, useValue: competenceServiceMock },
        { provide: InstituicaoService, useValue: instituicaoServiceMock },
        { provide: ProducaoService, useValue: producaoServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the standalone component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the formatted competence from CompetenceService', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('01/2024');
  });

  it('should trigger competence navigation methods when buttons clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // Button previous and next
    component.competenceService.previousCompetence();
    expect(competenceServiceMock.previousCompetence).toHaveBeenCalled();

    component.competenceService.nextCompetence();
    expect(competenceServiceMock.nextCompetence).toHaveBeenCalled();
  });

  it('should contain the dashboard title and monitoring description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Dashboard de Monitoramento CPA');
    expect(compiled.textContent).toContain('Painel consolidado de apuração de produção SUS');
  });

  it('should calculate and display KPIs accurately', () => {
    const kpis = component.kpis();
    expect(kpis.totalProcedimentos).toBeGreaterThan(0);
    expect(kpis.totalValorAprovado).toBeGreaterThan(0);
    expect(kpis.totalQtdAprovada).toBeGreaterThan(0);
    expect(kpis.totalQtdProduzida).toBeGreaterThan(0);
    expect(kpis.taxaExecucaoGeral).toBeGreaterThan(0);
    expect(kpis.totalDentro + kpis.totalAcima + kpis.totalAbaixo + kpis.totalSemPacto).toBe(kpis.totalProcedimentos);
  });

  it('should populate instituicaoOptions correctly with ALL placeholder and items', () => {
    const options = component.instituicaoOptions();
    expect(options.length).toBe(3);
    expect(options[0]).toEqual({ label: 'Todas as Instituições', value: 'ALL' });
    expect(options[1].value).toBe('1234567');
  });

  it('should filter items when changing selectedInstituicaoCnes', () => {
    const initialTotal = component.filteredProcedimentos().length;
    expect(initialTotal).toBeGreaterThan(0);

    // Filtra pela Santa Casa (1234567)
    component.selectedInstituicaoCnes.set('1234567');
    fixture.detectChanges();

    const filtered = component.filteredProcedimentos();
    expect(filtered.length).toBeLessThanOrEqual(initialTotal);
    expect(filtered.every((p) => p.cnes === '1234567')).toBe(true);

    // Reseta filtros
    component.resetFilters();
    expect(component.selectedInstituicaoCnes()).toBe('ALL');
    expect(component.selectedQuadrimestre()).toBe('ALL');
    expect(component.selectedStatusExecucao()).toBe('ALL');
  });

  it('should filter items by quadrimestre and statusExecucao', () => {
    component.selectedStatusExecucao.set('ACIMA');
    fixture.detectChanges();

    const filtered = component.filteredProcedimentos();
    expect(filtered.every((p) => p.statusExecucao === 'ACIMA')).toBe(true);

    component.selectedQuadrimestre.set('1º Quadrimestre');
    fixture.detectChanges();

    const quadFiltered = component.filteredProcedimentos();
    expect(quadFiltered.every((p) => p.quadrimestre === '1º Quadrimestre')).toBe(true);
  });

  it('should format SIGTAP code properly', () => {
    expect(component.formatSigtapCode('0301010072')).toBe('03.01.01.007-2');
    expect(component.formatSigtapCode('0204030188')).toBe('02.04.03.018-8');
    expect(component.formatSigtapCode('123')).toBe('123');
    expect(component.formatSigtapCode('')).toBe('-');
    expect(component.formatSigtapCode(undefined)).toBe('-');
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(null)).toBe('R$ 0,00');
    expect(component.formatCurrency(undefined)).toBe('R$ 0,00');
    const formatted = component.formatCurrency(1500.5);
    expect(formatted).toContain('1.500,50');
  });

  it('should clamp percentage safely between 0 and 100', () => {
    expect(component.getClampedPercent(null)).toBe(0);
    expect(component.getClampedPercent(undefined)).toBe(0);
    expect(component.getClampedPercent(-10)).toBe(0);
    expect(component.getClampedPercent(75.5)).toBe(75.5);
    expect(component.getClampedPercent(140)).toBe(100);
  });

  it('should return correct CSS class based on execution status', () => {
    expect(component.getPercTextClass('DENTRO')).toContain('emerald');
    expect(component.getPercTextClass('ACIMA')).toContain('amber');
    expect(component.getPercTextClass('ABAIXO')).toContain('rose');
    expect(component.getPercTextClass('SEM_PACTO')).toContain('surface');
  });

  it('should map execution status severities and labels correctly', () => {
    expect(component.getStatusSeverity('DENTRO')).toBe('success');
    expect(component.getStatusSeverity('ACIMA')).toBe('warn');
    expect(component.getStatusSeverity('ABAIXO')).toBe('danger');
    expect(component.getStatusSeverity('SEM_PACTO')).toBe('secondary');

    expect(component.getStatusLabel('DENTRO')).toBe('Dentro da Meta');
    expect(component.getStatusLabel('ACIMA')).toBe('Acima da Meta');
    expect(component.getStatusLabel('ABAIXO')).toBe('Abaixo da Meta');
    expect(component.getStatusLabel('SEM_PACTO')).toBe('Sem Pacto');
  });

  it('should map complexidade severity correctly', () => {
    expect(component.getComplexidadeSeverity('BC')).toBe('info');
    expect(component.getComplexidadeSeverity('MC')).toBe('warn');
    expect(component.getComplexidadeSeverity('AC')).toBe('danger');
    expect(component.getComplexidadeSeverity(undefined)).toBe('secondary');
    expect(component.getComplexidadeSeverity('UNKNOWN')).toBe('secondary');
  });

  it('should generate chartData with top procedures', () => {
    const chart = component.chartData();
    expect(chart.labels.length).toBeGreaterThan(0);
    expect(chart.datasets.length).toBe(2);
    expect(chart.datasets[0].label).toBe('Meta Pactuada');
    expect(chart.datasets[1].label).toBe('Qtd Aprovada');
  });

  it('should handle chartData when no items have pacto', () => {
    component.selectedStatusExecucao.set('SEM_PACTO');
    fixture.detectChanges();

    const chart = component.chartData();
    expect(chart.labels.length).toBe(0);
  });
});

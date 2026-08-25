import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { CompetenceService } from '../../core/services/competence.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { ProducaoService } from '../../core/services/producao.service';
import { MOCK_PRODUCAO_PROCEDIMENTOS } from '../../core/mocks/producao.mock';

import { signal, computed } from '@angular/core';
import { PeriodFilter } from '../../core/models/competence.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let competenceServiceMock: any;
  let instituicaoServiceMock: any;
  let producaoServiceMock: any;
  let periodFilterSignal: any;

  beforeEach(async () => {
    periodFilterSignal = signal<PeriodFilter>({
      mode: 'SPECIFIC',
      competencia: '202401',
      competenciaInicio: '202401',
      competenciaFim: '202401',
      mesesCount: 1,
      descricaoFormatada: '01/2024',
    });

    competenceServiceMock = {
      periodFilter: periodFilterSignal,
      periodMode: computed(() => periodFilterSignal().mode),
      mesesCount: computed(() => periodFilterSignal().mesesCount),
      periodoFormatado: computed(() => periodFilterSignal().descricaoFormatada),
      competencia: computed(() => periodFilterSignal().competencia ?? '202401'),
      competenciaFormatada: computed(() => '01/2024'),
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
      getProducaoPorPeriodo: vi.fn().mockImplementation((period: PeriodFilter) => {
        const comp = period.competencia || period.competenciaInicio || '202401';
        return of(MOCK_PRODUCAO_PROCEDIMENTOS.filter((p) => p.competencia === comp || !comp));
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
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
    component.competenceService.previousCompetence();
    expect(competenceServiceMock.previousCompetence).toHaveBeenCalled();

    component.competenceService.nextCompetence();
    expect(competenceServiceMock.nextCompetence).toHaveBeenCalled();
  });

  it('should contain the dashboard title and monitoring description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Dashboard Executivo CPA');
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

  it('should format currency correctly', () => {
    expect(component.formatCurrency(null)).toBe('R$ 0,00');
    expect(component.formatCurrency(undefined)).toBe('R$ 0,00');
    const formatted = component.formatCurrency(1500.5);
    expect(formatted).toContain('1.500,50');
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

  it('should render the CTA banner for monitoring module', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Acompanhamento Detalhado de Metas e Vínculos');
    expect(compiled.textContent).toContain('Acessar Grade de Monitoramento');
  });
});

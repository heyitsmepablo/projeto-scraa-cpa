import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MonitoramentoComponent } from './monitoramento.component';
import { CompetenceService } from '../../core/services/competence.service';
import { VinculoService } from '../../core/services/vinculo.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { ProducaoService } from '../../core/services/producao.service';
import { MOCK_PRODUCAO_PROCEDIMENTOS } from '../../core/mocks/producao.mock';

describe('MonitoramentoComponent', () => {
  let component: MonitoramentoComponent;
  let fixture: ComponentFixture<MonitoramentoComponent>;
  let competenceServiceMock: any;
  let vinculoServiceMock: any;
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

    vinculoServiceMock = {
      findAll: vi.fn().mockReturnValue(
        of([
          {
            id: 1,
            instituicaoId: 1,
            numero: 'CONV-001/2023',
            numeroProcessoSei: '6018.2023/0000001-1',
            tipoVinculo: 'CONVÊNIO',
            objeto: 'Prestação de serviços de saúde.',
            complexidade: ['MC', 'AC'],
            dataDaAssinatura: new Date('2023-01-01T00:00:00Z'),
            dataInicio: new Date('2023-01-01T00:00:00Z'),
            dataFim: new Date('2025-01-01T00:00:00Z'),
            valorTotal: 15000000.0,
          },
          {
            id: 2,
            instituicaoId: 2,
            numero: 'CONT-042/2022',
            numeroProcessoSei: '6018.2022/0000042-8',
            tipoVinculo: 'CONTRATO',
            objeto: 'Gestão hospitalar geral.',
            complexidade: ['BC', 'MC', 'AC'],
            dataDaAssinatura: new Date('2022-06-15T00:00:00Z'),
            dataInicio: new Date('2022-06-15T00:00:00Z'),
            dataFim: new Date('2024-12-31T00:00:00Z'),
            valorTotal: 8500000.0,
          },
        ])
      ),
    };

    producaoServiceMock = {
      getProducaoPorProcedimento: vi
        .fn()
        .mockImplementation((comp: string, _instId?: number, _cnes?: string, vinculoId?: number) => {
          let procs = MOCK_PRODUCAO_PROCEDIMENTOS.filter(
            (p) => p.competencia === comp || !comp
          );
          if (vinculoId !== undefined) {
            procs = procs.filter((p) => p.vinculoId === vinculoId);
          }
          return of(procs);
        }),
    };

    await TestBed.configureTestingModule({
      imports: [MonitoramentoComponent],
      providers: [
        { provide: CompetenceService, useValue: competenceServiceMock },
        { provide: VinculoService, useValue: vinculoServiceMock },
        { provide: InstituicaoService, useValue: instituicaoServiceMock },
        { provide: ProducaoService, useValue: producaoServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the standalone monitoramento component', () => {
    expect(component).toBeTruthy();
  });

  it('should format vinculo options and automatically select the first vinculo', () => {
    const options = component.vinculoOptions();
    expect(options.length).toBe(2);
    expect(options[0].value).toBe(1);
    expect(options[0].label).toContain('CONV-001/2023');
    expect(options[0].label).toContain('SANTA CASA DE MISERICÓRDIA');

    expect(component.selectedVinculoId()).toBe(1);
    expect(component.selectedVinculo()?.numero).toBe('CONV-001/2023');
  });

  it('should calculate KPIs accurately for the selected vinculo', () => {
    const kpis = component.kpis();
    expect(kpis.totalItens).toBeGreaterThan(0);
    expect(kpis.totalPactuado).toBeGreaterThan(0);
    expect(kpis.totalAprovado).toBeGreaterThan(0);
    expect(kpis.totalFinanceiro).toBeGreaterThan(0);
    expect(kpis.percentualGlobal).toBeGreaterThan(0);
    expect(kpis.totalDentro + kpis.totalAcima + kpis.totalAbaixo + kpis.totalSemPacto).toBe(kpis.totalItens);
  });

  it('should filter procedures by text search on SIGTAP code or procedure name', () => {
    const initialCount = component.filteredProcedimentos().length;
    expect(initialCount).toBeGreaterThan(0);

    // Search by partial procedure name
    component.globalFilterText.set('CONSULTA');
    fixture.detectChanges();
    const searchByName = component.filteredProcedimentos();
    expect(searchByName.every((p) => p.noProcedimento.includes('CONSULTA'))).toBe(true);

    // Search by SIGTAP code
    component.globalFilterText.set('0301010072');
    fixture.detectChanges();
    const searchByCode = component.filteredProcedimentos();
    expect(searchByCode.every((p) => p.coProcedimento.includes('0301010072'))).toBe(true);

    // Clear filters
    component.resetFilters();
    expect(component.globalFilterText()).toBe('');
    expect(component.filteredProcedimentos().length).toBe(initialCount);
  });

  it('should filter procedures by status and complexity', () => {
    component.selectedStatus.set('DENTRO');
    fixture.detectChanges();
    expect(component.filteredProcedimentos().every((p) => p.statusExecucao === 'DENTRO')).toBe(true);

    component.selectedStatus.set('ALL');
    component.selectedComplexidade.set('AC');
    fixture.detectChanges();
    expect(component.filteredProcedimentos().every((p) => p.complexidade === 'AC')).toBe(true);
  });

  it('should format SIGTAP code correctly', () => {
    expect(component.formatSigtapCode('0301010072')).toBe('03.01.01.007-2');
    expect(component.formatSigtapCode('0205020097')).toBe('02.05.02.009-7');
    expect(component.formatSigtapCode('')).toBe('-');
    expect(component.formatSigtapCode(undefined)).toBe('-');
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(null)).toBe('R$ 0,00');
    expect(component.formatCurrency(undefined)).toBe('R$ 0,00');
    const formatted = component.formatCurrency(25000.5);
    expect(formatted).toContain('25.000,50');
  });

  it('should clamp percentages safely between 0 and 100', () => {
    expect(component.getClampedPercent(null)).toBe(0);
    expect(component.getClampedPercent(undefined)).toBe(0);
    expect(component.getClampedPercent(50)).toBe(50);
    expect(component.getClampedPercent(150)).toBe(100);
  });

  it('should map status and complexity severities correctly', () => {
    expect(component.getStatusSeverity('DENTRO')).toBe('success');
    expect(component.getStatusSeverity('ACIMA')).toBe('warn');
    expect(component.getStatusSeverity('ABAIXO')).toBe('danger');
    expect(component.getStatusSeverity('SEM_PACTO')).toBe('secondary');

    expect(component.getComplexidadeSeverity('BC')).toBe('info');
    expect(component.getComplexidadeSeverity('MC')).toBe('warn');
    expect(component.getComplexidadeSeverity('AC')).toBe('danger');
    expect(component.getComplexidadeSeverity(undefined)).toBe('secondary');
  });

  it('should return correct CSS classes for percentage text based on status', () => {
    expect(component.getPercTextClass('DENTRO')).toContain('text-emerald-600');
    expect(component.getPercTextClass('ACIMA')).toContain('text-amber-600');
    expect(component.getPercTextClass('ABAIXO')).toContain('text-rose-600');
    expect(component.getPercTextClass('SEM_PACTO')).toContain('text-surface-600');
  });

  it('should return correct progress bar style classes based on status', () => {
    expect(component.getProgressBarClass('DENTRO')).toBe('p-progressbar-emerald');
    expect(component.getProgressBarClass('ACIMA')).toBe('p-progressbar-amber');
    expect(component.getProgressBarClass('ABAIXO')).toBe('p-progressbar-rose');
    expect(component.getProgressBarClass('SEM_PACTO')).toBe('p-progressbar-slate');
  });

  it('should update selectedVinculo when selectedVinculoId changes or is invalid', () => {
    component.selectedVinculoId.set(2);
    fixture.detectChanges();
    expect(component.selectedVinculo()?.id).toBe(2);
    expect(component.selectedVinculo()?.numero).toBe('CONT-042/2022');

    component.selectedVinculoId.set(9999);
    fixture.detectChanges();
    expect(component.selectedVinculo()).toBeUndefined();

    // Setting null triggers auto-select effect resetting to first vinculo
    component.selectedVinculoId.set(null);
    fixture.detectChanges();
    expect(component.selectedVinculoId()).toBe(1);
    expect(component.selectedVinculo()?.id).toBe(1);
  });

  it('should compute procedimentosFormatados with diferencaFisico and formatted SIGTAP', () => {
    const formatted = component.procedimentosFormatados();
    expect(formatted.length).toBeGreaterThan(0);
    const first = formatted[0];
    expect(first.coProcedimentoFormatado).toMatch(/\d{2}\.\d{2}\.\d{2}\.\d{3}-\d/);
    if (first.qtdPactuadaMensal !== null) {
      expect(first.diferencaFisico).toBe(first.qtdAprovada - first.qtdPactuadaMensal);
    }
  });

  it('should export CSV data with formatted columns and initiate download', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    component.exportarDados();

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('should do nothing when exportarDados is called with empty data', () => {
    component.selectedStatus.set('SEM_PACTO');
    component.selectedComplexidade.set('BC');
    fixture.detectChanges();

    // Set search filter that yields empty results
    component.globalFilterText.set('NON_EXISTENT_PROCEDURE_XYZ');
    fixture.detectChanges();

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    component.exportarDados();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
  });
});

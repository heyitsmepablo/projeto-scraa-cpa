import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MonitoramentoComponent, SigtapTreeNodeData } from './monitoramento';
import {
  formatSigtapCode,
  formatCurrency,
  getClampedPercent,
  getPercTextClass,
  getSaldoFinanceiroClass,
  getProgressBarClass,
  getStatusLabel,
  getStatusSeverity,
  getComplexidadeSeverity,
} from './utils/monitoramento.utils';
import { CompetenceService } from '../../core/services/competence/competence';
import { VinculoService } from '../../core/services/vinculo/vinculo';
import { InstituicaoService } from '../../core/services/instituicao/instituicao';
import { ProducaoService } from '../../core/services/producao/producao';
import { MOCK_PRODUCAO_PROCEDIMENTOS } from '../../core/mocks/producao.mock';

import { signal, computed } from '@angular/core';
import { PeriodFilter } from '../../core/models/competence.model';

describe('MonitoramentoComponent', () => {
  let component: MonitoramentoComponent;
  let fixture: ComponentFixture<MonitoramentoComponent>;
  let competenceServiceMock: any;
  let vinculoServiceMock: any;
  let instituicaoServiceMock: any;
  let producaoServiceMock: any;
  let periodFilterSignal: any;

  const mockInstituicoes = [
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
  ];

  const mockVinculos = [
    {
      id: 1,
      instituicaoId: 1,
      numero: 'CONV-001/2023',
      numeroProcessoSei: '6018.2023/0000001-1',
      tipoVinculo: 'CONVÊNIO',
      objeto: 'Prestação de serviços de saúde ambulatorial e hospitalar.',
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
  ];

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
      globalBounds: computed(() => ({
        competenciaInicio: '202301',
        competenciaFim: '202612',
        descricao: 'Consolidação Global da Rede (01/2023 a 12/2026)',
        mesesCount: 48,
        contexto: 'DASHBOARD',
      })),
      setCompetence: vi.fn((c) =>
        periodFilterSignal.set({
          mode: 'SPECIFIC',
          competencia: c,
          competenciaInicio: c,
          competenciaFim: c,
          mesesCount: 1,
          descricaoFormatada: c,
        }),
      ),
      setSpecificCompetence: vi.fn(),
      setRange: vi.fn(),
      setGlobal: vi.fn(),
      setGlobalBounds: vi.fn(),
      resetGlobalBounds: vi.fn(),
      applyGlobal: vi.fn(),
      previousCompetence: vi.fn(),
      nextCompetence: vi.fn(),
      countMonthsBetween: vi.fn((inicio: string, fim: string) => {
        if (!inicio || !fim || inicio.length !== 6 || fim.length !== 6) return 1;
        const anoInicio = parseInt(inicio.substring(0, 4), 10);
        const mesInicio = parseInt(inicio.substring(4, 6), 10);
        const anoFim = parseInt(fim.substring(0, 4), 10);
        const mesFim = parseInt(fim.substring(4, 6), 10);
        const count = (anoFim - anoInicio) * 12 + (mesFim - mesInicio) + 1;
        return count > 0 ? count : 1;
      }),
      formatCompetenciaShort: vi.fn((raw: string | null) => {
        if (!raw || raw.length !== 6) return raw || '';
        return `${raw.substring(4, 6)}/${raw.substring(0, 4)}`;
      }),
    };

    instituicaoServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockInstituicoes)),
    };

    vinculoServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockVinculos)),
    };

    producaoServiceMock = {
      getProducaoPorProcedimento: vi
        .fn()
        .mockImplementation(
          (comp: string, _instId?: number, _cnes?: string, vinculoId?: number) => {
            let procs = MOCK_PRODUCAO_PROCEDIMENTOS.filter((p) => p.competencia === comp || !comp);
            if (vinculoId !== undefined) {
              procs = procs.filter((p) => p.vinculoId === vinculoId);
            }
            return of(procs);
          },
        ),
      getProducaoPorPeriodo: vi
        .fn()
        .mockImplementation(
          (period: PeriodFilter, _instId?: number, _cnes?: string, vinculoId?: number) => {
            const comp = period.competencia || period.competenciaInicio || '202401';
            let procs = MOCK_PRODUCAO_PROCEDIMENTOS.filter((p) => p.competencia === comp || !comp);
            if (vinculoId !== undefined) {
              procs = procs.filter((p) => p.vinculoId === vinculoId);
            }
            return of(procs);
          },
        ),
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

  describe('1. Inicialização e Contexto do Vínculo', () => {
    it('deve criar o componente standalone com sucesso', () => {
      expect(component).toBeTruthy();
    });

    it('deve formatar as opções de vínculo e auto-selecionar o primeiro vínculo ativo', () => {
      const options = component.vinculoOptions();
      expect(options.length).toBe(2);
      expect(options[0].value).toBe(1);
      expect(options[0].label).toContain('CONV-001/2023');
      expect(options[0].label).toContain('SANTA CASA DE MISERICÓRDIA');
      expect(options[0].label).toContain('CONVÊNIO');

      expect(component.selectedVinculoId()).toBe(1);
      expect(component.selectedVinculo()?.numero).toBe('CONV-001/2023');
      expect(component.selectedVinculo()?.instituicao?.nome).toBe('SANTA CASA DE MISERICÓRDIA');
    });

    it('deve atualizar selectedVinculo ao mudar o selectedVinculoId', () => {
      component.selectedVinculoId.set(2);
      fixture.detectChanges();
      expect(component.selectedVinculo()?.id).toBe(2);
      expect(component.selectedVinculo()?.numero).toBe('CONT-042/2022');

      component.selectedVinculoId.set(9999);
      fixture.detectChanges();
      expect(component.selectedVinculo()).toBeUndefined();

      component.selectedVinculoId.set(null);
      fixture.detectChanges();
      expect(component.selectedVinculo()).toBeUndefined();
    });
  });

  describe('2. Cálculo dos 5 Metric Cards (Físico vs Financeiro)', () => {
    it('deve calcular com precisão os 5 KPIs para o vínculo selecionado', () => {
      const kpis = component.kpis();
      const procs = component.filteredProcedimentos();

      // Cálculo manual esperado
      let expPactuado = 0;
      let expAprovado = 0;
      let expFinancPactuado = 0;
      let expFinancAprovado = 0;
      let expComPacto = 0;

      for (const p of procs) {
        expAprovado += p.qtdAprovada || 0;
        expFinancAprovado += p.vlrAprovado || 0;
        if (p.qtdPactuadaMensal !== null && p.qtdPactuadaMensal > 0) {
          expPactuado += p.qtdPactuadaMensal;
          expComPacto++;
        }
        if (p.vlrPactuado !== null && p.vlrPactuado !== undefined && p.vlrPactuado > 0) {
          expFinancPactuado += p.vlrPactuado;
        }
      }

      // KPI 1: Físico Pactuado
      expect(kpis.totalPactuado).toBe(expPactuado);
      expect(kpis.totalComPacto).toBe(expComPacto);

      // KPI 2: Físico Aprovado
      expect(kpis.totalAprovado).toBe(expAprovado);
      expect(kpis.saldoFisico).toBe(expAprovado - expPactuado);

      // KPI 3: Financeiro Pactuado
      expect(kpis.totalFinanceiroPactuado).toBe(expFinancPactuado);

      // KPI 4: Financeiro Aprovado
      expect(kpis.totalFinanceiro).toBe(expFinancAprovado);
      const expPercFinanc =
        expFinancPactuado > 0 ? (expFinancAprovado / expFinancPactuado) * 100 : 100;
      expect(kpis.percentualGlobalFinanceiro).toBeCloseTo(expPercFinanc, 1);

      // KPI 5: Saldo Financeiro Global
      const expSaldoFinanc = expFinancAprovado - expFinancPactuado;
      expect(kpis.saldoFinanceiroGlobal).toBeCloseTo(expSaldoFinanc, 2);

      // Consistência de contadores de status
      expect(kpis.totalDentro + kpis.totalAcima + kpis.totalAbaixo + kpis.totalSemPacto).toBe(
        kpis.totalItens,
      );
    });

    it('deve calcular status global de meta física conforme faixas percentuais', () => {
      const kpis = component.kpis();
      if (kpis.percentualGlobal > 105) {
        expect(kpis.statusGeralLabel).toBe('Acima da Meta');
        expect(kpis.statusGeralSeverity).toBe('warn');
      } else if (kpis.percentualGlobal < 95 && kpis.totalPactuado > 0) {
        expect(kpis.statusGeralLabel).toBe('Abaixo da Meta');
        expect(kpis.statusGeralSeverity).toBe('danger');
      } else {
        expect(kpis.statusGeralLabel).toBe('Dentro da Meta');
        expect(kpis.statusGeralSeverity).toBe('success');
      }
    });

    it('deve classificar o saldo financeiro global em Superávit, Déficit ou Dentro do Pactuado', () => {
      const kpis = component.kpis();
      if (kpis.saldoFinanceiroGlobal > 0.01) {
        expect(kpis.statusFinanceiroGlobalLabel).toBe('Superávit (+)');
        expect(kpis.statusFinanceiroGlobalSeverity).toBe('warn');
      } else if (kpis.saldoFinanceiroGlobal < -0.01) {
        expect(kpis.statusFinanceiroGlobalLabel).toBe('Déficit (-)');
        expect(kpis.statusFinanceiroGlobalSeverity).toBe('danger');
      } else {
        expect(kpis.statusFinanceiroGlobalLabel).toBe('Dentro do Pactuado');
        expect(kpis.statusFinanceiroGlobalSeverity).toBe('success');
      }
    });
  });

  describe('3. Alternância de Visualização (viewMode)', () => {
    it('deve inicializar no modo flat', () => {
      expect(component.viewMode()).toBe('flat');
    });

    it('deve permitir alternar para o modo tree', () => {
      component.viewMode.set('tree');
      fixture.detectChanges();
      expect(component.viewMode()).toBe('tree');
    });

    it('deve manter sincronizada a lista de nós na árvore quando os dados mudarem', () => {
      const nodes = component.treeNodes();
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0].data?.tipo).toBe('GRUPO');
    });
  });

  describe('4. Hierarquia SIGTAP e Rollups Multinível (Grupos e Subgrupos)', () => {
    it('deve estruturar a árvore hierárquica em GRUPO -> SUBGRUPO -> PROCEDIMENTO', () => {
      const nodes = component.treeNodes();
      expect(nodes.length).toBeGreaterThan(0);

      const firstGroup = nodes[0];
      expect(firstGroup.data?.tipo).toBe('GRUPO');
      expect(firstGroup.children).toBeDefined();
      expect(firstGroup.children!.length).toBeGreaterThan(0);

      const firstSubgroup = firstGroup.children![0];
      expect(firstSubgroup.data?.tipo).toBe('SUBGRUPO');
      expect(firstSubgroup.children).toBeDefined();
      expect(firstSubgroup.children!.length).toBeGreaterThan(0);

      const firstProc = firstSubgroup.children![0];
      expect(firstProc.data?.tipo).toBe('PROCEDIMENTO');
      expect(firstProc.leaf).toBe(true);
      expect(firstProc.data?.coProcedimentoFormatado).toBeDefined();
    });

    it('deve calcular corretamente os rollups de quantidades e valores nos subgrupos', () => {
      const nodes = component.treeNodes();
      for (const groupNode of nodes) {
        for (const subNode of groupNode.children || []) {
          const subData = subNode.data as SigtapTreeNodeData;
          const procs = subNode.children || [];

          let expectedQtdAprovada = 0;
          let expectedVlrAprovado = 0;
          let expectedVlrPactuado = 0;
          let expectedQtdPactuada = 0;
          let hasPacto = false;

          for (const pNode of procs) {
            const pData = pNode.data as SigtapTreeNodeData;
            expectedQtdAprovada += pData.qtdAprovada;
            expectedVlrAprovado += pData.vlrAprovado;
            if (pData.qtdPactuadaMensal !== null) {
              expectedQtdPactuada += pData.qtdPactuadaMensal;
              hasPacto = true;
            }
            if (pData.vlrPactuado !== null && pData.vlrPactuado !== undefined) {
              expectedVlrPactuado += pData.vlrPactuado;
            }
          }

          expect(subData.qtdAprovada).toBe(expectedQtdAprovada);
          expect(subData.vlrAprovado).toBeCloseTo(expectedVlrAprovado, 2);
          if (hasPacto) {
            expect(subData.qtdPactuadaMensal).toBe(expectedQtdPactuada);
            expect(subData.vlrPactuado).toBeCloseTo(expectedVlrPactuado, 2);
            expect(subData.diferencaFisico).toBe(expectedQtdAprovada - expectedQtdPactuada);
          } else {
            expect(subData.qtdPactuadaMensal).toBe(
              expectedQtdPactuada !== 0 ? expectedQtdPactuada : null,
            );
          }
        }
      }
    });

    it('deve calcular corretamente os rollups no nível do Grupo', () => {
      const nodes = component.treeNodes();
      for (const groupNode of nodes) {
        const grpData = groupNode.data as SigtapTreeNodeData;
        const subNodes = groupNode.children || [];

        let expectedQtdAprovada = 0;
        let expectedVlrAprovado = 0;
        let totalProcs = 0;

        for (const sNode of subNodes) {
          const sData = sNode.data as SigtapTreeNodeData;
          expectedQtdAprovada += sData.qtdAprovada;
          expectedVlrAprovado += sData.vlrAprovado;
          totalProcs += sData.totalProcedimentos || 0;
        }

        expect(grpData.qtdAprovada).toBe(expectedQtdAprovada);
        expect(grpData.vlrAprovado).toBeCloseTo(expectedVlrAprovado, 2);
        expect(grpData.totalProcedimentos).toBe(totalProcs);
      }
    });
  });

  describe('5. Ações de Expandir e Recolher Nós da Árvore', () => {
    it('deve recolher todos os nós ao chamar collapseAll', () => {
      component.collapseAll();
      fixture.detectChanges();
      const nodes = component.treeNodes();

      const verifyCollapsed = (node: any) => {
        expect(node.expanded).toBe(false);
        if (node.children) {
          node.children.forEach(verifyCollapsed);
        }
      };

      nodes.forEach(verifyCollapsed);
    });

    it('deve expandir todos os nós ao chamar expandAll', () => {
      component.collapseAll();
      fixture.detectChanges();
      component.expandAll();
      fixture.detectChanges();
      const nodes = component.treeNodes();

      const verifyExpanded = (node: any) => {
        expect(node.expanded).toBe(true);
        if (node.children) {
          node.children.forEach(verifyExpanded);
        }
      };

      nodes.forEach(verifyExpanded);
    });
  });

  describe('6. Filtros de Busca, Status e Complexidade', () => {
    it('deve filtrar procedimentos por busca textual parcial de nome', () => {
      component.globalFilterText.set('CONSULTA');
      fixture.detectChanges();
      const results = component.filteredProcedimentos();
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((p) => p.noProcedimento.toUpperCase().includes('CONSULTA'))).toBe(true);
    });

    it('deve filtrar procedimentos por código SIGTAP desformatado', () => {
      component.globalFilterText.set('0301010072');
      fixture.detectChanges();
      const results = component.filteredProcedimentos();
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((p) => p.coProcedimento.includes('0301010072'))).toBe(true);
    });

    it('deve filtrar procedimentos por grupo ou subgrupo na busca textual', () => {
      component.globalFilterText.set('DIAGNÓSTICA');
      fixture.detectChanges();
      const results = component.filteredProcedimentos();
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (p) =>
            (p.noGrupo || '').toUpperCase().includes('DIAGNÓSTICA') ||
            (p.noSubGrupo || '').toUpperCase().includes('DIAGNÓSTICA') ||
            p.noProcedimento.toUpperCase().includes('DIAGNÓSTICA'),
        ),
      ).toBe(true);
    });

    it('deve filtrar por status de execução', () => {
      component.selectedStatus.set('DENTRO');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.statusExecucao === 'DENTRO')).toBe(
        true,
      );

      component.selectedStatus.set('ACIMA');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.statusExecucao === 'ACIMA')).toBe(
        true,
      );

      component.selectedStatus.set('ABAIXO');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.statusExecucao === 'ABAIXO')).toBe(
        true,
      );

      component.selectedStatus.set('SEM_PACTO');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.statusExecucao === 'SEM_PACTO')).toBe(
        true,
      );
    });

    it('deve filtrar por complexidade', () => {
      component.selectedComplexidade.set('MC');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.complexidade === 'MC')).toBe(true);

      component.selectedComplexidade.set('AC');
      fixture.detectChanges();
      expect(component.filteredProcedimentos().every((p) => p.complexidade === 'AC')).toBe(true);
    });

    it('deve restaurar todos os filtros ao chamar resetFilters', () => {
      const initialCount = component.filteredProcedimentos().length;
      component.globalFilterText.set('TESTE');
      component.selectedStatus.set('ACIMA');
      component.selectedComplexidade.set('AC');
      fixture.detectChanges();

      component.resetFilters();
      fixture.detectChanges();

      expect(component.globalFilterText()).toBe('');
      expect(component.selectedStatus()).toBe('ALL');
      expect(component.selectedComplexidade()).toBe('ALL');
      expect(component.filteredProcedimentos().length).toBe(initialCount);
    });
  });

  describe('7. Funções Utilitárias e Helpers Visuais', () => {
    it('deve formatar código SIGTAP de 10 dígitos com máscara 00.00.00.000-0', () => {
      expect(formatSigtapCode('0301010072')).toBe('03.01.01.007-2');
      expect(formatSigtapCode('0205020097')).toBe('02.05.02.009-7');
      expect(formatSigtapCode('12345')).toBe('12345');
      expect(formatSigtapCode('')).toBe('-');
      expect(formatSigtapCode(undefined)).toBe('-');
    });

    it('deve formatar valores monetários em formato pt-BR BRL', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00');
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
      expect(formatCurrency(12500.75)).toContain('12.500,75');
      expect(formatCurrency(0)).toContain('0,00');
    });

    it('deve limitar percentuais entre 0 e 100 com getClampedPercent', () => {
      expect(getClampedPercent(null)).toBe(0);
      expect(getClampedPercent(undefined)).toBe(0);
      expect(getClampedPercent(-10)).toBe(0);
      expect(getClampedPercent(45.5)).toBe(45.5);
      expect(getClampedPercent(120)).toBe(100);
    });

    it('deve retornar classes de cor do texto de percentual', () => {
      expect(getPercTextClass('DENTRO')).toContain('text-emerald-600');
      expect(getPercTextClass('ACIMA')).toContain('text-amber-600');
      expect(getPercTextClass('ABAIXO')).toContain('text-rose-600');
      expect(getPercTextClass('SEM_PACTO')).toContain('text-surface-600');
      expect(getPercTextClass(undefined)).toContain('text-surface-600');
    });

    it('deve retornar classes de cor para saldo financeiro', () => {
      expect(getSaldoFinanceiroClass(500, 'DENTRO')).toContain('text-amber-600');
      expect(getSaldoFinanceiroClass(-250, 'ABAIXO')).toContain('text-rose-600');
      expect(getSaldoFinanceiroClass(0, 'DENTRO')).toContain('text-emerald-600');
      expect(getSaldoFinanceiroClass(100, 'SEM_PACTO')).toContain('text-surface-600');
    });

    it('deve retornar classes para a barra de progresso', () => {
      expect(getProgressBarClass('DENTRO')).toBe('p-progressbar-emerald');
      expect(getProgressBarClass('ACIMA')).toBe('p-progressbar-amber');
      expect(getProgressBarClass('ABAIXO')).toBe('p-progressbar-rose');
      expect(getProgressBarClass('SEM_PACTO')).toBe('p-progressbar-slate');
      expect(getProgressBarClass(undefined)).toBe('p-progressbar-slate');
    });

    it('deve retornar labels e severidades de status e complexidade', () => {
      expect(getStatusLabel('DENTRO')).toBe('Dentro da Meta');
      expect(getStatusLabel('ACIMA')).toBe('Acima da Meta');
      expect(getStatusLabel('ABAIXO')).toBe('Abaixo da Meta');
      expect(getStatusLabel('SEM_PACTO')).toBe('Sem Pacto');

      expect(getStatusSeverity('DENTRO')).toBe('success');
      expect(getStatusSeverity('ACIMA')).toBe('warn');
      expect(getStatusSeverity('ABAIXO')).toBe('danger');
      expect(getStatusSeverity('SEM_PACTO')).toBe('secondary');

      expect(getComplexidadeSeverity('BC')).toBe('info');
      expect(getComplexidadeSeverity('MC')).toBe('warn');
      expect(getComplexidadeSeverity('AC')).toBe('danger');
      expect(getComplexidadeSeverity(undefined)).toBe('secondary');
    });
  });

  describe('8. Exportação CSV com Hierarquia e Dados Financeiros', () => {
    it('deve exportar CSV gerando Blob com cabeçalhos completos e iniciar download', () => {
      let createdBlob: any = null;
      const createObjectURLSpy = vi
        .spyOn(URL, 'createObjectURL')
        .mockImplementation((blob: any) => {
          createdBlob = blob;
          return 'blob:mock-url-csv';
        });
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      component.exportarDados();

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
      expect(createdBlob).toBeTruthy();
      expect(createdBlob?.type).toBe('text/csv;charset=utf-8;');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('não deve acionar download se não houver dados filtrados para exportar', () => {
      component.globalFilterText.set('INEXISTENTE_XYZ_999');
      fixture.detectChanges();

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
      component.exportarDados();
      expect(createObjectURLSpy).not.toHaveBeenCalled();
      createObjectURLSpy.mockRestore();
    });
  });
});

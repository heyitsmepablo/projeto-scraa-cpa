import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { CompetenceService } from '../../core/services/competence';
import { InstituicaoService } from '../../core/services/instituicao';
import { ProducaoService } from '../../core/services/producao';
import { ProducaoPorProcedimento } from '../../core/models/producao.model';
import { DashboardKpis, SelectOption } from './models/dashboard.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DashboardFiltersComponent } from './components/dashboard-filters/dashboard-filters';
import { DashboardKpisComponent } from './components/dashboard-kpis/dashboard-kpis';
import { DashboardChartComponent } from './components/dashboard-chart/dashboard-chart';
import { DashboardCtaComponent } from './components/dashboard-cta/dashboard-cta';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    PageHeaderComponent,
    DashboardFiltersComponent,
    DashboardKpisComponent,
    DashboardChartComponent,
    DashboardCtaComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly producaoService = inject(ProducaoService);

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  // Estados reativos de filtros
  readonly selectedInstituicaoCnes = signal<string>('ALL');
  readonly selectedQuadrimestre = signal<string>('ALL');
  readonly selectedStatusExecucao = signal<string>('ALL');

  // Opções de Quadrimestre
  readonly quadrimestreOptions: SelectOption[] = [
    { label: 'Todos os Quadrimestres', value: 'ALL' },
    { label: '1º Quadrimestre (Jan-Abr)', value: '1º Quadrimestre' },
    { label: '2º Quadrimestre (Mai-Ago)', value: '2º Quadrimestre' },
    { label: '3º Quadrimestre (Set-Dez)', value: '3º Quadrimestre' },
  ];

  // Opções de Status
  readonly statusOptions: SelectOption[] = [
    { label: 'Todos os Status', value: 'ALL' },
    { label: 'Dentro da Meta (DENTRO)', value: 'DENTRO' },
    { label: 'Acima da Meta (ACIMA)', value: 'ACIMA' },
    { label: 'Abaixo da Meta (ABAIXO)', value: 'ABAIXO' },
    { label: 'Sem Pactuação (SEM_PACTO)', value: 'SEM_PACTO' },
  ];

  // Carregamento de instituições para dropdown
  private readonly instituicoesRaw = toSignal(this.instituicaoService.findAll(), { initialValue: [] });
  readonly instituicaoOptions = computed<SelectOption[]>(() => {
    const list = this.instituicoesRaw();
    return [
      { label: 'Todas as Instituições', value: 'ALL' },
      ...list.map((inst) => ({
        label: `${inst.nome} (${inst.cnes})`,
        value: inst.cnes,
      })),
    ];
  });

  // Carregamento reativo da produção por procedimento vinculado ao período selecionado (Mês/Recorte/Global) e CNES
  private readonly paramsObservable = combineLatest([
    toObservable(this.competenceService.periodFilter),
    toObservable(this.selectedInstituicaoCnes),
  ]);
  readonly rawProcedimentos = toSignal(
    this.paramsObservable.pipe(
      switchMap(([period, cnes]) => {
        const targetCnes = cnes !== 'ALL' ? cnes : undefined;
        return this.producaoService.getProducaoPorPeriodo(period, undefined, targetCnes);
      })
    ),
    { initialValue: [] }
  );

  readonly loading = computed(() => this.rawProcedimentos().length === 0);

  // Procedimentos filtrados pelos critérios do usuário
  readonly filteredProcedimentos = computed<ProducaoPorProcedimento[]>(() => {
    let procs = this.rawProcedimentos();
    const cnes = this.selectedInstituicaoCnes();
    const quad = this.selectedQuadrimestre();
    const status = this.selectedStatusExecucao();

    if (cnes !== 'ALL') {
      procs = procs.filter((p) => p.cnes === cnes);
    }
    if (quad !== 'ALL') {
      procs = procs.filter((p) => p.quadrimestre === quad);
    }
    if (status !== 'ALL') {
      procs = procs.filter((p) => p.statusExecucao === status);
    }

    return procs;
  });

  // KPIs consolidados
  readonly kpis = computed<DashboardKpis>(() => {
    const procs = this.filteredProcedimentos();
    let totalValorAprovado = 0;
    let totalValorProduzido = 0;
    let totalQtdAprovada = 0;
    let totalQtdProduzida = 0;
    let totalQtdPactuada = 0;

    let totalDentro = 0;
    let totalAcima = 0;
    let totalAbaixo = 0;
    let totalSemPacto = 0;

    for (const p of procs) {
      totalValorAprovado += p.vlrAprovado || 0;
      totalValorProduzido += p.vlrProduzido || 0;
      totalQtdAprovada += p.qtdAprovada || 0;
      totalQtdProduzida += p.qtdProduzida || 0;

      if (p.qtdPactuadaMensal) {
        totalQtdPactuada += p.qtdPactuadaMensal;
      }

      switch (p.statusExecucao) {
        case 'DENTRO':
          totalDentro++;
          break;
        case 'ACIMA':
          totalAcima++;
          break;
        case 'ABAIXO':
          totalAbaixo++;
          break;
        case 'SEM_PACTO':
          totalSemPacto++;
          break;
      }
    }

    const taxaExecucaoGeral =
      totalQtdPactuada > 0 ? (totalQtdAprovada / totalQtdPactuada) * 100 : 100;

    let statusGeralLabel = 'Dentro da Meta';
    let statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (taxaExecucaoGeral > 105) {
      statusGeralLabel = 'Acima da Meta';
      statusGeralSeverity = 'warn';
    } else if (taxaExecucaoGeral < 95 && totalQtdPactuada > 0) {
      statusGeralLabel = 'Abaixo da Meta';
      statusGeralSeverity = 'danger';
    }

    return {
      totalValorAprovado,
      totalValorProduzido,
      totalQtdAprovada,
      totalQtdProduzida,
      totalQtdPactuada,
      taxaExecucaoGeral,
      statusGeralLabel,
      statusGeralSeverity,
      totalProcedimentos: procs.length,
      totalDentro,
      totalAcima,
      totalAbaixo,
      totalSemPacto,
    };
  });

  // Configuração do gráfico Chart.js (Pactuado vs Aprovado)
  readonly chartData = computed(() => {
    const procs = this.filteredProcedimentos().filter((p) => p.qtdPactuadaMensal !== null);
    const topProcs = [...procs]
      .sort((a, b) => (b.qtdPactuadaMensal || 0) - (a.qtdPactuadaMensal || 0))
      .slice(0, 7);

    const labels = topProcs.map((p) => {
      const name = p.noProcedimento;
      return name.length > 22 ? name.substring(0, 20) + '...' : name;
    });

    const dataPactuado = topProcs.map((p) => p.qtdPactuadaMensal || 0);
    const dataAprovado = topProcs.map((p) => p.qtdAprovada || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Meta Pactuada',
          backgroundColor: '#94a3b8',
          borderColor: '#64748b',
          borderWidth: 1,
          borderRadius: 4,
          data: dataPactuado,
        },
        {
          label: 'Qtd Aprovada',
          backgroundColor: '#0ea5e9',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 4,
          data: dataAprovado,
        },
      ],
    };
  });

  readonly chartOptions: any = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: 'inherit',
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(160, 174, 192, 0.2)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }

  resetFilters(): void {
    this.selectedInstituicaoCnes.set('ALL');
    this.selectedQuadrimestre.set('ALL');
    this.selectedStatusExecucao.set('ALL');
  }
}

export { DashboardComponent as Dashboard };

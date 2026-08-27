import { Component, inject, computed, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ChartOptions } from 'chart.js';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { CompetenceService } from '../../core/services/competence/competence';
import { InstituicaoService } from '../../core/services/instituicao/instituicao';
import { ProducaoService } from '../../core/services/producao/producao';
import { ProducaoPorProcedimento } from '../../core/models/producao.model';
import { calcularStatusExecucao } from '../../core/models/domain-enums.model';
import { DashboardKpis, SelectOption } from './models/dashboard.model';
import { DashboardService } from './services/dashboard';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TemporalSelectorComponent } from '../../shared/components/temporal-selector/temporal-selector';
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
    TemporalSelectorComponent,
    DashboardFiltersComponent,
    DashboardKpisComponent,
    DashboardChartComponent,
    DashboardCtaComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);
  readonly competenceService = inject(CompetenceService);

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  // Exported properties to template
  readonly selectedInstituicaoCnes = this.dashboardService.selectedInstituicaoCnes;
  readonly selectedStatusExecucao = this.dashboardService.selectedStatusExecucao;
  readonly instituicaoOptions = this.dashboardService.instituicaoOptions;
  readonly kpis = this.dashboardService.kpis;
  readonly chartData = this.dashboardService.chartData;
  readonly loading = this.dashboardService.loading;
  
  readonly statusOptions: SelectOption[] = [
    { label: 'Todos os Status', value: 'ALL' },
    { label: 'Dentro da Meta (DENTRO)', value: 'DENTRO' },
    { label: 'Acima da Meta (ACIMA)', value: 'ACIMA' },
    { label: 'Abaixo da Meta (ABAIXO)', value: 'ABAIXO' },
    { label: 'Sem Pactuação (SEM_PACTO)', value: 'SEM_PACTO' },
  ];

  readonly chartOptions: ChartOptions<'bar'> = {
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

  ngOnInit(): void {
    this.competenceService.resetGlobalBounds?.();
  }

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }

  resetFilters(): void {
    this.dashboardService.resetFilters();
  }
}

export { DashboardComponent as Dashboard };

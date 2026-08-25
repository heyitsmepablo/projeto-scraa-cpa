import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';

import { CompetenceService } from '../../core/services/competence.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { ProducaoService } from '../../core/services/producao.service';
import { ProducaoPorProcedimento } from '../../core/models/producao.model';
import { StatusExecucao } from '../../core/models/domain-enums';

interface DashboardProcedimentoItem extends ProducaoPorProcedimento {
  coProcedimentoFormatado: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TooltipModule,
    ChartModule,
    ProgressBarModule,
    SortIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header Superior do Dashboard -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Dashboard de Monitoramento CPA
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Painel consolidado de apuração de produção SUS: Executado vs. Pactuado nos Planos Operativos
          </p>
        </div>

        <div class="flex items-center gap-3">
          <p-button
            icon="pi pi-chevron-left"
            [text]="true"
            severity="secondary"
            size="small"
            (onClick)="competenceService.previousCompetence()"
            pTooltip="Competência Anterior"
          />
          
          <div class="flex flex-col items-center">
            <span class="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Competência Ativa</span>
            <p-tag
              [value]="competenceService.competenciaFormatada()"
              severity="info"
              styleClass="text-sm font-bold px-3 py-1 font-mono shadow-xs"
            />
          </div>

          <p-button
            icon="pi pi-chevron-right"
            [text]="true"
            severity="secondary"
            size="small"
            (onClick)="competenceService.nextCompetence()"
            pTooltip="Próxima Competência"
          />
        </div>
      </div>

      <!-- Barra de Filtros Estratégicos -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <!-- Filtro de Estabelecimento / Instituição -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Estabelecimento (CNES):
            </label>
            <p-select
              [options]="instituicaoOptions()"
              [ngModel]="selectedInstituicaoCnes()"
              (ngModelChange)="selectedInstituicaoCnes.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas as Instituições"
              styleClass="w-full"
            />
          </div>

          <!-- Filtro de Quadrimestre -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Quadrimestre:
            </label>
            <p-select
              [options]="quadrimestreOptions"
              [ngModel]="selectedQuadrimestre()"
              (ngModelChange)="selectedQuadrimestre.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos os Quadrimestres"
              styleClass="w-full"
            />
          </div>

          <!-- Filtro de Status de Execução -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Status de Meta:
            </label>
            <p-select
              [options]="statusOptions"
              [ngModel]="selectedStatusExecucao()"
              (ngModelChange)="selectedStatusExecucao.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos os Status"
              styleClass="w-full"
            />
          </div>

          <!-- Ação / Limpar Filtros -->
          <div class="flex items-center">
            <p-button
              label="Limpar Filtros"
              icon="pi pi-filter-slash"
              [outlined]="true"
              severity="secondary"
              styleClass="w-full"
              (onClick)="resetFilters()"
            />
          </div>
        </div>
      </p-card>

      <!-- Grid de Metric Cards (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Total Valor Aprovado -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:shadow-sm transition-all">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Total Aprovado (R$)
              </span>
              <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {{ formatCurrency(kpis().totalValorAprovado) }}
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-wallet"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Físico Aprovado:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200 font-mono">{{ kpis().totalQtdAprovada | number }} un.</span>
          </div>
        </p-card>

        <!-- KPI 2: Total Valor Produzido -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:shadow-sm transition-all">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Total Apresentado (R$)
              </span>
              <div class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {{ formatCurrency(kpis().totalValorProduzido) }}
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-chart-line"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Físico Apresentado:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200 font-mono">{{ kpis().totalQtdProduzida | number }} un.</span>
          </div>
        </p-card>

        <!-- KPI 3: % Execução Geral -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:shadow-sm transition-all">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Execução de Metas
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono flex items-center gap-2">
                <span>{{ kpis().taxaExecucaoGeral | number: '1.1-1' }}%</span>
                <p-tag
                  [value]="kpis().statusGeralLabel"
                  [severity]="kpis().statusGeralSeverity"
                  styleClass="text-xs"
                />
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-percentage"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Meta Pactuada:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200 font-mono">{{ kpis().totalQtdPactuada | number }} un.</span>
          </div>
        </p-card>

        <!-- KPI 4: Itens & Alertas -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:shadow-sm transition-all">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Procedimentos Auditados
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono">
                {{ kpis().totalProcedimentos }}
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-list-check"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-emerald-600 font-bold font-mono">✓ {{ kpis().totalDentro }}</span>
            <span class="text-amber-600 font-bold font-mono">▲ {{ kpis().totalAcima }}</span>
            <span class="text-rose-600 font-bold font-mono">▼ {{ kpis().totalAbaixo }}</span>
            <span class="text-surface-500 font-bold font-mono">⚪ {{ kpis().totalSemPacto }}</span>
          </div>
        </p-card>
      </div>

      <!-- Gráfico Comparativo: Pactuado vs. Aprovado -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
            <div>
              <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 m-0">
                Pactuado vs. Aprovado (Principais Procedimentos)
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Comparativo quantitativo físico mensal das metas pactuadas contra a produção aprovada
              </p>
            </div>
            <div class="flex items-center gap-2">
              <p-tag value="Meta Física Mensal" severity="info" />
            </div>
          </div>

          <div class="w-full h-80 pt-2">
            @if (chartData().labels && chartData().labels.length > 0) {
              <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="300px" />
            } @else {
              <div class="w-full h-full flex flex-col items-center justify-center text-surface-400 gap-2">
                <i class="pi pi-chart-bar text-3xl"></i>
                <span class="text-sm">Nenhum dado pactuado disponível para o filtro selecionado.</span>
              </div>
            }
          </div>
        </div>
      </p-card>

      <!-- Tabela Analítica de Procedimentos -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <p-table
          #dt
          [value]="procedimentosFormatados()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [globalFilterFields]="['coProcedimento', 'coProcedimentoFormatado', 'noProcedimento', 'nomeInstituicao', 'complexidade', 'statusExecucao']"
          size="small"
          [loading]="loading()"
          styleClass="p-datatable-sm"
        >
          <ng-template #caption>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                  Grade Analítica de Monitoramento
                </span>
                <span class="text-xs text-surface-500 block">
                  {{ procedimentosFormatados().length }} itens filtrados na competência {{ competenceService.competenciaFormatada() }}
                </span>
              </div>

              <p-iconfield iconPosition="left">
                <p-inputicon class="pi pi-search" />
                <input
                  #searchInput
                  pInputText
                  type="text"
                  (input)="dt.filterGlobal(searchInput.value, 'contains')"
                  placeholder="Pesquisar procedimento, SIGTAP, CNES..."
                  class="w-full sm:w-72"
                />
              </p-iconfield>
            </div>
          </ng-template>

          <ng-template #header>
            <tr>
              <th pSortableColumn="coProcedimento" style="width: 150px">
                Código SIGTAP <p-sorticon field="coProcedimento" />
              </th>
              <th pSortableColumn="noProcedimento">
                Procedimento & Estabelecimento <p-sorticon field="noProcedimento" />
              </th>
              <th pSortableColumn="complexidade" style="width: 100px">
                Compl. <p-sorticon field="complexidade" />
              </th>
              <th pSortableColumn="qtdPactuadaMensal" class="text-right" style="width: 120px">
                Meta Mensal <p-sorticon field="qtdPactuadaMensal" />
              </th>
              <th pSortableColumn="qtdAprovada" class="text-right" style="width: 120px">
                Qtd Aprovada <p-sorticon field="qtdAprovada" />
              </th>
              <th pSortableColumn="vlrAprovado" class="text-right" style="width: 140px">
                Valor Aprovado <p-sorticon field="vlrAprovado" />
              </th>
              <th pSortableColumn="percExecucao" style="width: 160px">
                % Execução <p-sorticon field="percExecucao" />
              </th>
              <th pSortableColumn="statusExecucao" style="width: 150px">
                Status Meta <p-sorticon field="statusExecucao" />
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-item>
            <tr>
              <!-- Código SIGTAP -->
              <td>
                <span class="font-mono text-xs font-bold tracking-wider text-surface-900 dark:text-surface-100 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 inline-block">
                  {{ item.coProcedimentoFormatado }}
                </span>
              </td>

              <!-- Nome do Procedimento e Instituição -->
              <td>
                <div class="font-semibold text-surface-900 dark:text-surface-100 text-sm">
                  {{ item.noProcedimento }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{{ item.nomeInstituicao }}</span>
                  <span class="text-surface-300 dark:text-surface-700">•</span>
                  <span>CNES: {{ item.cnes }}</span>
                  <span class="text-surface-300 dark:text-surface-700">•</span>
                  <span class="italic text-[11px]">{{ item.noFinanciamento }}</span>
                </div>
              </td>

              <!-- Complexidade -->
              <td>
                <p-tag
                  [value]="item.complexidade"
                  [severity]="getComplexidadeSeverity(item.complexidade)"
                />
              </td>

              <!-- Meta Mensal -->
              <td class="text-right font-mono text-sm">
                @if (item.qtdPactuadaMensal !== null) {
                  <span class="font-bold text-surface-900 dark:text-surface-0">{{ item.qtdPactuadaMensal | number }}</span>
                } @else {
                  <span class="text-surface-400 italic text-xs">Sem Pacto</span>
                }
              </td>

              <!-- Qtd Aprovada -->
              <td class="text-right font-mono text-sm">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ item.qtdAprovada | number }}</span>
              </td>

              <!-- Valor Aprovado -->
              <td class="text-right font-mono text-sm font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(item.vlrAprovado) }}
              </td>

              <!-- % Execução -->
              <td>
                @if (item.percExecucao !== null) {
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-xs font-mono font-bold">
                      <span [ngClass]="getPercTextClass(item.statusExecucao)">{{ item.percExecucao | number: '1.1-1' }}%</span>
                    </div>
                    <p-progressbar
                      [value]="getClampedPercent(item.percExecucao)"
                      [showValue]="false"
                      [style]="{ height: '6px' }"
                    />
                  </div>
                } @else {
                  <span class="text-surface-400 text-xs italic">-</span>
                }
              </td>

              <!-- Tag Status -->
              <td>
                <p-tag
                  [value]="getStatusLabel(item.statusExecucao)"
                  [severity]="getStatusSeverity(item.statusExecucao)"
                />
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="8" class="text-center py-8 text-surface-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <i class="pi pi-inbox text-3xl text-surface-400"></i>
                  <span class="font-medium">Nenhum registro de produção encontrado com os filtros selecionados.</span>
                  <p-button
                    label="Limpar Filtros"
                    [text]="true"
                    size="small"
                    styleClass="mt-1"
                    (onClick)="resetFilters()"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
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
  readonly quadrimestreOptions = [
    { label: 'Todos os Quadrimestres', value: 'ALL' },
    { label: '1º Quadrimestre (Jan-Abr)', value: '1º Quadrimestre' },
    { label: '2º Quadrimestre (Mai-Ago)', value: '2º Quadrimestre' },
    { label: '3º Quadrimestre (Set-Dez)', value: '3º Quadrimestre' },
  ];

  // Opções de Status
  readonly statusOptions = [
    { label: 'Todos os Status', value: 'ALL' },
    { label: 'Dentro da Meta (DENTRO)', value: 'DENTRO' },
    { label: 'Acima da Meta (ACIMA)', value: 'ACIMA' },
    { label: 'Abaixo da Meta (ABAIXO)', value: 'ABAIXO' },
    { label: 'Sem Pactuação (SEM_PACTO)', value: 'SEM_PACTO' },
  ];

  // Carregamento de instituições para dropdown
  private readonly instituicoesRaw = toSignal(this.instituicaoService.findAll(), { initialValue: [] });
  readonly instituicaoOptions = computed(() => {
    const list = this.instituicoesRaw();
    return [
      { label: 'Todas as Instituições', value: 'ALL' },
      ...list.map((inst) => ({
        label: `${inst.nome} (${inst.cnes})`,
        value: inst.cnes,
      })),
    ];
  });

  // Carregamento reativo da produção por procedimento vinculado à competência global
  private readonly competenciaObservable = toObservable(this.competenceService.competencia);
  readonly rawProcedimentos = toSignal(
    this.competenciaObservable.pipe(
      switchMap((comp) => this.producaoService.getProducaoPorProcedimento(comp))
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

  // Lista com formatação de código SIGTAP
  readonly procedimentosFormatados = computed<DashboardProcedimentoItem[]>(() => {
    return this.filteredProcedimentos().map((p) => ({
      ...p,
      coProcedimentoFormatado: this.formatSigtapCode(p.coProcedimento),
    }));
  });

  // KPIs consolidados
  readonly kpis = computed(() => {
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
    // Pegamos os top 7 procedimentos com maior meta
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

  formatSigtapCode(code?: string): string {
    if (!code) return '-';
    const clean = code.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return code;
  }

  getClampedPercent(perc?: number | null): number {
    if (perc === null || perc === undefined) return 0;
    return Math.min(Math.max(perc, 0), 100);
  }

  getPercTextClass(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'ACIMA':
        return 'text-amber-600 dark:text-amber-400';
      case 'ABAIXO':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-surface-600 dark:text-surface-300';
    }
  }

  getStatusLabel(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'Dentro da Meta';
      case 'ACIMA':
        return 'Acima da Meta';
      case 'ABAIXO':
        return 'Abaixo da Meta';
      case 'SEM_PACTO':
        return 'Sem Pacto';
      default:
        return status;
    }
  }

  getStatusSeverity(status: StatusExecucao): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'DENTRO':
        return 'success';
      case 'ACIMA':
        return 'warn';
      case 'ABAIXO':
        return 'danger';
      case 'SEM_PACTO':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  getComplexidadeSeverity(complexidade?: string): 'info' | 'warn' | 'danger' | 'secondary' {
    switch (complexidade?.toUpperCase()) {
      case 'BC':
        return 'info';
      case 'MC':
        return 'warn';
      case 'AC':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}

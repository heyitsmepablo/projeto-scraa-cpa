import {
  Component,
  inject,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

import { CompetenceService } from '../../core/services/competence.service';
import { VinculoService } from '../../core/services/vinculo.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { ProducaoService } from '../../core/services/producao.service';
import { ProducaoPorProcedimento } from '../../core/models/producao.model';
import { StatusExecucao } from '../../core/models/domain-enums';
import { Vinculo } from '../../core/models/vinculo.model';

export interface MonitoramentoProcedimentoItem extends ProducaoPorProcedimento {
  coProcedimentoFormatado: string;
  diferencaFisico: number | null;
}

@Component({
  selector: 'app-monitoramento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TooltipModule,
    ProgressBarModule,
    SortIcon,
  ],
  styles: [`
    :host ::ng-deep {
      .p-progressbar-emerald .p-progressbar-value {
        background: #10b981 !important;
      }
      .p-progressbar-amber .p-progressbar-value {
        background: #f59e0b !important;
      }
      .p-progressbar-rose .p-progressbar-value {
        background: #f43f5e !important;
      }
      .p-progressbar-slate .p-progressbar-value {
        background: #64748b !important;
      }
    }
  `],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header Superior e Contexto com Ações -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
              Monitoramento de Execução de Vínculos
            </h1>
            <p-tag value="Plano Operativo vs DATASUS" severity="info" styleClass="text-xs" />
          </div>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Auditoria física e orçamentária detalhada por procedimento contratado
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Seletor de Contrato / Vínculo -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase text-surface-500 dark:text-surface-400 hidden sm:inline">Vínculo:</span>
            <p-select
              [options]="vinculoOptions()"
              [ngModel]="selectedVinculoId()"
              (ngModelChange)="selectedVinculoId.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um Vínculo"
              styleClass="w-72 sm:w-80 text-xs shadow-xs"
              [filter]="true"
              filterPlaceholder="Buscar contrato..."
              appendTo="body"
            />
          </div>

          <!-- Navegação de Competência Global -->
          <div class="flex items-center gap-2 bg-surface-0 dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 p-1 rounded-xl shadow-xs">
            <p-button
              icon="pi pi-chevron-left"
              [text]="true"
              severity="secondary"
              size="small"
              (onClick)="competenceService.previousCompetence()"
              pTooltip="Competência Anterior"
            />
            
            <div class="flex flex-col items-center px-1">
              <span class="text-[9px] font-bold uppercase tracking-wider text-surface-400">Competência</span>
              <p-tag
                [value]="competenceService.competenciaFormatada()"
                severity="contrast"
                styleClass="text-xs font-bold px-2 py-0.5 font-mono shadow-xs"
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

          <!-- Botão de Exportação Rápida CSV -->
          <p-button
            label="Exportar CSV"
            icon="pi pi-file-excel"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="shadow-xs text-xs"
            (onClick)="exportarDados()"
            [disabled]="procedimentosFormatados().length === 0"
            pTooltip="Exportar dados analíticos em formato CSV"
          />
        </div>
      </div>

      <!-- Card Hero do Vínculo Selecionado -->
      @if (selectedVinculo(); as vinculo) {
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 overflow-hidden">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-lg ring-1 ring-primary-200/60 dark:ring-primary-800/40">
                  <i class="pi pi-file-edit"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-base font-bold text-surface-900 dark:text-surface-0 font-mono">
                      {{ vinculo.numero }}
                    </span>
                    <p-tag
                      [value]="vinculo.tipoVinculo"
                      [severity]="vinculo.tipoVinculo === 'CONVÊNIO' ? 'info' : 'warn'"
                      styleClass="text-xs"
                    />
                  </div>
                  <span class="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                    <i class="pi pi-id-card text-surface-400 text-xs"></i>
                    Processo SEI: <strong class="font-mono text-surface-700 dark:text-surface-300">{{ vinculo.numeroProcessoSei }}</strong>
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 text-xs">
                <span class="text-surface-500">Valor Global Pactuado:</span>
                <span class="font-bold text-surface-900 dark:text-surface-0 font-mono text-base text-primary-600 dark:text-primary-400">
                  {{ formatCurrency(vinculo.valorTotal) }}
                </span>
              </div>
            </div>

            <!-- Detalhes do Estabelecimento com Ícones -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div class="flex items-start gap-2.5">
                <i class="pi pi-building text-primary-500 text-base mt-0.5"></i>
                <div>
                  <span class="text-surface-500 block">Instituição:</span>
                  <span class="font-semibold text-surface-800 dark:text-surface-200">{{ vinculo.instituicao?.nome || 'N/A' }}</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <i class="pi pi-id-card text-primary-500 text-base mt-0.5"></i>
                <div>
                  <span class="text-surface-500 block">CNES:</span>
                  <span class="font-mono font-semibold text-surface-800 dark:text-surface-200">{{ vinculo.instituicao?.cnes || 'N/A' }}</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <i class="pi pi-calendar text-primary-500 text-base mt-0.5"></i>
                <div>
                  <span class="text-surface-500 block">Período de Vigência:</span>
                  <span class="font-medium text-surface-800 dark:text-surface-200">
                    {{ vinculo.dataInicio | date: 'dd/MM/yyyy' }} até {{ (vinculo.dataFim | date: 'dd/MM/yyyy') || 'Indeterminado' }}
                  </span>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <i class="pi pi-sliders-h text-primary-500 text-base mt-0.5"></i>
                <div>
                  <span class="text-surface-500 block">Complexidade Pactuada:</span>
                  <div class="flex items-center gap-1 mt-0.5">
                    @for (c of vinculo.complexidade; track c) {
                      <p-tag [value]="c" [severity]="getComplexidadeSeverity(c)" styleClass="text-[10px]" />
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </p-card>
      }

      <!-- Grid de Metric Cards (Desempenho no Vínculo Selecionado) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Físico Pactuado -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Físico Pactuado
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono">
                {{ kpis().totalPactuado | number }} <span class="text-xs font-normal text-surface-500">un.</span>
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-bookmark"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Metas no Plano:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200">{{ kpis().totalComPacto }} procedimentos</span>
          </div>
        </p-card>

        <!-- KPI 2: Físico Aprovado (DATASUS) -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Físico Aprovado
              </span>
              <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {{ kpis().totalAprovado | number }} <span class="text-xs font-normal text-surface-500">un.</span>
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Saldo Físico Global:</span>
            <span
              class="font-bold font-mono"
              [ngClass]="kpis().saldoFisico >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
            >
              {{ kpis().saldoFisico >= 0 ? '+' : '' }}{{ kpis().saldoFisico | number }} un.
            </span>
          </div>
        </p-card>

        <!-- KPI 3: Financeiro Aprovado -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Financeiro Aprovado
              </span>
              <div class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {{ formatCurrency(kpis().totalFinanceiro) }}
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Produzido Apresentado:</span>
            <span class="font-bold text-surface-800 dark:text-surface-200 font-mono">{{ formatCurrency(kpis().totalFinanceiroProduzido) }}</span>
          </div>
        </p-card>

        <!-- KPI 4: Cumprimento Global & Status -->
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Cumprimento Global
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono flex items-center gap-2">
                <span>{{ kpis().percentualGlobal | number: '1.1-1' }}%</span>
                <p-tag
                  [value]="kpis().statusGeralLabel"
                  [severity]="kpis().statusGeralSeverity"
                  styleClass="text-xs"
                />
              </div>
            </div>
            <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40 flex items-center justify-center text-xl shadow-xs">
              <i class="pi pi-chart-pie"></i>
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

      <!-- Barra de Filtros da Grade Analítica -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <!-- Campo de Busca Textual Global -->
          <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Buscar Procedimento / SIGTAP:
            </label>
            <p-iconfield iconPosition="left">
              <p-inputicon class="pi pi-search" />
              <input
                pInputText
                type="text"
                [ngModel]="globalFilterText()"
                (ngModelChange)="globalFilterText.set($event)"
                placeholder="Ex: 0301010072 ou Consulta..."
                class="w-full"
              />
            </p-iconfield>
          </div>

          <!-- Filtro de Status da Meta -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Status da Meta:
            </label>
            <p-select
              [options]="statusOptions"
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectedStatus.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos os Status"
              styleClass="w-full"
            />
          </div>

          <!-- Filtro de Complexidade -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Complexidade:
            </label>
            <p-select
              [options]="complexidadeOptions"
              [ngModel]="selectedComplexidade()"
              (ngModelChange)="selectedComplexidade.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas as Complexidades"
              styleClass="w-full"
            />
          </div>

          <!-- Botão Limpar Filtros -->
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

      <!-- Grade Analítica Especializada (p-table) -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <p-table
          #dt
          [value]="procedimentosFormatados()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          size="small"
          [loading]="loading()"
          styleClass="p-datatable-sm"
        >
          <ng-template #caption>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                  Grade Analítica: Executado vs. Pactuado
                </span>
                <span class="text-xs text-surface-500 block">
                  Exibindo {{ procedimentosFormatados().length }} itens na competência {{ competenceService.competenciaFormatada() }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <p-tag
                  [value]="procedimentosFormatados().length + ' registros'"
                  severity="secondary"
                  styleClass="font-mono text-xs"
                />
              </div>
            </div>
          </ng-template>

          <ng-template #header>
            <tr>
              <th pSortableColumn="coProcedimento" style="width: 145px">
                Código SIGTAP <p-sorticon field="coProcedimento" />
              </th>
              <th pSortableColumn="noProcedimento">
                Procedimento SUS & Financiamento <p-sorticon field="noProcedimento" />
              </th>
              <th pSortableColumn="complexidade" style="width: 90px">
                Compl. <p-sorticon field="complexidade" />
              </th>
              <th pSortableColumn="qtdPactuadaMensal" class="text-right" style="width: 120px">
                Meta Mensal <p-sorticon field="qtdPactuadaMensal" />
              </th>
              <th pSortableColumn="qtdAprovada" class="text-right" style="width: 120px">
                Qtd Aprovada <p-sorticon field="qtdAprovada" />
              </th>
              <th pSortableColumn="diferencaFisico" class="text-right" style="width: 110px">
                Dif. Físico <p-sorticon field="diferencaFisico" />
              </th>
              <th pSortableColumn="vlrAprovado" class="text-right" style="width: 140px">
                Valor Aprovado <p-sorticon field="vlrAprovado" />
              </th>
              <th pSortableColumn="percExecucao" style="width: 150px">
                % Execução <p-sorticon field="percExecucao" />
              </th>
              <th pSortableColumn="statusExecucao" style="width: 135px">
                Status Meta <p-sorticon field="statusExecucao" />
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-item>
            <tr>
              <!-- Código SIGTAP Formatado -->
              <td>
                <span class="font-mono text-xs font-bold tracking-wider text-surface-900 dark:text-surface-100 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 inline-block">
                  {{ item.coProcedimentoFormatado }}
                </span>
              </td>

              <!-- Nome do Procedimento e Financiamento -->
              <td>
                <div
                  class="font-semibold text-surface-900 dark:text-surface-100 text-sm"
                  [pTooltip]="item.noProcedimento"
                  tooltipPosition="top"
                >
                  {{ item.noProcedimento }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-2">
                  <span class="font-mono text-[11px]">Bloco: {{ item.coFinanciamento || '04' }}</span>
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

              <!-- Meta Mensal Pactuada -->
              <td class="text-right font-mono text-sm">
                @if (item.qtdPactuadaMensal !== null) {
                  <span class="font-bold text-surface-900 dark:text-surface-0">{{ item.qtdPactuadaMensal | number }}</span>
                } @else {
                  <span class="text-surface-400 italic text-xs">Sem Pacto</span>
                }
              </td>

              <!-- Qtd Aprovada (DATASUS) -->
              <td class="text-right font-mono text-sm">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ item.qtdAprovada | number }}</span>
              </td>

              <!-- Diferença de Físico (Aprovado - Meta) -->
              <td class="text-right font-mono text-xs">
                @if (item.diferencaFisico !== null) {
                  <span
                    class="font-bold"
                    [ngClass]="item.diferencaFisico >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                  >
                    {{ item.diferencaFisico >= 0 ? '+' : '' }}{{ item.diferencaFisico | number }}
                  </span>
                } @else {
                  <span class="text-surface-400">-</span>
                }
              </td>

              <!-- Valor Aprovado -->
              <td class="text-right font-mono text-sm font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(item.vlrAprovado) }}
              </td>

              <!-- Barra e % Execução com cor semântica -->
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
                      [class]="getProgressBarClass(item.statusExecucao)"
                    />
                  </div>
                } @else {
                  <span class="text-surface-400 text-xs italic">-</span>
                }
              </td>

              <!-- Tag Status Execução -->
              <td>
                <p-tag
                  [value]="getStatusLabel(item.statusExecucao)"
                  [severity]="getStatusSeverity(item.statusExecucao)"
                />
              </td>
            </tr>
          </ng-template>

          <!-- Totalizadores no Rodapé da Tabela -->
          <ng-template #footer>
            <tr class="font-bold bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 border-t-2 border-surface-200 dark:border-surface-700">
              <td colspan="3" class="text-right uppercase text-xs tracking-wider text-surface-600 dark:text-surface-400 py-3">
                Totais da Competência:
              </td>
              <td class="text-right font-mono text-sm">
                {{ kpis().totalPactuado | number }}
              </td>
              <td class="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                {{ kpis().totalAprovado | number }}
              </td>
              <td class="text-right font-mono text-xs">
                <span
                  class="font-bold"
                  [ngClass]="kpis().saldoFisico >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                >
                  {{ kpis().saldoFisico >= 0 ? '+' : '' }}{{ kpis().saldoFisico | number }}
                </span>
              </td>
              <td class="text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                {{ formatCurrency(kpis().totalFinanceiro) }}
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <span class="font-mono text-xs font-bold" [ngClass]="getPercTextClass(kpis().statusGeralLabel === 'Dentro da Meta' ? 'DENTRO' : (kpis().statusGeralLabel === 'Acima da Meta' ? 'ACIMA' : 'ABAIXO'))">
                    {{ kpis().percentualGlobal | number: '1.1-1' }}%
                  </span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="kpis().statusGeralLabel"
                  [severity]="kpis().statusGeralSeverity"
                  styleClass="text-xs"
                />
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="9" class="text-center py-10 text-surface-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <i class="pi pi-inbox text-4xl text-surface-400"></i>
                  <span class="font-medium text-base">Nenhum procedimento encontrado.</span>
                  <p class="text-xs text-surface-400 max-w-md">
                    Não há registros de produção ou procedimentos pactuados correspondentes aos filtros selecionados para esta competência.
                  </p>
                  <p-button
                    label="Limpar Filtros"
                    [text]="true"
                    size="small"
                    styleClass="mt-2"
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
export class MonitoramentoComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly vinculoService = inject(VinculoService);
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly producaoService = inject(ProducaoService);

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  // Estados de filtros reativos
  readonly selectedVinculoId = signal<number | null>(null);
  readonly globalFilterText = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly selectedComplexidade = signal<string>('ALL');

  // Opções de Status
  readonly statusOptions = [
    { label: 'Todos os Status', value: 'ALL' },
    { label: 'Dentro da Meta (DENTRO)', value: 'DENTRO' },
    { label: 'Acima da Meta (ACIMA)', value: 'ACIMA' },
    { label: 'Abaixo da Meta (ABAIXO)', value: 'ABAIXO' },
    { label: 'Sem Pactuação (SEM_PACTO)', value: 'SEM_PACTO' },
  ];

  // Opções de Complexidade
  readonly complexidadeOptions = [
    { label: 'Todas as Complexidades', value: 'ALL' },
    { label: 'Atenção Básica (BC)', value: 'BC' },
    { label: 'Média Complexidade (MC)', value: 'MC' },
    { label: 'Alta Complexidade (AC)', value: 'AC' },
  ];

  // Carregamento de Vínculos e Instituições
  readonly vinculosRaw = toSignal(this.vinculoService.findAll(), { initialValue: [] });
  readonly instituicoesRaw = toSignal(this.instituicaoService.findAll(), { initialValue: [] });

  // Mapa de Instituições por ID
  private readonly instituicoesMap = computed(() => {
    const map = new Map<number, any>();
    for (const inst of this.instituicoesRaw()) {
      map.set(inst.id, inst);
    }
    return map;
  });

  // Vínculos enriquecidos com entidade Instituição
  readonly vinculosComInstituicao = computed<Vinculo[]>(() => {
    const vinculos = this.vinculosRaw();
    const instMap = this.instituicoesMap();
    return vinculos.map((v) => ({
      ...v,
      instituicao: v.instituicao || instMap.get(v.instituicaoId),
    }));
  });

  // Opções formatadas para o dropdown de vínculos
  readonly vinculoOptions = computed(() => {
    const list = this.vinculosComInstituicao();
    return list.map((v) => ({
      label: `${v.numero} - ${v.instituicao?.nome || 'Instituição'} (${v.tipoVinculo})`,
      value: v.id,
    }));
  });

  // Auto-selecionar o primeiro vínculo disponível
  constructor() {
    effect(() => {
      const list = this.vinculoOptions();
      const current = this.selectedVinculoId();
      if (!current && list.length > 0) {
        this.selectedVinculoId.set(list[0].value);
      }
    });
  }

  // Vínculo atualmente selecionado
  readonly selectedVinculo = computed<Vinculo | undefined>(() => {
    const id = this.selectedVinculoId();
    if (!id) return undefined;
    return this.vinculosComInstituicao().find((v) => v.id === id);
  });

  // Carregamento de procedimentos reativo combinando competência global e vínculo selecionado
  private readonly paramsObservable = combineLatest([
    toObservable(this.competenceService.competencia),
    toObservable(this.selectedVinculoId),
  ]);

  readonly rawProcedimentos = toSignal(
    this.paramsObservable.pipe(
      switchMap(([comp, vinculoId]) => {
        const vId = vinculoId || undefined;
        return this.producaoService.getProducaoPorProcedimento(comp, undefined, undefined, vId);
      })
    ),
    { initialValue: [] }
  );

  readonly loading = computed(() => this.rawProcedimentos().length === 0 && this.vinculoOptions().length > 0);

  // Procedimentos com filtros aplicados
  readonly filteredProcedimentos = computed<ProducaoPorProcedimento[]>(() => {
    let procs = this.rawProcedimentos();
    const search = this.globalFilterText().trim().toLowerCase();
    const status = this.selectedStatus();
    const comp = this.selectedComplexidade();

    if (search) {
      procs = procs.filter((p) => {
        const cleanCode = p.coProcedimento.replace(/\D/g, '');
        const searchClean = search.replace(/\D/g, '');
        const matchCode = searchClean.length > 0 && cleanCode.includes(searchClean);
        const matchName = p.noProcedimento.toLowerCase().includes(search);
        return matchCode || matchName;
      });
    }

    if (status !== 'ALL') {
      procs = procs.filter((p) => p.statusExecucao === status);
    }

    if (comp !== 'ALL') {
      procs = procs.filter((p) => p.complexidade?.toUpperCase() === comp);
    }

    return procs;
  });

  // Lista formatada com código SIGTAP e cálculo de saldo físico
  readonly procedimentosFormatados = computed<MonitoramentoProcedimentoItem[]>(() => {
    return this.filteredProcedimentos().map((p) => {
      const diferencaFisico =
        p.qtdPactuadaMensal !== null ? p.qtdAprovada - p.qtdPactuadaMensal : null;
      return {
        ...p,
        coProcedimentoFormatado: this.formatSigtapCode(p.coProcedimento),
        diferencaFisico,
      };
    });
  });

  // Cálculos de KPIs consolidados para o vínculo
  readonly kpis = computed(() => {
    const procs = this.filteredProcedimentos();
    let totalPactuado = 0;
    let totalAprovado = 0;
    let totalFinanceiro = 0;
    let totalFinanceiroProduzido = 0;

    let totalDentro = 0;
    let totalAcima = 0;
    let totalAbaixo = 0;
    let totalSemPacto = 0;
    let totalComPacto = 0;

    for (const p of procs) {
      totalAprovado += p.qtdAprovada || 0;
      totalFinanceiro += p.vlrAprovado || 0;
      totalFinanceiroProduzido += p.vlrProduzido || 0;

      if (p.qtdPactuadaMensal !== null && p.qtdPactuadaMensal > 0) {
        totalPactuado += p.qtdPactuadaMensal;
        totalComPacto++;
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

    const percentualGlobal =
      totalPactuado > 0 ? (totalAprovado / totalPactuado) * 100 : 100;
    const saldoFisico = totalAprovado - totalPactuado;

    let statusGeralLabel = 'Dentro da Meta';
    let statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (percentualGlobal > 105) {
      statusGeralLabel = 'Acima da Meta';
      statusGeralSeverity = 'warn';
    } else if (percentualGlobal < 95 && totalPactuado > 0) {
      statusGeralLabel = 'Abaixo da Meta';
      statusGeralSeverity = 'danger';
    }

    return {
      totalPactuado,
      totalAprovado,
      totalFinanceiro,
      totalFinanceiroProduzido,
      percentualGlobal,
      saldoFisico,
      statusGeralLabel,
      statusGeralSeverity,
      totalItens: procs.length,
      totalComPacto,
      totalDentro,
      totalAcima,
      totalAbaixo,
      totalSemPacto,
    };
  });

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }

  resetFilters(): void {
    this.globalFilterText.set('');
    this.selectedStatus.set('ALL');
    this.selectedComplexidade.set('ALL');
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

  getProgressBarClass(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'p-progressbar-emerald';
      case 'ACIMA':
        return 'p-progressbar-amber';
      case 'ABAIXO':
        return 'p-progressbar-rose';
      case 'SEM_PACTO':
        return 'p-progressbar-slate';
      default:
        return 'p-progressbar-slate';
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

  exportarDados(): void {
    const dados = this.procedimentosFormatados();
    if (!dados || dados.length === 0) return;

    const headers = [
      'Código SIGTAP',
      'Procedimento',
      'Complexidade',
      'Financiamento',
      'Meta Mensal',
      'Qtd Aprovada',
      'Saldo Físico',
      'Valor Aprovado (R$)',
      '% Execução',
      'Status Meta',
    ];

    const rows = dados.map((item) => [
      `"${item.coProcedimentoFormatado}"`,
      `"${(item.noProcedimento || '').replace(/"/g, '""')}"`,
      `"${item.complexidade || ''}"`,
      `"${(item.noFinanciamento || '').replace(/"/g, '""')}"`,
      item.qtdPactuadaMensal !== null ? item.qtdPactuadaMensal : '',
      item.qtdAprovada ?? 0,
      item.diferencaFisico !== null ? item.diferencaFisico : '',
      item.vlrAprovado !== null && item.vlrAprovado !== undefined ? item.vlrAprovado.toFixed(2) : '0.00',
      item.percExecucao !== null && item.percExecucao !== undefined ? item.percExecucao.toFixed(1) : '',
      `"${this.getStatusLabel(item.statusExecucao)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const vinculoNumero = this.selectedVinculo()?.numero?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'vinculo';
      const comp = this.competenceService.competencia();
      link.setAttribute('href', url);
      link.setAttribute('download', `monitoramento_${vinculoNumero}_${comp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

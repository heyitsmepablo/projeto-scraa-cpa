import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { CompetenceService } from '../../core/services/competence.service';
import { PlanoOperativoService } from '../../core/services/plano-operativo.service';
import { PlanoOperativo, PlanoOperativoProcedimento, PlanoOperativoResumo } from '../../core/models/plano-operativo.model';

interface ProcedimentoViewItem extends PlanoOperativoProcedimento {
  coProcedimentoFormatado: string;
}

@Component({
  selector: 'app-planos-list',
  standalone: true,
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
    SortIcon
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Planos Operativos (Pactuações)
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Metas físicas pactuadas, procedimentos SIGTAP e teto orçamentário por vínculo
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Competência:</span>
          <p-tag [value]="competenceService.competenciaFormatada()" severity="info" class="font-mono shadow-xs" />
        </div>
      </div>

      <!-- Context Selector Header Bar -->
      <p-card class="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <label for="plano-select" class="text-sm font-semibold text-surface-700 dark:text-surface-300">
              Vínculo / Estabelecimento:
            </label>
            <p-select
              id="plano-select"
              [options]="planoOptions()"
              [ngModel]="selectedPlanoId()"
              (ngModelChange)="onPlanoSelect($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um Vínculo"
              class="w-full sm:w-96"
            />
          </div>

          <div class="flex items-center gap-2">
            @if (planoSelecionado(); as plano) {
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500">Status do Plano:</span>
                <p-tag
                  [value]="plano.vigente ? 'VIGENTE' : 'EXPIRADO'"
                  [severity]="plano.vigente ? 'success' : 'danger'"
                />
                @if (plano.vinculo?.tipoVinculo) {
                  <p-tag
                    [value]="plano.vinculo?.tipoVinculo"
                    severity="secondary"
                  />
                }
              </div>
            }
          </div>
        </div>
      </p-card>

      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Card 1: Total de Procedimentos -->
        <p-card class="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Procedimentos Pactuados
              </span>
              <div class="text-3xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono">
                {{ resumo().totalProcedimentos }}
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Itens ativos na tabela SIGTAP
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40 flex items-center justify-center text-xl">
              <i class="pi pi-list"></i>
            </div>
          </div>
        </p-card>

        <!-- Card 2: Meta Física Mensal -->
        <p-card class="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Meta Física Mensal Total
              </span>
              <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {{ resumo().metaFisicaTotal | number }}
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Execuções ambulatoriais / hospitalares
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 flex items-center justify-center text-xl">
              <i class="pi pi-chart-line"></i>
            </div>
          </div>
        </p-card>

        <!-- Card 3: Distribuição por Complexidade -->
        <p-card class="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div class="w-full">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Complexidade (Meta Física)
              </span>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <div class="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded text-xs">
                  <span class="font-bold text-blue-700 dark:text-blue-300">BC:</span>
                  <span class="font-mono text-blue-900 dark:text-blue-100">{{ resumo().distribuicaoComplexidade.bc | number }}</span>
                </div>
                <div class="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded text-xs">
                  <span class="font-bold text-amber-700 dark:text-amber-300">MC:</span>
                  <span class="font-mono text-amber-900 dark:text-amber-100">{{ resumo().distribuicaoComplexidade.mc | number }}</span>
                </div>
                <div class="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded text-xs">
                  <span class="font-bold text-rose-700 dark:text-rose-300">AC:</span>
                  <span class="font-mono text-rose-900 dark:text-rose-100">{{ resumo().distribuicaoComplexidade.ac | number }}</span>
                </div>
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400 mt-2">
                Baixa, Média e Alta Complexidade
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40 flex items-center justify-center text-xl shrink-0">
              <i class="pi pi-sliders-h"></i>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Procedimentos Table Card -->
      <p-card class="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <p-table
          #dt
          [value]="procedimentosFormatados()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [globalFilterFields]="['coProcedimento', 'coProcedimentoFormatado', 'procedimento.noProcedimento', 'procedimento.tpComplexidade']"
          size="small"
          [loading]="loading()"
        >
          <ng-template #caption>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                  Grade de Metas Pactuadas
                </span>
                <span class="text-xs text-surface-500 block">
                  {{ planoSelecionado()?.vinculo?.instituicao?.nome }} • {{ planoSelecionado()?.vinculo?.numero }}
                </span>
              </div>
              <p-iconfield iconPosition="left">
                <p-inputicon class="pi pi-search" />
                <input
                  #searchInput
                  pInputText
                  type="text"
                  (input)="dt.filterGlobal(searchInput.value, 'contains')"
                  placeholder="Buscar procedimento ou código..."
                  class="w-full sm:w-64"
                />
              </p-iconfield>
            </div>
          </ng-template>

          <ng-template #header>
            <tr>
              <th pSortableColumn="coProcedimento" style="width: 170px">
                Código SIGTAP <p-sorticon field="coProcedimento" />
              </th>
              <th pSortableColumn="procedimento.noProcedimento">
                Descrição do Procedimento <p-sorticon field="procedimento.noProcedimento" />
              </th>
              <th pSortableColumn="procedimento.tpComplexidade" style="width: 140px">
                Complexidade <p-sorticon field="procedimento.tpComplexidade" />
              </th>
              <th pSortableColumn="quantidadePactuadaMensal" class="text-right" style="width: 190px">
                Meta Mensal (Qtd.) <p-sorticon field="quantidadePactuadaMensal" />
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-item>
            <tr>
              <td>
                <span class="font-mono text-sm font-semibold tracking-wider text-surface-900 dark:text-surface-100 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded border border-surface-200 dark:border-surface-700">
                  {{ item.coProcedimentoFormatado }}
                </span>
              </td>
              <td>
                <div class="font-medium text-surface-900 dark:text-surface-100 text-sm">
                  {{ item.procedimento?.noProcedimento || 'Procedimento não especificado' }}
                </div>
                <div class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Financiamento: {{ getFinanciamentoLabel(item.procedimento?.coFinanciamento) }}
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getComplexidadeLabel(item.procedimento?.tpComplexidade)"
                  [severity]="getComplexidadeSeverity(item.procedimento?.tpComplexidade)"
                />
              </td>
              <td class="text-right">
                <span class="font-mono font-bold text-base text-surface-900 dark:text-surface-0">
                  {{ item.quantidadePactuadaMensal | number }}
                </span>
                <span class="text-xs text-surface-500 ml-1">/mês</span>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="text-center py-6 text-surface-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <i class="pi pi-info-circle text-2xl text-surface-400"></i>
                  <span>Nenhum procedimento pactuado encontrado para este plano operativo.</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class PlanosListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly planoOperativoService = inject(PlanoOperativoService);

  readonly planos = toSignal(this.planoOperativoService.findAll(), { initialValue: [] });
  readonly selectedPlanoId = signal<number>(1);

  readonly planoOptions = computed(() => {
    return this.planos().map(p => ({
      label: `${p.vinculo?.instituicao?.nome ?? 'Instituição'} • ${p.vinculo?.numero ?? 'Contrato'} ${p.vigente ? '✓' : '(Inativo)'}`,
      value: p.id
    }));
  });

  readonly planoSelecionado = computed<PlanoOperativo | undefined>(() => {
    const list = this.planos();
    const currentId = this.selectedPlanoId();
    return list.find(p => p.id === currentId) || list[0];
  });

  readonly procedimentosFormatados = computed<ProcedimentoViewItem[]>(() => {
    const plano = this.planoSelecionado();
    if (!plano || !plano.procedimentos) return [];

    return plano.procedimentos.map(p => ({
      ...p,
      coProcedimentoFormatado: this.formatSigtapCode(p.coProcedimento)
    }));
  });

  readonly resumo = computed<PlanoOperativoResumo>(() => {
    const procs = this.procedimentosFormatados();
    const totalProcedimentos = procs.length;
    const metaFisicaTotal = procs.reduce((acc, curr) => acc + curr.quantidadePactuadaMensal, 0);

    const distribuicao = {
      bc: 0,
      mc: 0,
      ac: 0
    };

    for (const proc of procs) {
      const c = proc.procedimento?.tpComplexidade?.toUpperCase();
      if (c === 'BC') distribuicao.bc += proc.quantidadePactuadaMensal;
      else if (c === 'MC') distribuicao.mc += proc.quantidadePactuadaMensal;
      else if (c === 'AC') distribuicao.ac += proc.quantidadePactuadaMensal;
    }

    return {
      planoOperativoId: this.selectedPlanoId(),
      totalProcedimentos,
      metaFisicaTotal,
      distribuicaoComplexidade: distribuicao
    };
  });

  readonly loading = computed(() => this.planos().length === 0);

  onPlanoSelect(id: number): void {
    this.selectedPlanoId.set(id);
  }

  formatSigtapCode(code?: string): string {
    if (!code) return '-';
    const clean = code.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return code;
  }

  getComplexidadeLabel(tp?: string): string {
    switch (tp?.toUpperCase()) {
      case 'BC': return 'Baixa (BC)';
      case 'MC': return 'Média (MC)';
      case 'AC': return 'Alta (AC)';
      default: return tp || 'Não Definido';
    }
  }

  getComplexidadeSeverity(tp?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (tp?.toUpperCase()) {
      case 'BC': return 'info';
      case 'MC': return 'warn';
      case 'AC': return 'danger';
      default: return 'secondary';
    }
  }

  getFinanciamentoLabel(coFin?: string): string {
    switch (coFin) {
      case '01': return '01 - Atenção Básica (PAB)';
      case '02': return '02 - Assistência Farmacêutica';
      case '04': return '04 - Média e Alta Complexidade (MAC)';
      case '05': return '05 - Vigilância em Saúde';
      case '06': return '06 - FAEC';
      default: return coFin ? `Bloco ${coFin}` : 'Não Informado';
    }
  }
}

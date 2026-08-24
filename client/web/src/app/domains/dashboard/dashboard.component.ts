import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CompetenceService } from '../../core/services/competence.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header do Domínio -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Dashboard de Monitoramento CPA
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Acompanhamento das execuções contratuais e metas dos Planos Operativos SUS
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Competência Ativa:</span>
          <p-tag
            [value]="competenceService.competenciaFormatada()"
            severity="info"
            styleClass="text-sm font-semibold px-3 py-1.5 font-mono shadow-xs"
          />
        </div>
      </div>

      <!-- Cards de Métricas Iniciais (Sprint 1 Stub) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 hover:shadow-sm transition-all bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span
                class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider"
              >
                Competência
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1 font-mono">
                {{ competenceService.competenciaFormatada() }}
              </div>
            </div>
            <div
              class="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 ring-1 ring-sky-200/60 dark:ring-sky-800/40 flex items-center justify-center shadow-xs"
            >
              <i class="pi pi-calendar text-xl"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-surface-500 dark:text-surface-400 font-medium">Filtro global sincronizado</div>
        </p-card>

        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 hover:shadow-sm transition-all bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span
                class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider"
              >
                Instituições Ativas
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1">--</div>
            </div>
            <div
              class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 flex items-center justify-center shadow-xs"
            >
              <i class="pi pi-building text-xl"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-surface-500 dark:text-surface-400 font-medium">Previsto para Sprint 2</div>
        </p-card>

        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 hover:shadow-sm transition-all bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span
                class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider"
              >
                Vínculos & Contratos
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1">--</div>
            </div>
            <div
              class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40 flex items-center justify-center shadow-xs"
            >
              <i class="pi pi-file-edit text-xl"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-surface-500 dark:text-surface-400 font-medium">Previsto para Sprint 2</div>
        </p-card>

        <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 hover:shadow-sm transition-all bg-surface-0 dark:bg-surface-900">
          <div class="flex items-center justify-between">
            <div>
              <span
                class="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider"
              >
                Planos Operativos
              </span>
              <div class="text-2xl font-extrabold text-surface-900 dark:text-surface-0 mt-1">--</div>
            </div>
            <div
              class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40 flex items-center justify-center shadow-xs"
            >
              <i class="pi pi-list-check text-xl"></i>
            </div>
          </div>
          <div class="mt-3 text-xs text-surface-500 dark:text-surface-400 font-medium">Previsto para Sprint 3</div>
        </p-card>
      </div>

      <!-- Painel Informativo da Sprint 1 -->
      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 border-l-4 border-l-primary-500 bg-surface-0 dark:bg-surface-900">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-primary-600 dark:text-primary-400 text-xl"></i>
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 m-0">
              Sprint 1 - Fundação e Estrutura Concluída com Sucesso
            </h3>
          </div>
          <p class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed m-0">
            A estrutura base do Ecossistema Pulsar CPA foi inicializada com Angular 22 Zoneless,
            PrimeNG 22.1 com tema Aura/Freya, tipagem completa baseada no schema Prisma e reatividade com
            Signals para a gestão global de competência.
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <p-tag value="Angular 22 Zoneless" severity="success" />
            <p-tag value="PrimeNG 22.1" severity="success" />
            <p-tag value="Signals Reativos" severity="info" />
            <p-tag value="Prisma First Typings" severity="warn" />
          </div>
        </div>
      </p-card>
    </div>
  `,
})
export class DashboardComponent {
  readonly competenceService = inject(CompetenceService);
}

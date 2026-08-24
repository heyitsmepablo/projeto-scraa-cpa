import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CompetenceService } from '../../core/services/competence.service';

@Component({
  selector: 'app-instituicoes-list',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Instituições Prestadoras SUS
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Gestão cadastral de estabelecimentos conveniados e contratados (Filantrópicos e Empresas)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Competência:</span>
          <p-tag [value]="competenceService.competenciaFormatada()" severity="info" styleClass="font-mono shadow-xs" />
        </div>
      </div>

      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <div class="py-8 flex flex-col items-center justify-center text-center gap-3">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 flex items-center justify-center text-2xl shadow-xs">
            <i class="pi pi-building"></i>
          </div>
          <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 m-0">
            Módulo de Instituições (Sprint 2)
          </h3>
          <p class="text-sm text-surface-600 dark:text-surface-400 max-w-md m-0">
            A listagem de instituições com filtros por CNES, Nome e Tipo (Filantrópico / Empresa) será implementada na Sprint 2.
          </p>
          <div class="flex flex-wrap gap-2 mt-2 justify-center">
            <p-tag value="Modelagem Instituicao Pronta" severity="success" />
            <p-tag value="InstituicaoService Injetável" severity="success" />
          </div>
        </div>
      </p-card>
    </div>
  `,
})
export class InstituicoesListComponent {
  readonly competenceService = inject(CompetenceService);
}

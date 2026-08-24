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
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Gestão cadastral de estabelecimentos conveniados e contratados (Filantrópicos e Empresas)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs text-surface-500">Competência:</span>
          <p-tag [value]="competenceService.competenciaFormatada()" severity="info" styleClass="font-mono" />
        </div>
      </div>

      <p-card styleClass="shadow-xs border border-surface-200 dark:border-surface-800">
        <div class="py-8 flex flex-col items-center justify-center text-center gap-3">
          <div class="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary flex items-center justify-center text-2xl">
            <i class="pi pi-building"></i>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
            Módulo de Instituições (Sprint 2)
          </h3>
          <p class="text-sm text-surface-500 max-w-md m-0">
            A listagem de instituições com filtros por CNES, Nome e Tipo (Filantrópico / Empresa) será implementada na Sprint 2.
          </p>
          <div class="flex gap-2 mt-2">
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

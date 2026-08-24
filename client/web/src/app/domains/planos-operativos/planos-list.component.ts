import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CompetenceService } from '../../core/services/competence.service';

@Component({
  selector: 'app-planos-list',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Planos Operativos (Pactuações)
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Metas pactuadas, procedimentos SIGTAP e complementações contratuais vigentes
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
            <i class="pi pi-list-check"></i>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
            Módulo de Planos Operativos (Sprint 3)
          </h3>
          <p class="text-sm text-surface-500 max-w-md m-0">
            Mapeamento dos procedimentos SIGTAP contratados e quantidades pactuadas mensais por vínculo.
          </p>
          <div class="flex gap-2 mt-2">
            <p-tag value="Modelagem Plano Operativo Pronta" severity="success" />
            <p-tag value="PlanoOperativoService Injetável" severity="success" />
          </div>
        </div>
      </p-card>
    </div>
  `,
})
export class PlanosListComponent {
  readonly competenceService = inject(CompetenceService);
}

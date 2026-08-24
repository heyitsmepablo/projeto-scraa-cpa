import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SortIcon } from 'primeng/table';

import { CompetenceService } from '../../core/services/competence.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { Instituicao } from '../../core/models/instituicao.model';

@Component({
  selector: 'app-instituicoes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SortIcon
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">
            Instituições Prestadoras SUS
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Gestão cadastral de estabelecimentos conveniados e contratados
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Competência:</span>
          <p-tag [value]="competenceService.competenciaFormatada()" severity="info" styleClass="font-mono shadow-xs" />
        </div>
      </div>

      <p-card styleClass="shadow-xs border border-surface-200/80 dark:border-surface-800 bg-surface-0 dark:bg-surface-900">
        <p-table
          #dt
          [value]="instituicoes() ?? []"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [globalFilterFields]="['nome', 'cnes', 'cnpj']"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          [loading]="loading()"
        >
          <ng-template #caption>
            <div class="flex justify-between items-center">
              <span class="text-lg font-semibold">Lista de Instituições</span>
              <p-iconfield iconPosition="left">
                <p-inputicon class="pi pi-search" />
                <input
                  #searchInput
                  pInputText
                  type="text"
                  (input)="dt.filterGlobal(searchInput.value, 'contains')"
                  placeholder="Pesquisar..."
                />
              </p-iconfield>
            </div>
          </ng-template>

          <ng-template #header>
            <tr>
              <th pSortableColumn="nome">Nome <p-sorticon field="nome" /></th>
              <th pSortableColumn="cnes">CNES <p-sorticon field="cnes" /></th>
              <th pSortableColumn="cnpj">CNPJ <p-sorticon field="cnpj" /></th>
              <th pSortableColumn="tipoInstituicao">Tipo <p-sorticon field="tipoInstituicao" /></th>
            </tr>
          </ng-template>

          <ng-template #body let-inst>
            <tr>
              <td>{{ inst.nome }}</td>
              <td class="font-mono text-sm">{{ inst.cnes }}</td>
              <td class="font-mono text-sm">{{ inst.cnpj || '-' }}</td>
              <td>
                <p-tag
                  [value]="inst.tipoInstituicao"
                  [severity]="getTipoSeverity(inst.tipoInstituicao)"
                />
              </td>
            </tr>
          </ng-template>
          
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="text-center py-4 text-surface-500">
                Nenhuma instituição encontrada.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class InstituicoesListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly instituicaoService = inject(InstituicaoService);

  readonly instituicoes = toSignal(this.instituicaoService.findAll());
  readonly loading = computed(() => this.instituicoes() === undefined);

  getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (tipo) {
      case 'FILANTRÓPICO': return 'success';
      case 'EMPRESA': return 'info';
      default: return 'secondary';
    }
  }
}

import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { CompetenceService } from '../../core/services/competence.service';
import { VinculoService } from '../../core/services/vinculo.service';
import { Vinculo } from '../../core/models/vinculo.model';

@Component({
  selector: 'app-vinculos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    TooltipModule,
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
            Vínculos Jurídicos & Contratos
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Gestão de Convênios, Contratos Administrativos, Aditivos e Vigências
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
          [value]="vinculos() ?? []"
          dataKey="id"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [globalFilterFields]="['numero', 'numeroProcessoSei', 'instituicao.nome']"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          [loading]="loading()"
          [expandedRowKeys]="expandedRows()"
        >
          <ng-template #caption>
            <div class="flex justify-between items-center">
              <span class="text-lg font-semibold">Lista de Contratos e Convênios</span>
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
              <th style="width: 3rem"></th>
              <th pSortableColumn="numero">Nº Documento <p-sorticon field="numero" /></th>
              <th pSortableColumn="instituicao.nome">Instituição <p-sorticon field="instituicao.nome" /></th>
              <th pSortableColumn="dataInicio">Início <p-sorticon field="dataInicio" /></th>
              <th pSortableColumn="dataFim">Fim <p-sorticon field="dataFim" /></th>
              <th pSortableColumn="valorTotal">Valor Total <p-sorticon field="valorTotal" /></th>
              <th>Status</th>
            </tr>
          </ng-template>

          <ng-template #body let-vinculo let-expanded="expanded">
            <tr>
              <td>
                <p-button 
                  type="button" 
                  pRipple 
                  [pRowToggler]="vinculo" 
                  [text]="true" 
                  [rounded]="true" 
                  [plain]="true" 
                  [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
              </td>
              <td class="font-mono text-sm">
                <div>{{ vinculo.numero }}</div>
                <div class="text-xs text-surface-500">{{ vinculo.numeroProcessoSei }}</div>
              </td>
              <td>{{ vinculo.instituicao?.nome }}</td>
              <td>{{ vinculo.dataInicio | date:'dd/MM/yyyy' }}</td>
              <td>{{ vinculo.dataFim ? (vinculo.dataFim | date:'dd/MM/yyyy') : '-' }}</td>
              <td class="font-mono">{{ vinculo.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <p-tag
                  [value]="vinculo.statusVigencia"
                  [severity]="vinculo.severityVigencia"
                />
              </td>
            </tr>
          </ng-template>

          <ng-template #expandedrow let-vinculo>
            <tr>
              <td colspan="7">
                <div class="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
                  <h5 class="text-sm font-semibold mb-3">Aditivos Contratuais</h5>
                  
                  <p-table [value]="vinculo.aditivos || []" dataKey="id" styleClass="p-datatable-sm">
                    <ng-template #header>
                      <tr>
                        <th>Nº Aditivo</th>
                        <th>Tipos</th>
                        <th>Processo SEI</th>
                        <th>Data Assinatura</th>
                        <th>Vigência (Fim)</th>
                        <th>Valor Aditivado</th>
                      </tr>
                    </ng-template>
                    <ng-template #body let-aditivo>
                      <tr>
                        <td class="font-mono text-sm">{{ aditivo.numero }}</td>
                        <td>
                          <div class="flex gap-1">
                            <p-tag *ngFor="let t of aditivo.tipoAditivo" [value]="t" severity="secondary" />
                          </div>
                        </td>
                        <td class="font-mono text-xs">{{ aditivo.numeroProcessoSei }}</td>
                        <td>{{ aditivo.dataDaAssinatura | date:'dd/MM/yyyy' }}</td>
                        <td>{{ aditivo.dataFim | date:'dd/MM/yyyy' }}</td>
                        <td class="font-mono">{{ aditivo.valorTotal ? (aditivo.valorTotal | currency:'BRL':'symbol':'1.2-2') : '-' }}</td>
                      </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                      <tr>
                        <td colspan="6" class="text-sm text-surface-500 py-3">Nenhum aditivo encontrado para este contrato.</td>
                      </tr>
                    </ng-template>
                  </p-table>
                </div>
              </td>
            </tr>
          </ng-template>
          
          <ng-template #emptymessage>
            <tr>
              <td colspan="7" class="text-center py-4 text-surface-500">
                Nenhum vínculo encontrado.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class VinculosListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly vinculoService = inject(VinculoService);

  readonly expandedRows = signal<{ [key: string]: boolean }>({});

  readonly vinculos = toSignal(
    this.vinculoService.findAll().pipe(
      map(vinculos => vinculos.map(v => ({
        ...v,
        statusVigencia: this.getVigenciaStatus(v.dataFim),
        severityVigencia: this.getVigenciaSeverity(v.dataFim)
      })))
    )
  );
  readonly loading = computed(() => this.vinculos() === undefined);

  getVigenciaStatus(dataFim?: string | Date | null): string {
    if (!dataFim) return 'Indeterminado';
    
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diffEmDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffEmDias < 0) return 'Expirado';
    if (diffEmDias <= 60) return 'Expirando';
    return 'Ativo';
  }

  getVigenciaSeverity(dataFim?: string | Date | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (!dataFim) return 'info';

    const hoje = new Date();
    const fim = new Date(dataFim);
    const diffEmDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffEmDias < 0) return 'danger';
    if (diffEmDias <= 60) return 'warn';
    return 'success';
  }
}

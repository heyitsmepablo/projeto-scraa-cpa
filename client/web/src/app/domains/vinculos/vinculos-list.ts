import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TagModule } from 'primeng/tag';

import { CompetenceService } from '../../core/services/competence';
import { VinculoService } from '../../core/services/vinculo';
import { VinculoView } from './models/vinculo-view.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { VinculosTableComponent } from './components/vinculos-table/vinculos-table';

@Component({
  selector: 'app-vinculos-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TagModule,
    PageHeaderComponent,
    VinculosTableComponent,
  ],
  templateUrl: './vinculos-list.html',
  styleUrl: './vinculos-list.css',
})
export class VinculosListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly vinculoService = inject(VinculoService);

  readonly expandedRows = signal<{ [key: string]: boolean }>({});

  readonly vinculos = toSignal(
    this.vinculoService.findAll().pipe(
      map((vinculos) =>
        vinculos.map((v) => ({
          ...v,
          statusVigencia: this.getVigenciaStatus(v.dataFim),
          severityVigencia: this.getVigenciaSeverity(v.dataFim),
        }))
      )
    )
  );
  readonly loading = computed(() => this.vinculos() === undefined);

  onExpandedRowsChange(rows: { [key: string]: boolean }): void {
    this.expandedRows.set(rows);
  }

  getVigenciaStatus(dataFim?: string | Date | null): string {
    if (!dataFim) return 'Indeterminado';

    const hoje = new Date();
    const fim = new Date(dataFim);
    const diffEmDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffEmDias < 0) return 'Expirado';
    if (diffEmDias <= 60) return 'Expirando';
    return 'Ativo';
  }

  getVigenciaSeverity(
    dataFim?: string | Date | null
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (!dataFim) return 'info';

    const hoje = new Date();
    const fim = new Date(dataFim);
    const diffEmDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffEmDias < 0) return 'danger';
    if (diffEmDias <= 60) return 'warn';
    return 'success';
  }
}

export { VinculosListComponent as VinculosList };

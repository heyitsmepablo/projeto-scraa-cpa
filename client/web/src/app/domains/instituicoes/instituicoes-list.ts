import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TagModule } from 'primeng/tag';

import { CompetenceService } from '../../core/services/competence/competence';
import { InstituicaoService } from '../../core/services/instituicao/instituicao';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { InstituicoesTableComponent } from './components/instituicoes-table/instituicoes-table';

@Component({
  selector: 'app-instituicoes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, PageHeaderComponent, InstituicoesTableComponent],
  templateUrl: './instituicoes-list.html',
  styleUrl: './instituicoes-list.css',
})
export class InstituicoesListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly instituicaoService = inject(InstituicaoService);

  readonly instituicoes = toSignal(this.instituicaoService.findAll());
  readonly loading = computed(() => this.instituicoes() === undefined);

  getTipoSeverity(
    tipo: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (tipo) {
      case 'FILANTRÓPICO':
        return 'success';
      case 'EMPRESA':
        return 'info';
      default:
        return 'secondary';
    }
  }
}

export { InstituicoesListComponent as InstituicoesList };

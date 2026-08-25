import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { CompetenceService } from '../../core/services/competence.service';
import { InstituicaoService } from '../../core/services/instituicao.service';
import { InstituicoesHeaderComponent } from './components/instituicoes-header/instituicoes-header.component';
import { InstituicoesTableComponent } from './components/instituicoes-table/instituicoes-table.component';

@Component({
  selector: 'app-instituicoes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InstituicoesHeaderComponent,
    InstituicoesTableComponent,
  ],
  templateUrl: './instituicoes-list.component.html',
  styleUrl: './instituicoes-list.component.css',
})
export class InstituicoesListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly instituicaoService = inject(InstituicaoService);

  readonly instituicoes = toSignal(this.instituicaoService.findAll());
  readonly loading = computed(() => this.instituicoes() === undefined);

  getTipoSeverity(
    tipo: string
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

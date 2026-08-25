import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PlanoOperativo, ProcedimentoViewItem } from '../../models/plano-operativo.model';

@Component({
  selector: 'app-plano-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    CardModule,
    TagModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SortIcon,
  ],
  templateUrl: './plano-table.component.html',
  styleUrl: './plano-table.component.css',
})
export class PlanoTableComponent {
  readonly procedimentos = input<ProcedimentoViewItem[]>([]);
  readonly loading = input<boolean>(false);
  readonly planoSelecionado = input<PlanoOperativo | undefined>();

  getComplexidadeLabel(tp?: string): string {
    switch (tp?.toUpperCase()) {
      case 'BC':
        return 'Baixa (BC)';
      case 'MC':
        return 'Média (MC)';
      case 'AC':
        return 'Alta (AC)';
      default:
        return tp || 'Não Definido';
    }
  }

  getComplexidadeSeverity(
    tp?: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (tp?.toUpperCase()) {
      case 'BC':
        return 'info';
      case 'MC':
        return 'warn';
      case 'AC':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getFinanciamentoLabel(coFin?: string): string {
    switch (coFin) {
      case '01':
        return '01 - Atenção Básica (PAB)';
      case '02':
        return '02 - Assistência Farmacêutica';
      case '04':
        return '04 - Média e Alta Complexidade (MAC)';
      case '05':
        return '05 - Vigilância em Saúde';
      case '06':
        return '06 - FAEC';
      default:
        return coFin ? `Bloco ${coFin}` : 'Não Informado';
    }
  }
}

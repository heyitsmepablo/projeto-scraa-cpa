import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Instituicao } from '../../../../core/models/instituicao.model';

@Component({
  selector: 'app-instituicoes-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    SortIcon,
  ],
  templateUrl: './instituicoes-table.component.html',
  styleUrl: './instituicoes-table.component.css',
})
export class InstituicoesTableComponent {
  readonly instituicoes = input<Instituicao[]>([]);
  readonly loading = input<boolean>(false);

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

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { PlanoOperativo } from '../../models/plano-operativo.model';

@Component({
  selector: 'app-plano-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, TagModule, SelectModule],
  templateUrl: './plano-header.component.html',
  styleUrl: './plano-header.component.css',
})
export class PlanoHeaderComponent {
  readonly planoOptions = input<{ label: string; value: number }[]>([]);
  readonly selectedPlanoId = input<number>(1);
  readonly planoSelecionado = input<PlanoOperativo | undefined>();
  readonly competenciaFormatada = input<string>('');

  readonly planoChange = output<number>();

  onSelect(id: number): void {
    this.planoChange.emit(id);
  }
}

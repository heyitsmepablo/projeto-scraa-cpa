import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectOption } from '../../models/monitoramento.model';

@Component({
  selector: 'app-monitoramento-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    SelectModule,
    ButtonModule,
    SelectButtonModule,
    TooltipModule,
  ],
  templateUrl: './monitoramento-header.component.html',
  styleUrl: './monitoramento-header.component.css',
})
export class MonitoramentoHeaderComponent {
  readonly vinculoOptions = input<SelectOption<number>[]>([]);
  readonly selectedVinculoId = input<number | null>(1);
  readonly periodoFormatado = input<string>('');
  readonly periodMode = input<string>('SPECIFIC');
  readonly viewMode = input<'flat' | 'tree'>('flat');
  readonly hasData = input<boolean>(true);

  readonly vinculoChange = output<number | null>();
  readonly previousCompetence = output<void>();
  readonly nextCompetence = output<void>();
  readonly viewModeChange = output<'flat' | 'tree'>();
  readonly exportCsv = output<void>();

  readonly viewModeOptions = [
    { label: 'Lista Plana', value: 'flat', icon: 'pi pi-list' },
    { label: 'Árvore SIGTAP', value: 'tree', icon: 'pi pi-sitemap' },
  ];
}

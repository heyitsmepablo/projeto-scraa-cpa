import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectOption } from '../../models/monitoramento.model';

@Component({
  selector: 'app-monitoramento-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SelectButtonModule,
  ],
  templateUrl: './monitoramento-filters.html',
  styleUrl: './monitoramento-filters.css',
})
export class MonitoramentoFiltersComponent {
  readonly globalFilterText = input<string>('');
  readonly selectedStatus = input<string>('ALL');
  readonly selectedComplexidade = input<string>('ALL');
  readonly statusOptions = input<SelectOption[]>([]);
  readonly complexidadeOptions = input<SelectOption[]>([]);
  readonly viewMode = input<'flat' | 'tree'>('flat');

  readonly filterTextChange = output<string>();
  readonly statusChange = output<string>();
  readonly complexidadeChange = output<string>();
  readonly viewModeChange = output<'flat' | 'tree'>();
  readonly reset = output<void>();
  readonly expandAll = output<void>();
  readonly collapseAll = output<void>();

  readonly viewModeOptions = [
    { label: 'Lista Plana', value: 'flat', icon: 'pi pi-list' },
    { label: 'Árvore SIGTAP', value: 'tree', icon: 'pi pi-sitemap' },
  ];
}

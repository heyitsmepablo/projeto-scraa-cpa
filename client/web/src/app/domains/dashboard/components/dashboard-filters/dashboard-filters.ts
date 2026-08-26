import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SelectOption } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, SelectModule, ButtonModule],
  templateUrl: './dashboard-filters.html',
  styleUrl: './dashboard-filters.css',
})
export class DashboardFiltersComponent {
  readonly instituicaoOptions = input<SelectOption[]>([]);
  readonly selectedInstituicaoCnes = input<string>('ALL');
  readonly selectedQuadrimestre = input<string>('ALL');
  readonly selectedStatusExecucao = input<string>('ALL');
  readonly quadrimestreOptions = input<SelectOption[]>([]);
  readonly statusOptions = input<SelectOption[]>([]);

  readonly instituicaoChange = output<string>();
  readonly quadrimestreChange = output<string>();
  readonly statusChange = output<string>();
  readonly reset = output<void>();
}

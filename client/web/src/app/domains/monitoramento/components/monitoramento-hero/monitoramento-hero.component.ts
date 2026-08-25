import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Vinculo } from '../../../../core/models/vinculo.model';

@Component({
  selector: 'app-monitoramento-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, CardModule, TagModule],
  templateUrl: './monitoramento-hero.component.html',
  styleUrl: './monitoramento-hero.component.css',
})
export class MonitoramentoHeroComponent {
  readonly vinculo = input<Vinculo | undefined>();

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }

  getComplexidadeSeverity(
    c: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (c?.toUpperCase()) {
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
}

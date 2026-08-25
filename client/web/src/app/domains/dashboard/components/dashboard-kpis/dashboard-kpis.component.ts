import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DashboardKpis } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, CardModule, TagModule],
  templateUrl: './dashboard-kpis.component.html',
  styleUrl: './dashboard-kpis.component.css',
})
export class DashboardKpisComponent {
  readonly kpis = input<DashboardKpis>({
    totalValorAprovado: 0,
    totalValorProduzido: 0,
    totalQtdAprovada: 0,
    totalQtdProduzida: 0,
    totalQtdPactuada: 0,
    taxaExecucaoGeral: 100,
    statusGeralLabel: 'Dentro da Meta',
    statusGeralSeverity: 'success',
    totalProcedimentos: 0,
    totalDentro: 0,
    totalAcima: 0,
    totalAbaixo: 0,
    totalSemPacto: 0,
  });
  readonly mesesCount = input<number>(1);

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }
}

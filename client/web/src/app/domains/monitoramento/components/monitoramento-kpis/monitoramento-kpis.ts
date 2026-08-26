import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { MonitoramentoKpis } from '../../models/monitoramento.model';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card';

@Component({
  selector: 'app-monitoramento-kpis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, TagModule, KpiCardComponent],
  templateUrl: './monitoramento-kpis.html',
  styleUrl: './monitoramento-kpis.css',
})
export class MonitoramentoKpisComponent {
  readonly kpis = input<MonitoramentoKpis>({
    totalPactuado: 0,
    totalAprovado: 0,
    saldoFisico: 0,
    totalFinanceiroPactuado: 0,
    totalFinanceiro: 0,
    saldoFinanceiroGlobal: 0,
    percentualGlobal: 0,
    percentualGlobalFinanceiro: 0,
    statusGeralLabel: 'Dentro do Pactuado',
    statusGeralSeverity: 'success',
    statusFinanceiroGlobalLabel: 'Equilíbrio',
    statusFinanceiroGlobalSeverity: 'success',
    totalItens: 0,
    totalComPacto: 0,
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

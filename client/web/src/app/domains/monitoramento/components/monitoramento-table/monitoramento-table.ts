import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  MonitoramentoProcedimentoItem,
  MonitoramentoKpis,
} from '../../models/monitoramento.model';
import {
  formatCurrency,
  getComplexidadeSeverity,
  getComplexidadeLabel,
  getStatusSeverity,
  getStatusLabel,
  getClampedPercent,
  getProgressBarClass,
  getPercTextClass,
  getSaldoFinanceiroClass,
} from '../../utils/monitoramento.utils';

@Component({
  selector: 'app-monitoramento-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    CardModule,
    TagModule,
    TableModule,
    ProgressBarModule,
    ButtonModule,
    TooltipModule,
    SortIcon,
  ],
  templateUrl: './monitoramento-table.html',
  styleUrl: './monitoramento-table.css',
})
export class MonitoramentoTableComponent {
  readonly procedimentos = input<MonitoramentoProcedimentoItem[]>([]);
  readonly loading = input<boolean>(false);
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
  readonly periodoFormatado = input<string>('');
  readonly mesesCount = input<number>(1);

  readonly resetFilters = output<void>();

  readonly formatCurrency = formatCurrency;
  readonly getComplexidadeSeverity = getComplexidadeSeverity;
  readonly getComplexidadeLabel = getComplexidadeLabel;
  readonly getStatusSeverity = getStatusSeverity;
  readonly getStatusLabel = getStatusLabel;
  readonly getClampedPercent = getClampedPercent;
  readonly getProgressBarClass = getProgressBarClass;
  readonly getPercTextClass = getPercTextClass;
  readonly getSaldoFinanceiroClass = getSaldoFinanceiroClass;
}

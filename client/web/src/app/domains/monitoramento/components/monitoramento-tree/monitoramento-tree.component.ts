import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TreeNode } from 'primeng/api';
import {
  SigtapTreeNodeData,
  MonitoramentoKpis,
} from '../../models/monitoramento.model';
import { StatusExecucao } from '../../../../core/models/domain-enums';

@Component({
  selector: 'app-monitoramento-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DecimalPipe,
    CardModule,
    TagModule,
    TreeTableModule,
    ProgressBarModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './monitoramento-tree.component.html',
  styleUrl: './monitoramento-tree.component.css',
})
export class MonitoramentoTreeComponent {
  readonly treeNodes = input<TreeNode<SigtapTreeNodeData>[]>([]);
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
  readonly mesesCount = input<number>(1);

  readonly expandAll = output<void>();
  readonly collapseAll = output<void>();
  readonly resetFilters = output<void>();

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

  getStatusSeverity(
    status: StatusExecucao
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'DENTRO':
        return 'success';
      case 'ACIMA':
        return 'warn';
      case 'ABAIXO':
        return 'danger';
      case 'SEM_PACTO':
        return 'secondary';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'Dentro da Meta';
      case 'ACIMA':
        return 'Acima da Meta';
      case 'ABAIXO':
        return 'Abaixo da Meta';
      case 'SEM_PACTO':
        return 'Sem Pactuação';
      default:
        return status;
    }
  }

  getClampedPercent(perc: number | null): number {
    if (perc === null || perc === undefined) return 0;
    return Math.min(Math.max(perc, 0), 100);
  }

  getProgressBarClass(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'p-progressbar-emerald';
      case 'ACIMA':
        return 'p-progressbar-amber';
      case 'ABAIXO':
        return 'p-progressbar-rose';
      default:
        return 'p-progressbar-slate';
    }
  }

  getPercTextClass(status: StatusExecucao): string {
    switch (status) {
      case 'DENTRO':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'ACIMA':
        return 'text-amber-600 dark:text-amber-400';
      case 'ABAIXO':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-surface-500';
    }
  }

  getSaldoFinanceiroClass(saldo: number, status: StatusExecucao): string {
    if (status === 'SEM_PACTO') {
      return 'text-surface-500';
    }
    if (saldo > 0) {
      return 'text-amber-600 dark:text-amber-400';
    }
    if (saldo < 0) {
      return 'text-rose-600 dark:text-rose-400';
    }
    return 'text-emerald-600 dark:text-emerald-400';
  }
}

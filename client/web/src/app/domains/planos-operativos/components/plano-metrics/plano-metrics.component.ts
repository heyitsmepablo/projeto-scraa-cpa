import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PlanoOperativoResumo } from '../../models/plano-operativo.model';

@Component({
  selector: 'app-plano-metrics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, CardModule],
  templateUrl: './plano-metrics.component.html',
  styleUrl: './plano-metrics.component.css',
})
export class PlanoMetricsComponent {
  readonly resumo = input<PlanoOperativoResumo>({
    planoOperativoId: 0,
    totalProcedimentos: 0,
    metaFisicaTotal: 0,
    distribuicaoComplexidade: { bc: 0, mc: 0, ac: 0 },
  });
}

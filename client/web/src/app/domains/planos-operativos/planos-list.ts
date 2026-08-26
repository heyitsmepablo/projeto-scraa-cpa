import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { CompetenceService } from '../../core/services/competence';
import { PlanoOperativoService } from './services/plano-operativo';
import {
  PlanoOperativo,
  PlanoOperativoResumo,
  ProcedimentoViewItem,
} from './models/plano-operativo.model';
import { PlanoHeaderComponent } from './components/plano-header/plano-header';
import { PlanoMetricsComponent } from './components/plano-metrics/plano-metrics';
import { PlanoTableComponent } from './components/plano-table/plano-table';

@Component({
  selector: 'app-planos-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PlanoHeaderComponent,
    PlanoMetricsComponent,
    PlanoTableComponent,
  ],
  templateUrl: './planos-list.html',
  styleUrl: './planos-list.css',
})
export class PlanosListComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly planoOperativoService = inject(PlanoOperativoService);

  readonly planos = toSignal(this.planoOperativoService.findAll(), { initialValue: [] });
  readonly selectedPlanoId = signal<number>(1);

  readonly planoOptions = computed(() => {
    return this.planos().map((p) => ({
      label: `${p.vinculo?.instituicao?.nome ?? 'Instituição'} • ${p.vinculo?.numero ?? 'Contrato'} ${p.vigente ? '✓' : '(Inativo)'}`,
      value: p.id,
    }));
  });

  readonly planoSelecionado = computed<PlanoOperativo | undefined>(() => {
    const list = this.planos();
    const currentId = this.selectedPlanoId();
    return list.find((p) => p.id === currentId) || list[0];
  });

  readonly procedimentosFormatados = computed<ProcedimentoViewItem[]>(() => {
    const plano = this.planoSelecionado();
    if (!plano || !plano.procedimentos) return [];

    return plano.procedimentos.map((p) => ({
      ...p,
      coProcedimentoFormatado: this.formatSigtapCode(p.coProcedimento),
    }));
  });

  readonly resumo = computed<PlanoOperativoResumo>(() => {
    const procs = this.procedimentosFormatados();
    const totalProcedimentos = procs.length;
    const metaFisicaTotal = procs.reduce((acc, curr) => acc + curr.quantidadePactuadaMensal, 0);

    const distribuicao = {
      bc: 0,
      mc: 0,
      ac: 0,
    };

    for (const proc of procs) {
      const c = proc.procedimento?.tpComplexidade?.toUpperCase();
      if (c === 'BC') distribuicao.bc += proc.quantidadePactuadaMensal;
      else if (c === 'MC') distribuicao.mc += proc.quantidadePactuadaMensal;
      else if (c === 'AC') distribuicao.ac += proc.quantidadePactuadaMensal;
    }

    return {
      planoOperativoId: this.selectedPlanoId(),
      totalProcedimentos,
      metaFisicaTotal,
      distribuicaoComplexidade: distribuicao,
    };
  });

  readonly loading = computed(() => this.planos().length === 0);

  onPlanoSelect(id: number): void {
    this.selectedPlanoId.set(id);
  }

  formatSigtapCode(code?: string): string {
    if (!code) return '-';
    const clean = code.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return code;
  }

  getComplexidadeLabel(tp?: string): string {
    switch (tp?.toUpperCase()) {
      case 'BC':
        return 'Baixa (BC)';
      case 'MC':
        return 'Média (MC)';
      case 'AC':
        return 'Alta (AC)';
      default:
        return tp || 'Não Definido';
    }
  }

  getComplexidadeSeverity(
    tp?: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (tp?.toUpperCase()) {
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

  getFinanciamentoLabel(coFin?: string): string {
    switch (coFin) {
      case '01':
        return '01 - Atenção Básica (PAB)';
      case '02':
        return '02 - Assistência Farmacêutica';
      case '04':
        return '04 - Média e Alta Complexidade (MAC)';
      case '05':
        return '05 - Vigilância em Saúde';
      case '06':
        return '06 - FAEC';
      default:
        return coFin ? `Bloco ${coFin}` : 'Não Informado';
    }
  }
}

export { PlanosListComponent as PlanosList };

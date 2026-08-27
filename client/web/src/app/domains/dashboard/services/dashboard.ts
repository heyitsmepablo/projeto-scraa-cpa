import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { switchMap, map, startWith } from 'rxjs/operators';
import { ChartOptions } from 'chart.js';

import { CompetenceService } from '../../../core/services/competence/competence';
import { InstituicaoService } from '../../../core/services/instituicao/instituicao';
import { ProducaoService } from '../../../core/services/producao/producao';
import { ProducaoPorProcedimento } from '../../../core/models/producao.model';
import { calcularStatusExecucao } from '../../../core/models/domain-enums.model';
import { DashboardKpis, SelectOption } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly competenceService = inject(CompetenceService);
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly producaoService = inject(ProducaoService);

  // Estados reativos de filtros
  readonly selectedInstituicaoCnes = signal<string>('ALL');
  readonly selectedStatusExecucao = signal<string>('ALL');

  // Carregamento de instituições para dropdown
  private readonly instituicoesRaw = toSignal(this.instituicaoService.findAll(), {
    initialValue: [],
  });

  readonly instituicaoOptions = computed<SelectOption[]>(() => {
    const list = this.instituicoesRaw();
    return [
      { label: 'Todas as Instituições', value: 'ALL' },
      ...list.map((inst) => ({
        label: `${inst.nome} (${inst.cnes})`,
        value: inst.cnes,
      })),
    ];
  });

  // Carregamento reativo da produção
  private readonly paramsObservable = combineLatest([
    toObservable(this.competenceService.periodFilter),
    toObservable(this.selectedInstituicaoCnes),
  ]);

  private readonly procedimentosState = toSignal(
    this.paramsObservable.pipe(
      switchMap(([period, cnes]) => {
        const targetCnes = cnes !== 'ALL' ? cnes : undefined;
        return this.producaoService
          .getProducaoPorPeriodo(period, undefined, targetCnes)
          .pipe(
            map((data) => ({ loading: false, data })),
            startWith({ loading: true, data: [] as ProducaoPorProcedimento[] }),
          );
      }),
    ),
    { initialValue: { loading: true, data: [] as ProducaoPorProcedimento[] } },
  );

  readonly rawProcedimentos = computed(() => this.procedimentosState().data);
  readonly loading = computed(() => this.procedimentosState().loading);

  readonly filteredProcedimentos = computed<ProducaoPorProcedimento[]>(() => {
    let procs = this.rawProcedimentos();
    const cnes = this.selectedInstituicaoCnes();
    const status = this.selectedStatusExecucao();

    if (cnes !== 'ALL') {
      procs = procs.filter((p) => p.cnes === cnes);
    }
    if (status !== 'ALL') {
      procs = procs.filter((p) => p.statusExecucao === status);
    }

    return procs;
  });

  readonly kpis = computed<DashboardKpis>(() => {
    const procs = this.filteredProcedimentos();
    let totalValorAprovado = 0;
    let totalValorProduzido = 0;
    let totalQtdAprovada = 0;
    let totalQtdProduzida = 0;
    let totalQtdPactuada = 0;

    let totalDentro = 0;
    let totalAcima = 0;
    let totalAbaixo = 0;
    let totalSemPacto = 0;

    for (const p of procs) {
      totalValorAprovado += p.vlrAprovado || 0;
      totalValorProduzido += p.vlrProduzido || 0;
      totalQtdAprovada += p.qtdAprovada || 0;
      totalQtdProduzida += p.qtdProduzida || 0;

      if (p.qtdPactuadaMensal) {
        totalQtdPactuada += p.qtdPactuadaMensal;
      }

      switch (p.statusExecucao) {
        case 'DENTRO': totalDentro++; break;
        case 'ACIMA': totalAcima++; break;
        case 'ABAIXO': totalAbaixo++; break;
        case 'SEM_PACTO': totalSemPacto++; break;
      }
    }

    const taxaExecucaoGeral = totalQtdPactuada > 0 ? (totalQtdAprovada / totalQtdPactuada) * 100 : 100;
    const statusGeral = calcularStatusExecucao(totalQtdPactuada > 0 ? taxaExecucaoGeral : null);
    
    let statusGeralLabel = 'Dentro da Meta';
    let statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (statusGeral === 'ACIMA') {
      statusGeralLabel = 'Acima da Meta';
      statusGeralSeverity = 'warn';
    } else if (statusGeral === 'ABAIXO' && totalQtdPactuada > 0) {
      statusGeralLabel = 'Abaixo da Meta';
      statusGeralSeverity = 'danger';
    }

    return {
      totalValorAprovado,
      totalValorProduzido,
      totalQtdAprovada,
      totalQtdProduzida,
      totalQtdPactuada,
      taxaExecucaoGeral,
      statusGeralLabel,
      statusGeralSeverity,
      totalProcedimentos: procs.length,
      totalDentro,
      totalAcima,
      totalAbaixo,
      totalSemPacto,
    };
  });

  readonly chartData = computed(() => {
    const procs = this.filteredProcedimentos().filter((p) => p.qtdPactuadaMensal !== null);
    const topProcs = [...procs]
      .sort((a, b) => (b.qtdPactuadaMensal || 0) - (a.qtdPactuadaMensal || 0))
      .slice(0, 7);

    const labels = topProcs.map((p) => {
      const name = p.noProcedimento;
      return name.length > 22 ? name.substring(0, 20) + '...' : name;
    });

    const dataPactuado = topProcs.map((p) => p.qtdPactuadaMensal || 0);
    const dataAprovado = topProcs.map((p) => p.qtdAprovada || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Meta Pactuada',
          backgroundColor: '#94a3b8',
          borderColor: '#64748b',
          borderWidth: 1,
          borderRadius: 4,
          data: dataPactuado,
        },
        {
          label: 'Qtd Aprovada',
          backgroundColor: '#0ea5e9',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 4,
          data: dataAprovado,
        },
      ],
    };
  });

  resetFilters(): void {
    this.selectedInstituicaoCnes.set('ALL');
    this.selectedStatusExecucao.set('ALL');
  }
}

import {
  Component,
  inject,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';

import { CompetenceService } from '../../core/services/competence';
import { VinculoService } from '../../core/services/vinculo';
import { InstituicaoService } from '../../core/services/instituicao';
import { ProducaoService } from '../../core/services/producao';
import { StatusExecucao } from '../../core/models/domain-enums.model';
import { Vinculo } from '../../core/models/vinculo.model';
import { Instituicao } from '../../core/models/instituicao.model';
import {
  MonitoramentoProcedimentoItem,
  SigtapTreeNodeData,
  MonitoramentoKpis,
  SelectOption,
} from './models/monitoramento.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { MonitoramentoHeroComponent } from './components/monitoramento-hero/monitoramento-hero';
import { MonitoramentoKpisComponent } from './components/monitoramento-kpis/monitoramento-kpis';
import { MonitoramentoFiltersComponent } from './components/monitoramento-filters/monitoramento-filters';
import { MonitoramentoTableComponent } from './components/monitoramento-table/monitoramento-table';
import { MonitoramentoTreeComponent } from './components/monitoramento-tree/monitoramento-tree';

export type { MonitoramentoProcedimentoItem, SigtapTreeNodeData, MonitoramentoKpis };

@Component({
  selector: 'app-monitoramento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SelectButtonModule,
    PageHeaderComponent,
    MonitoramentoHeroComponent,
    MonitoramentoKpisComponent,
    MonitoramentoFiltersComponent,
    MonitoramentoTableComponent,
    MonitoramentoTreeComponent,
  ],
  templateUrl: './monitoramento.html',
  styleUrl: './monitoramento.css',
})
export class MonitoramentoComponent {
  readonly competenceService = inject(CompetenceService);
  private readonly vinculoService = inject(VinculoService);
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly producaoService = inject(ProducaoService);

  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  // Estados reativos
  readonly selectedVinculoId = signal<number | null>(1);
  readonly viewMode = signal<'flat' | 'tree'>('flat');
  readonly globalFilterText = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly selectedComplexidade = signal<string>('ALL');

  readonly viewModeOptions = [
    { label: 'Lista Plana', value: 'flat', icon: 'pi pi-list' },
    { label: 'Árvore SIGTAP', value: 'tree', icon: 'pi pi-sitemap' },
  ];

  readonly statusOptions: SelectOption[] = [
    { label: 'Todos os Status', value: 'ALL' },
    { label: 'Dentro da Meta (DENTRO)', value: 'DENTRO' },
    { label: 'Acima da Meta (ACIMA)', value: 'ACIMA' },
    { label: 'Abaixo da Meta (ABAIXO)', value: 'ABAIXO' },
    { label: 'Sem Pactuação (SEM_PACTO)', value: 'SEM_PACTO' },
  ];

  readonly complexidadeOptions: SelectOption[] = [
    { label: 'Todas as Complexidades', value: 'ALL' },
    { label: 'Baixa Complexidade (BC)', value: 'BC' },
    { label: 'Média Complexidade (MC)', value: 'MC' },
    { label: 'Alta Complexidade (AC)', value: 'AC' },
  ];

  // Carregamento de vínculos e instituições
  private readonly instituicoesRaw = toSignal(this.instituicaoService.findAll(), { initialValue: [] });
  private readonly vinculosRaw = toSignal(this.vinculoService.findAll(), { initialValue: [] });

  readonly vinculoOptions = computed<SelectOption<number>[]>(() => {
    const list = this.vinculosRaw();
    const insts = this.instituicoesRaw();
    const instMap = new Map<number, Instituicao>(insts.map((i) => [i.id, i]));

    return list.map((v) => {
      const inst = instMap.get(v.instituicaoId) || v.instituicao;
      const nome = inst ? inst.nome : `Inst. #${v.instituicaoId}`;
      const cnes = inst ? ` (${inst.cnes})` : '';
      const tipo = v.tipoVinculo ? ` - ${v.tipoVinculo}` : '';
      return {
        label: `${v.numero} - ${nome}${cnes}${tipo}`,
        value: v.id,
      };
    });
  });

  // Vínculo atualmente selecionado
  readonly selectedVinculo = computed<Vinculo | undefined>(() => {
    const list = this.vinculosRaw();
    const currentId = this.selectedVinculoId();
    if (currentId === null || currentId === undefined) {
      return undefined;
    }
    const insts = this.instituicoesRaw();
    const instMap = new Map<number, Instituicao>(insts.map((i) => [i.id, i]));

    const found = list.find((v) => v.id === currentId);
    if (found) {
      return {
        ...found,
        instituicao: instMap.get(found.instituicaoId) || found.instituicao,
      };
    }
    return undefined;
  });

  // Carregamento reativo da produção por procedimento vinculado ao período selecionado
  private readonly paramsObservable = combineLatest([
    toObservable(this.competenceService.periodFilter),
    toObservable(this.selectedVinculoId),
  ]);

  private readonly procedimentosRaw = toSignal(
    this.paramsObservable.pipe(
      switchMap(([period, vinculoId]) => {
        return this.producaoService.getProducaoPorPeriodo(period, vinculoId ?? undefined);
      })
    ),
    { initialValue: [] }
  );

  readonly loading = computed(() => this.procedimentosRaw().length === 0);

  // Lista formatada e filtrada de procedimentos analíticos
  readonly procedimentosFormatados = computed<MonitoramentoProcedimentoItem[]>(() => {
    const raw = this.procedimentosRaw();
    const filterText = this.globalFilterText().toLowerCase().trim();
    const status = this.selectedStatus();
    const compl = this.selectedComplexidade();

    return raw
      .map((item) => {
        const diferencaFisico =
          item.qtdPactuadaMensal !== null && item.qtdPactuadaMensal !== undefined
            ? item.qtdAprovada - item.qtdPactuadaMensal
            : null;

        return {
          ...item,
          coProcedimentoFormatado: this.formatSigtapCode(item.coProcedimento),
          diferencaFisico,
        };
      })
      .filter((p) => {
        if (filterText) {
          const matchCode = p.coProcedimento.includes(filterText);
          const matchFormattedCode = p.coProcedimentoFormatado.toLowerCase().includes(filterText);
          const matchName = p.noProcedimento.toLowerCase().includes(filterText);
          const matchGrupo = (p.noGrupo || '').toLowerCase().includes(filterText);
          if (!matchCode && !matchFormattedCode && !matchName && !matchGrupo) {
            return false;
          }
        }
        if (status !== 'ALL' && p.statusExecucao !== status) {
          return false;
        }
        if (compl !== 'ALL' && p.complexidade?.toUpperCase() !== compl) {
          return false;
        }
        return true;
      });
  });

  // Alias para compatibilidade com testes e outros consumidores
  readonly filteredProcedimentos = computed<MonitoramentoProcedimentoItem[]>(() =>
    this.procedimentosFormatados()
  );

  // Árvore Hierárquica SIGTAP (Grupo -> Subgrupo -> Procedimentos)
  readonly treeNodes = computed<TreeNode<SigtapTreeNodeData>[]>(() => {
    const procs = this.procedimentosFormatados();
    const gruposMap = new Map<
      string,
      {
        coGrupo: string;
        noGrupo: string;
        subgruposMap: Map<string, { coSubGrupo: string; noSubGrupo: string; procs: MonitoramentoProcedimentoItem[] }>;
      }
    >();

    for (const proc of procs) {
      const coGrupo = proc.coGrupo || '';
      const noGrupo = proc.noGrupo || '';
      const coSubGrupo = proc.coSubGrupo || '';
      const noSubGrupo = proc.noSubGrupo || '';

      if (!gruposMap.has(coGrupo)) {
        gruposMap.set(coGrupo, {
          coGrupo,
          noGrupo,
          subgruposMap: new Map(),
        });
      }

      const grupo = gruposMap.get(coGrupo)!;
      if (!grupo.subgruposMap.has(coSubGrupo)) {
        grupo.subgruposMap.set(coSubGrupo, {
          coSubGrupo,
          noSubGrupo,
          procs: [],
        });
      }

      grupo.subgruposMap.get(coSubGrupo)!.procs.push(proc);
    }

    const tree: TreeNode<SigtapTreeNodeData>[] = [];

    gruposMap.forEach((grupo) => {
      const subgrupoNodes: TreeNode<SigtapTreeNodeData>[] = [];

      let grupoQtdPactuada: number | null = null;
      let grupoQtdAprovada = 0;
      let grupoVlrPactuado: number | null = null;
      let grupoVlrAprovado = 0;
      let grupoTotalProcs = 0;

      grupo.subgruposMap.forEach((subgrupo) => {
        let subQtdPactuada: number | null = null;
        let subQtdAprovada = 0;
        let subVlrPactuado: number | null = null;
        let subVlrAprovado = 0;

        const procNodes: TreeNode<SigtapTreeNodeData>[] = subgrupo.procs.map((p) => {
          if (p.qtdPactuadaMensal !== null && p.qtdPactuadaMensal !== undefined) {
            subQtdPactuada = (subQtdPactuada || 0) + p.qtdPactuadaMensal;
          }
          subQtdAprovada += p.qtdAprovada || 0;

          const pVlrPactuado = p.vlrPactuado !== undefined ? p.vlrPactuado : null;
          if (pVlrPactuado !== null) {
            subVlrPactuado = (subVlrPactuado || 0) + pVlrPactuado;
          }
          subVlrAprovado += p.vlrAprovado || 0;

          return {
            data: {
              tipo: 'PROCEDIMENTO',
              coCodigo: p.coProcedimento,
              coProcedimento: p.coProcedimento,
              coProcedimentoFormatado: p.coProcedimentoFormatado,
              noProcedimento: p.noProcedimento,
              descricao: `${p.coProcedimentoFormatado} - ${p.noProcedimento}`,
              coFinanciamento: p.coFinanciamento,
              noFinanciamento: p.noFinanciamento,
              complexidade: p.complexidade,
              vlUnitario: p.vlUnitario,
              qtdPactuadaMensal: p.qtdPactuadaMensal,
              qtdAprovada: p.qtdAprovada,
              diferencaFisico: p.diferencaFisico,
              vlrPactuado: pVlrPactuado,
              vlrAprovado: p.vlrAprovado,
              saldoFinanceiro: p.saldoFinanceiro ?? 0,
              percExecucao: p.percExecucao ?? null,
              percExecucaoFinanceira: p.percExecucaoFinanceira ?? null,
              statusExecucao: p.statusExecucao,
            },
            leaf: true,
          };
        });

        const subPerc =
          subQtdPactuada !== null && subQtdPactuada > 0
            ? (subQtdAprovada / subQtdPactuada) * 100
            : null;

        const subPercFin =
          subVlrPactuado !== null && subVlrPactuado > 0
            ? (subVlrAprovado / subVlrPactuado) * 100
            : null;

        const subSaldoFin = subVlrAprovado - (subVlrPactuado || 0);

        let subStatus: StatusExecucao = 'SEM_PACTO';
        if (subPerc !== null) {
          if (subPerc > 105) subStatus = 'ACIMA';
          else if (subPerc < 95) subStatus = 'ABAIXO';
          else subStatus = 'DENTRO';
        }

        subgrupoNodes.push({
          data: {
            tipo: 'SUBGRUPO',
            coCodigo: `${grupo.coGrupo}.${subgrupo.coSubGrupo}`,
            descricao: `Subgrupo ${subgrupo.coSubGrupo} - ${subgrupo.noSubGrupo}`,
            qtdPactuadaMensal: subQtdPactuada,
            qtdAprovada: subQtdAprovada,
            diferencaFisico: subQtdPactuada !== null ? subQtdAprovada - subQtdPactuada : null,
            vlrPactuado: subVlrPactuado,
            vlrAprovado: subVlrAprovado,
            saldoFinanceiro: subSaldoFin,
            percExecucao: subPerc,
            percExecucaoFinanceira: subPercFin,
            statusExecucao: subStatus,
            totalProcedimentos: subgrupo.procs.length,
          },
          children: procNodes,
          expanded: true,
        });

        if (subQtdPactuada !== null) {
          grupoQtdPactuada = (grupoQtdPactuada || 0) + subQtdPactuada;
        }
        grupoQtdAprovada += subQtdAprovada;

        if (subVlrPactuado !== null) {
          grupoVlrPactuado = (grupoVlrPactuado || 0) + subVlrPactuado;
        }
        grupoVlrAprovado += subVlrAprovado;
        grupoTotalProcs += subgrupo.procs.length;
      });

      const grupoPerc =
        grupoQtdPactuada !== null && grupoQtdPactuada > 0
          ? (grupoQtdAprovada / grupoQtdPactuada) * 100
          : null;

      const grupoPercFin =
        grupoVlrPactuado !== null && grupoVlrPactuado > 0
          ? (grupoVlrAprovado / grupoVlrPactuado) * 100
          : null;

      const grupoSaldoFin = grupoVlrAprovado - (grupoVlrPactuado || 0);

      let grupoStatus: StatusExecucao = 'SEM_PACTO';
      if (grupoPerc !== null) {
        if (grupoPerc > 105) grupoStatus = 'ACIMA';
        else if (grupoPerc < 95) grupoStatus = 'ABAIXO';
        else grupoStatus = 'DENTRO';
      }

      tree.push({
        data: {
          tipo: 'GRUPO',
          coCodigo: grupo.coGrupo,
          descricao: `Grupo ${grupo.coGrupo} - ${grupo.noGrupo}`,
          qtdPactuadaMensal: grupoQtdPactuada,
          qtdAprovada: grupoQtdAprovada,
          diferencaFisico: grupoQtdPactuada !== null ? grupoQtdAprovada - grupoQtdPactuada : null,
          vlrPactuado: grupoVlrPactuado,
          vlrAprovado: grupoVlrAprovado,
          saldoFinanceiro: grupoSaldoFin,
          percExecucao: grupoPerc,
          percExecucaoFinanceira: grupoPercFin,
          statusExecucao: grupoStatus,
          totalProcedimentos: grupoTotalProcs,
        },
        children: subgrupoNodes,
        expanded: true,
      });
    });

    return tree;
  });

  // KPIs consolidados com base nos itens filtrados
  readonly kpis = computed<MonitoramentoKpis>(() => {
    const procs = this.procedimentosFormatados();
    let totalPactuado = 0;
    let totalAprovado = 0;
    let totalFinanceiro = 0;
    let totalFinanceiroPactuado = 0;
    let totalComPacto = 0;

    let totalDentro = 0;
    let totalAcima = 0;
    let totalAbaixo = 0;
    let totalSemPacto = 0;

    for (const p of procs) {
      if (p.qtdPactuadaMensal !== null && p.qtdPactuadaMensal !== undefined && p.qtdPactuadaMensal > 0) {
        totalPactuado += p.qtdPactuadaMensal;
        totalComPacto++;
      }
      totalAprovado += p.qtdAprovada || 0;
      totalFinanceiro += p.vlrAprovado || 0;
      if (p.vlrPactuado !== null && p.vlrPactuado !== undefined && p.vlrPactuado > 0) {
        totalFinanceiroPactuado += p.vlrPactuado;
      }

      switch (p.statusExecucao) {
        case 'DENTRO':
          totalDentro++;
          break;
        case 'ACIMA':
          totalAcima++;
          break;
        case 'ABAIXO':
          totalAbaixo++;
          break;
        case 'SEM_PACTO':
          totalSemPacto++;
          break;
      }
    }

    const saldoFisico = totalAprovado - totalPactuado;
    const saldoFinanceiroGlobal = totalFinanceiro - totalFinanceiroPactuado;
    const percentualGlobal = totalPactuado > 0 ? (totalAprovado / totalPactuado) * 100 : 100;
    const percentualGlobalFinanceiro =
      totalFinanceiroPactuado > 0 ? (totalFinanceiro / totalFinanceiroPactuado) * 100 : 100;

    let statusGeralLabel = 'Dentro da Meta';
    let statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (percentualGlobal > 105) {
      statusGeralLabel = 'Acima da Meta';
      statusGeralSeverity = 'warn';
    } else if (percentualGlobal < 95 && totalPactuado > 0) {
      statusGeralLabel = 'Abaixo da Meta';
      statusGeralSeverity = 'danger';
    }

    let statusFinanceiroGlobalLabel = 'Dentro do Pactuado';
    let statusFinanceiroGlobalSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (saldoFinanceiroGlobal > 0.01) {
      statusFinanceiroGlobalLabel = 'Superávit (+)';
      statusFinanceiroGlobalSeverity = 'warn';
    } else if (saldoFinanceiroGlobal < -0.01) {
      statusFinanceiroGlobalLabel = 'Déficit (-)';
      statusFinanceiroGlobalSeverity = 'danger';
    }

    return {
      totalPactuado,
      totalAprovado,
      saldoFisico,
      totalFinanceiroPactuado,
      totalFinanceiro,
      saldoFinanceiroGlobal,
      percentualGlobal,
      percentualGlobalFinanceiro,
      statusGeralLabel,
      statusGeralSeverity,
      statusFinanceiroGlobalLabel,
      statusFinanceiroGlobalSeverity,
      totalItens: procs.length,
      totalComPacto,
      totalDentro,
      totalAcima,
      totalAbaixo,
      totalSemPacto,
    };
  });

  constructor() {
    effect(() => {
      const options = this.vinculoOptions();
      const currentId = this.selectedVinculoId();
      if (options.length > 0 && (currentId === null || currentId === undefined)) {
        this.selectedVinculoId.set(options[0].value);
      }
    });
  }

  // Ações de Usuário
  resetFilters(): void {
    this.globalFilterText.set('');
    this.selectedStatus.set('ALL');
    this.selectedComplexidade.set('ALL');
  }

  expandAll(): void {
    const nodes = this.treeNodes();
    const setExpand = (list: TreeNode[]) => {
      for (const node of list) {
        node.expanded = true;
        if (node.children) setExpand(node.children);
      }
    };
    setExpand(nodes);
  }

  collapseAll(): void {
    const nodes = this.treeNodes();
    const setCollapse = (list: TreeNode[]) => {
      for (const node of list) {
        node.expanded = false;
        if (node.children) setCollapse(node.children);
      }
    };
    setCollapse(nodes);
  }

  exportarDados(): void {
    const procs = this.procedimentosFormatados();
    if (procs.length === 0) return;

    const headers = [
      'Codigo_SIGTAP',
      'Procedimento',
      'Grupo',
      'Subgrupo',
      'Complexidade',
      'Financiamento',
      'Valor_Unitario',
      'Qtd_Pactuada',
      'Qtd_Aprovada',
      'Saldo_Fisico',
      'Vlr_Pactuado',
      'Vlr_Aprovado',
      'Saldo_Financeiro',
      'Perc_Execucao',
      'Status_Execucao',
    ];

    const rows = procs.map((p) => [
      `"${p.coProcedimento}"`,
      `"${(p.noProcedimento || '').replace(/"/g, '""')}"`,
      `"${(p.noGrupo || '').replace(/"/g, '""')}"`,
      `"${(p.noSubGrupo || '').replace(/"/g, '""')}"`,
      `"${p.complexidade || ''}"`,
      `"${p.noFinanciamento || ''}"`,
      (p.vlUnitario || 0).toFixed(2),
      p.qtdPactuadaMensal !== null && p.qtdPactuadaMensal !== undefined ? p.qtdPactuadaMensal : '',
      p.qtdAprovada,
      p.diferencaFisico !== null && p.diferencaFisico !== undefined ? p.diferencaFisico : '',
      p.vlrPactuado !== null && p.vlrPactuado !== undefined ? p.vlrPactuado.toFixed(2) : '',
      (p.vlrAprovado || 0).toFixed(2),
      (p.saldoFinanceiro || 0).toFixed(2),
      p.percExecucao !== null && p.percExecucao !== undefined ? p.percExecucao.toFixed(1) + '%' : '',
      `"${p.statusExecucao}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `monitoramento_cpa_${this.competenceService.periodFilter().mode}_${this.selectedVinculo()?.numero || 'contrato'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Formatadores e Helpers de Apresentação
  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return this.currencyFormatter.format(value);
  }

  formatSigtapCode(code?: string): string {
    if (!code) return '-';
    const clean = code.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return code;
  }

  getComplexidadeSeverity(
    c?: string
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
    status?: StatusExecucao | string
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

  getStatusLabel(status?: StatusExecucao | string): string {
    switch (status) {
      case 'DENTRO':
        return 'Dentro da Meta';
      case 'ACIMA':
        return 'Acima da Meta';
      case 'ABAIXO':
        return 'Abaixo da Meta';
      case 'SEM_PACTO':
        return 'Sem Pacto';
      default:
        return status || '-';
    }
  }

  getClampedPercent(perc?: number | null): number {
    if (perc === null || perc === undefined) return 0;
    return Math.min(Math.max(perc, 0), 100);
  }

  getProgressBarClass(status?: StatusExecucao | string): string {
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

  getPercTextClass(status?: StatusExecucao | string): string {
    switch (status) {
      case 'DENTRO':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'ACIMA':
        return 'text-amber-600 dark:text-amber-400';
      case 'ABAIXO':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-surface-600 dark:text-surface-400';
    }
  }

  getSaldoFinanceiroClass(saldo: number, status?: StatusExecucao | string): string {
    if (status === 'SEM_PACTO') {
      return 'text-surface-600 dark:text-surface-400';
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

export { MonitoramentoComponent as Monitoramento };

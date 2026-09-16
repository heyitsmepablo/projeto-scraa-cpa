import { Injectable, inject, signal, computed, linkedSignal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { switchMap, map, startWith } from 'rxjs/operators';
import { TreeNode } from 'primeng/api';

import { CompetenceService } from '../../../core/services/competence/competence';
import { VinculoService } from '../../../core/services/vinculo/vinculo';
import { InstituicaoService } from '../../../core/services/instituicao/instituicao';
import { MonitoramentoApiService } from './monitoramento-api.service';
import { MonitoramentoItemAnaliticoDto } from './monitoramento.dto';
import { ProducaoPorProcedimento } from '../../../core/models/producao.model';
import { StatusExecucao, calcularStatusExecucao } from '../../../core/models/domain-enums.model';
import { Vinculo } from '../../../core/models/vinculo.model';
import { Instituicao } from '../../../core/models/instituicao.model';
import {
  MonitoramentoProcedimentoItem,
  SigtapTreeNodeData,
  MonitoramentoKpis,
  SelectOption,
} from '../models/monitoramento.model';
import { formatSigtapCode } from '../utils/monitoramento.utils';

@Injectable({
  providedIn: 'root'
})
export class MonitoramentoService {
  readonly competenceService = inject(CompetenceService);
  private readonly vinculoService = inject(VinculoService);
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly apiService = inject(MonitoramentoApiService);

  readonly viewMode = signal<'flat' | 'tree'>('flat');
  readonly globalFilterText = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly selectedComplexidade = signal<string>('ALL');

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

  readonly selectedVinculoId = linkedSignal<number | null>(() => {
    const options = this.vinculoOptions();
    return options.length > 0 ? options[0].value : null;
  });

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

  private readonly paramsObservable = combineLatest([
    toObservable(this.competenceService.periodFilter),
    toObservable(this.selectedVinculoId),
  ]);

  private readonly procedimentosState = toSignal(
    this.paramsObservable.pipe(
      switchMap(([period, vinculoId]) => {
        if (!vinculoId) return of({ loading: false, data: [] as ProducaoPorProcedimento[] });
        return this.apiService
          .getAnalitico(vinculoId, period)
          .pipe(
            map((res) => {
              const mapped: ProducaoPorProcedimento[] = res.itens.map(item => ({
                competencia: period.competencia || '',
                ano: period.competencia?.substring(0, 4) || '',
                mes: period.competencia?.substring(4, 6) || '',
                nomeMes: '',
                quadrimestre: '',
                tipoContrato: '',
                cnes: '',
                nomeInstituicao: '',
                tipoVinculo: '',
                coFinanciamento: '',
                noFinanciamento: '',
                complexidade: item.complexidade,
                coProcedimento: item.coProcedimento,
                noProcedimento: item.noProcedimento,
                coGrupo: item.coGrupo,
                noGrupo: item.noGrupo,
                coSubGrupo: item.coSubGrupo,
                noSubGrupo: item.noSubGrupo,
                vlUnitario: item.vlUnitario,
                qtdAprovada: item.fisicoRealizado,
                vlrAprovado: item.financeiroRealizado,
                qtdProduzida: item.fisicoRealizado,
                vlrProduzido: item.financeiroRealizado,
                qtdPactuadaMensal: item.metaFisica,
                vlrPactuado: item.metaFinanceira,
                saldoFinanceiro: item.saldoFinanceiro,
                percExecucao: item.percentualFisico,
                percExecucaoFinanceira: item.percentualFinanceiro,
                statusExecucao: item.status as StatusExecucao
              }));
              return { loading: false, data: mapped };
            }),
            startWith({ loading: true, data: [] as ProducaoPorProcedimento[] }),
          );
      }),
    ),
    { initialValue: { loading: true, data: [] as ProducaoPorProcedimento[] } },
  );

  private readonly procedimentosRaw = computed(() => this.procedimentosState().data);
  readonly loading = computed(() => this.procedimentosState().loading);

  readonly procedimentosFormatados = computed<MonitoramentoProcedimentoItem[]>(() => {
    const raw = this.procedimentosRaw();
    const filterText = this.globalFilterText().toLowerCase().trim();
    const status = this.selectedStatus().toUpperCase().trim();
    const compl = this.selectedComplexidade().toUpperCase().trim();

    return raw
      .map((item) => {
        const diferencaFisico =
          item.qtdPactuadaMensal !== null && item.qtdPactuadaMensal !== undefined
            ? item.qtdAprovada - item.qtdPactuadaMensal
            : null;

        return {
          ...item,
          coProcedimentoFormatado: formatSigtapCode(item.coProcedimento),
          diferencaFisico,
        };
      })
      .filter((p) => {
        if (filterText) {
          const matchCode = (p.coProcedimento || '').toLowerCase().includes(filterText);
          const matchFormattedCode = (p.coProcedimentoFormatado || '')
            .toLowerCase()
            .includes(filterText);
          const matchName = (p.noProcedimento || '').toLowerCase().includes(filterText);
          const matchGrupo = (p.noGrupo || '').toLowerCase().includes(filterText);
          if (!matchCode && !matchFormattedCode && !matchName && !matchGrupo) {
            return false;
          }
        }
        if (status !== 'ALL') {
          const itemStatus = (p.statusExecucao || '').toUpperCase().trim();
          if (itemStatus !== status) {
            return false;
          }
        }
        if (compl !== 'ALL') {
          const itemCompl = (p.complexidade || '').toUpperCase().trim();
          if (itemCompl !== compl && !itemCompl.includes(compl)) {
            return false;
          }
        }
        return true;
      });
  });

  readonly rawTreeNodes = computed<TreeNode<SigtapTreeNodeData>[]>(() => {
    const procs = this.procedimentosFormatados();
    const gruposMap = new Map<
      string,
      {
        coGrupo: string;
        noGrupo: string;
        subgruposMap: Map<
          string,
          { coSubGrupo: string; noSubGrupo: string; procs: MonitoramentoProcedimentoItem[] }
        >;
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
        const subStatus: StatusExecucao = calcularStatusExecucao(subPerc);

        subgrupoNodes.push({
          data: {
            tipo: 'SUBGRUPO',
            coCodigo: `${grupo.coGrupo}.${subgrupo.coSubGrupo}`,
            descricao: subgrupo.noSubGrupo,
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
          expanded: false,
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
      const grupoStatus: StatusExecucao = calcularStatusExecucao(grupoPerc);

      tree.push({
        data: {
          tipo: 'GRUPO',
          coCodigo: grupo.coGrupo,
          descricao: grupo.noGrupo,
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
        expanded: false,
      });
    });

    return tree;
  });

  readonly treeNodes = linkedSignal<TreeNode<SigtapTreeNodeData>[]>(() => this.rawTreeNodes());

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
      if (
        p.qtdPactuadaMensal !== null &&
        p.qtdPactuadaMensal !== undefined &&
        p.qtdPactuadaMensal > 0
      ) {
        totalPactuado += p.qtdPactuadaMensal;
        totalComPacto++;
      }
      totalAprovado += p.qtdAprovada || 0;
      totalFinanceiro += p.vlrAprovado || 0;
      if (p.vlrPactuado !== null && p.vlrPactuado !== undefined && p.vlrPactuado > 0) {
        totalFinanceiroPactuado += p.vlrPactuado;
      }

      switch (p.statusExecucao) {
        case 'DENTRO': totalDentro++; break;
        case 'ACIMA': totalAcima++; break;
        case 'ABAIXO': totalAbaixo++; break;
        case 'SEM_PACTO': totalSemPacto++; break;
      }
    }

    const saldoFisico = totalAprovado - totalPactuado;
    const saldoFinanceiroGlobal = totalFinanceiro - totalFinanceiroPactuado;
    const percentualGlobal = totalPactuado > 0 ? (totalAprovado / totalPactuado) * 100 : 100;
    const percentualGlobalFinanceiro =
      totalFinanceiroPactuado > 0 ? (totalFinanceiro / totalFinanceiroPactuado) * 100 : 100;

    const statusExecucaoGeral = calcularStatusExecucao(totalPactuado > 0 ? percentualGlobal : null);
    let statusGeralLabel = 'Dentro da Meta';
    let statusGeralSeverity: 'success' | 'warn' | 'danger' | 'info' = 'success';

    if (statusExecucaoGeral === 'ACIMA') {
      statusGeralLabel = 'Acima da Meta';
      statusGeralSeverity = 'warn';
    } else if (statusExecucaoGeral === 'ABAIXO' && totalPactuado > 0) {
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

  resetFilters(): void {
    this.globalFilterText.set('');
    this.selectedStatus.set('ALL');
    this.selectedComplexidade.set('ALL');
  }

  expandAll(): void {
    const cloneTree = (nodes: TreeNode<SigtapTreeNodeData>[]): TreeNode<SigtapTreeNodeData>[] => {
      return nodes.map((node) => ({
        ...node,
        expanded: true,
        children: node.children ? cloneTree(node.children) : undefined,
      }));
    };
    this.treeNodes.set(cloneTree(this.treeNodes()));
  }

  collapseAll(): void {
    const cloneTree = (nodes: TreeNode<SigtapTreeNodeData>[]): TreeNode<SigtapTreeNodeData>[] => {
      return nodes.map((node) => ({
        ...node,
        expanded: false,
        children: node.children ? cloneTree(node.children) : undefined,
      }));
    };
    this.treeNodes.set(cloneTree(this.treeNodes()));
  }

  exportarDados(): void {
    const procs = this.procedimentosFormatados();
    if (procs.length === 0) return;

    const headers = [
      'Codigo_SIGTAP', 'Procedimento', 'Grupo', 'Subgrupo', 'Complexidade',
      'Financiamento', 'Valor_Unitario', 'Qtd_Pactuada', 'Qtd_Aprovada',
      'Saldo_Fisico', 'Vlr_Pactuado', 'Vlr_Aprovado', 'Saldo_Financeiro',
      'Perc_Execucao', 'Status_Execucao',
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
      `monitoramento_cpa_${this.competenceService.periodFilter().mode}_${this.selectedVinculo()?.numero || 'contrato'}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

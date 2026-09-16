import {
  Component,
  inject,
  computed,
  signal,
  linkedSignal,
  effect,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';

import { CompetenceService } from '../../core/services/competence/competence';
import { VinculoService } from '../../core/services/vinculo/vinculo';
import { InstituicaoService } from '../../core/services/instituicao/instituicao';
import { ProducaoService } from '../../core/services/producao/producao';
import { ProducaoPorProcedimento } from '../../core/models/producao.model';
import { StatusExecucao, calcularStatusExecucao } from '../../core/models/domain-enums.model';
import { Vinculo } from '../../core/models/vinculo.model';
import { Instituicao } from '../../core/models/instituicao.model';
import {
  MonitoramentoProcedimentoItem,
  SigtapTreeNodeData,
  MonitoramentoKpis,
  SelectOption,
} from './models/monitoramento.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TemporalSelectorComponent } from '../../shared/components/temporal-selector/temporal-selector';
import { MonitoramentoHeroComponent } from './components/monitoramento-hero/monitoramento-hero';
import { MonitoramentoKpisComponent } from './components/monitoramento-kpis/monitoramento-kpis';
import { MonitoramentoFiltersComponent } from './components/monitoramento-filters/monitoramento-filters';
import { MonitoramentoTableComponent } from './components/monitoramento-table/monitoramento-table';
import { MonitoramentoTreeComponent } from './components/monitoramento-tree/monitoramento-tree';
import { formatSigtapCode } from './utils/monitoramento.utils';
import { MonitoramentoService } from './services/monitoramento';

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
    TemporalSelectorComponent,
    MonitoramentoHeroComponent,
    MonitoramentoKpisComponent,
    MonitoramentoFiltersComponent,
    MonitoramentoTableComponent,
    MonitoramentoTreeComponent,
  ],
  templateUrl: './monitoramento.html',
  styleUrl: './monitoramento.css',
})
export class MonitoramentoComponent implements OnDestroy {
  readonly competenceService = inject(CompetenceService);
  readonly monitoramentoService = inject(MonitoramentoService);

  constructor() {
    effect(() => {
      const vinculo = this.selectedVinculo();
      if (vinculo) {
        let inicio = this.formatDateToCompetence(vinculo.dataInicio) || '202301';
        let fim = this.formatDateToCompetence(vinculo.dataFim) || '202612';

        if (inicio < '202301') inicio = '202301';
        if (inicio > '202612') inicio = '202612';
        if (fim < '202301') fim = '202301';
        if (fim > '202612') fim = '202612';
        if (inicio > fim) fim = inicio;

        const mesesCount = this.competenceService.countMonthsBetween
          ? this.competenceService.countMonthsBetween(inicio, fim)
          : 1;
        const inicioFmt = this.competenceService.formatCompetenciaShort
          ? this.competenceService.formatCompetenciaShort(inicio)
          : inicio;
        const fimFmt = this.competenceService.formatCompetenciaShort
          ? this.competenceService.formatCompetenciaShort(fim)
          : fim;
        const descricao = `Vigência Contrato ${vinculo.numero} (${inicioFmt} a ${fimFmt} - ${mesesCount} meses)`;

        this.competenceService.setGlobalBounds?.({
          competenciaInicio: inicio,
          competenciaFim: fim,
          descricao,
          mesesCount,
          contexto: 'MONITORAMENTO',
          contratoNumero: vinculo.numero,
        });
      } else {
        this.competenceService.resetGlobalBounds?.();
      }
    });
  }

  ngOnDestroy(): void {
    this.competenceService.resetGlobalBounds?.();
  }

  private formatDateToCompetence(val: string | Date | null | undefined): string | null {
    if (!val) return null;
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = (val.getMonth() + 1).toString().padStart(2, '0');
      return `${y}${m}`;
    }
    const str = String(val);
    const match = str.match(/^(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}${match[2]}`;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      return `${y}${m}`;
    }
    return null;
  }

  // Exported properties to template
  readonly viewMode = this.monitoramentoService.viewMode;
  readonly globalFilterText = this.monitoramentoService.globalFilterText;
  readonly selectedStatus = this.monitoramentoService.selectedStatus;
  readonly selectedComplexidade = this.monitoramentoService.selectedComplexidade;
  readonly selectedVinculoId = this.monitoramentoService.selectedVinculoId;
  readonly selectedVinculo = this.monitoramentoService.selectedVinculo;
  readonly vinculoOptions = this.monitoramentoService.vinculoOptions;
  readonly loading = this.monitoramentoService.loading;
  readonly procedimentosFormatados = this.monitoramentoService.procedimentosFormatados;
  readonly filteredProcedimentos = this.monitoramentoService.procedimentosFormatados;
  readonly treeNodes = this.monitoramentoService.treeNodes;
  readonly kpis = this.monitoramentoService.kpis;

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
    { label: 'Atenção Básica (1)', value: '1' },
    { label: 'Média Complexidade (2)', value: '2' },
    { label: 'Alta Complexidade (3)', value: '3' },
    { label: 'Não se aplica (0)', value: '0' },
  ];

  // Ações de Usuário
  resetFilters(): void {
    this.monitoramentoService.resetFilters();
  }

  expandAll(): void {
    this.monitoramentoService.expandAll();
  }

  collapseAll(): void {
    this.monitoramentoService.collapseAll();
  }

  exportarDados(): void {
    this.monitoramentoService.exportarDados();
  }
}

export { MonitoramentoComponent as Monitoramento };

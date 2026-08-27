import { Injectable, computed, signal } from '@angular/core';
import {
  CompetenciaOption,
  GlobalBoundsContext,
  PeriodFilter,
  PeriodMode,
} from '../../models/competence.model';

@Injectable({
  providedIn: 'root',
})
export class CompetenceService {
  private readonly _defaultGlobalBounds: GlobalBoundsContext = {
    competenciaInicio: '202301',
    competenciaFim: '202612',
    descricao: 'Consolidação Global da Rede (01/2023 a 12/2026)',
    mesesCount: 48,
    contexto: 'DASHBOARD',
  };

  private readonly _globalBounds = signal<GlobalBoundsContext>(this._defaultGlobalBounds);
  readonly globalBounds = computed(() => this._globalBounds());

  private readonly _competencias = signal<CompetenciaOption[]>(this.generateCompetencias());
  private readonly _periodFilter = signal<PeriodFilter>({
    mode: 'SPECIFIC',
    competencia: '202403',
    competenciaInicio: '202403',
    competenciaFim: '202403',
    mesesCount: 1,
    descricaoFormatada: '03/2024 - Março',
  });

  // Novos signals reativos para análise temporal
  readonly periodFilter = computed(() => this._periodFilter());
  readonly periodMode = computed(() => this._periodFilter().mode);
  readonly mesesCount = computed(() => this._periodFilter().mesesCount);
  readonly periodoFormatado = computed(() => this._periodFilter().descricaoFormatada);

  // Getters computados retrocompatíveis
  readonly competencias = computed(() => this._competencias());
  readonly competencia = computed(() => {
    const pf = this._periodFilter();
    return pf.competencia ?? pf.competenciaInicio ?? '202403';
  });

  readonly competenciaFormatada = computed(() => {
    const pf = this._periodFilter();
    if (pf.mode === 'SPECIFIC') {
      return this.formatCompetenciaShort(this.competencia());
    }
    return pf.descricaoFormatada;
  });

  readonly selectedOption = computed(() => {
    return this.competencias().find((c) => c.value === this.competencia()) ?? null;
  });

  /**
   * Define os limites e contexto para o modo Vigência Global.
   */
  setGlobalBounds(bounds: GlobalBoundsContext): void {
    this._globalBounds.set(bounds);
  }

  /**
   * Restaura os limites globais padrão (Dashboard).
   */
  resetGlobalBounds(): void {
    this._globalBounds.set(this._defaultGlobalBounds);
  }

  /**
   * Aplica a vigência global baseada nos limites atualmente configurados no contexto ativo.
   */
  applyGlobal(): void {
    const bounds = this._globalBounds();
    this.setGlobal(bounds.competenciaInicio, bounds.competenciaFim);
  }

  /**
   * Define uma competência mensal específica (Modo SPECIFIC - N=1).
   */
  setSpecificCompetence(competencia: string): void {
    if (!competencia || competencia.length !== 6) return;
    const label = this.getLabelForCompetencia(competencia);
    this._periodFilter.set({
      mode: 'SPECIFIC',
      competencia,
      competenciaInicio: competencia,
      competenciaFim: competencia,
      mesesCount: 1,
      descricaoFormatada: label,
    });
  }

  /**
   * Define um intervalo temporal customizado (Modo RANGE - N>=1).
   */
  setRange(inicio: string, fim: string): void {
    if (!inicio || inicio.length !== 6 || !fim || fim.length !== 6) return;
    let start = inicio;
    let end = fim;
    if (start > end) {
      start = fim;
      end = inicio;
    }

    const mesesCount = this.countMonthsBetween(start, end);
    const descricaoFormatada = `${this.formatCompetenciaShort(start)} a ${this.formatCompetenciaShort(end)} (${mesesCount} ${mesesCount === 1 ? 'mês' : 'meses'})`;

    this._periodFilter.set({
      mode: 'RANGE',
      competencia: null,
      competenciaInicio: start,
      competenciaFim: end,
      mesesCount,
      descricaoFormatada,
    });
  }

  /**
   * Define a vigência global do contrato / histórico (Modo GLOBAL).
   */
  setGlobal(inicio: string = '202301', fim: string = '202612'): void {
    const mesesCount = this.countMonthsBetween(inicio, fim);
    const bounds = this._globalBounds();
    let descricaoFormatada = `Vigência Global (${this.formatCompetenciaShort(inicio)} a ${this.formatCompetenciaShort(fim)} - ${mesesCount} meses)`;
    if (bounds.contexto === 'MONITORAMENTO' && bounds.contratoNumero) {
      descricaoFormatada = `Vigência Contrato ${bounds.contratoNumero} (${this.formatCompetenciaShort(inicio)} a ${this.formatCompetenciaShort(fim)} - ${mesesCount} meses)`;
    }

    this._periodFilter.set({
      mode: 'GLOBAL',
      competencia: null,
      competenciaInicio: inicio,
      competenciaFim: fim,
      mesesCount,
      descricaoFormatada,
    });
  }

  /**
   * Método de compatibilidade para troca simples de competência mensal.
   */
  setCompetence(competencia: string): void {
    this.setSpecificCompetence(competencia);
  }

  /**
   * Avança para a próxima competência mensal ou desloca a janela do intervalo.
   */
  nextCompetence(): void {
    const current = this._periodFilter();
    if (current.mode === 'SPECIFIC') {
      const nextCode = this.addMonths(current.competencia || '202401', 1);
      this.setSpecificCompetence(nextCode);
    } else if (current.mode === 'RANGE' && current.competenciaInicio && current.competenciaFim) {
      const nextInicio = this.addMonths(current.competenciaInicio, 1);
      const nextFim = this.addMonths(current.competenciaFim, 1);
      this.setRange(nextInicio, nextFim);
    }
  }

  /**
   * Retrocede para a competência mensal anterior ou desloca a janela do intervalo.
   */
  previousCompetence(): void {
    const current = this._periodFilter();
    if (current.mode === 'SPECIFIC') {
      const prevCode = this.addMonths(current.competencia || '202401', -1);
      this.setSpecificCompetence(prevCode);
    } else if (current.mode === 'RANGE' && current.competenciaInicio && current.competenciaFim) {
      const prevInicio = this.addMonths(current.competenciaInicio, -1);
      const prevFim = this.addMonths(current.competenciaFim, -1);
      this.setRange(prevInicio, prevFim);
    }
  }

  /**
   * Calcula o número de meses entre duas competências YYYYMM inclusivas.
   */
  countMonthsBetween(inicio: string, fim: string): number {
    if (!inicio || !fim || inicio.length !== 6 || fim.length !== 6) return 1;
    const anoInicio = parseInt(inicio.substring(0, 4), 10);
    const mesInicio = parseInt(inicio.substring(4, 6), 10);
    const anoFim = parseInt(fim.substring(0, 4), 10);
    const mesFim = parseInt(fim.substring(4, 6), 10);

    const count = (anoFim - anoInicio) * 12 + (mesFim - mesInicio) + 1;
    return count > 0 ? count : 1;
  }

  /**
   * Adiciona ou subtrai meses de uma competência YYYYMM.
   */
  addMonths(code: string, months: number): string {
    if (!code || code.length !== 6) return code;
    let ano = parseInt(code.substring(0, 4), 10);
    let mes = parseInt(code.substring(4, 6), 10);

    let totalMonths = ano * 12 + (mes - 1) + months;
    const nextAno = Math.floor(totalMonths / 12);
    const nextMes = (totalMonths % 12) + 1;

    return `${nextAno}${nextMes.toString().padStart(2, '0')}`;
  }

  /**
   * Formata competência YYYYMM para MM/AAAA.
   */
  formatCompetenciaShort(raw: string | null): string {
    if (!raw || raw.length !== 6) return raw || '';
    const ano = raw.substring(0, 4);
    const mes = raw.substring(4, 6);
    return `${mes}/${ano}`;
  }

  /**
   * Obtém label descritivo para uma competência (ex: "01/2024 - Janeiro").
   */
  getLabelForCompetencia(code: string): string {
    const opt = this.competencias().find((c) => c.value === code);
    if (opt) return opt.label;
    return this.formatCompetenciaShort(code);
  }

  private generateCompetencias(): CompetenciaOption[] {
    const options: CompetenciaOption[] = [];
    const nomesMeses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    // Gera lista de 2023 até 2026 em ordem decrescente
    for (let ano = 2026; ano >= 2023; ano--) {
      for (let mes = 12; mes >= 1; mes--) {
        const mesPad = mes.toString().padStart(2, '0');
        options.push({
          value: `${ano}${mesPad}`,
          label: `${mesPad}/${ano} - ${nomesMeses[mes - 1]}`,
          ano,
          mes,
        });
      }
    }

    return options;
  }

  /**
   * Avança para o próximo período (compatibilidade com seletor unificado).
   */
  nextPeriod(): void {
    this.nextCompetence();
  }

  /**
   * Retrocede para o período anterior (compatibilidade com seletor unificado).
   */
  previousPeriod(): void {
    this.previousCompetence();
  }
}


import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ProducaoPorProcedimento, ProducaoResumoMensal } from '../../models/producao.model';
import { PeriodFilter } from '../../models/competence.model';
import { StatusExecucao, calcularStatusExecucao } from '../../models/domain-enums.model';
import { MOCK_PRODUCAO_PROCEDIMENTOS, MOCK_PRODUCAO_RESUMO } from '../../mocks/producao.mock';

export interface ProducaoFiltros {
  competencia?: string;
  competenciaInicio?: string;
  competenciaFim?: string;
  cnes?: string;
  instituicaoId?: number;
  vinculoId?: number;
  quadrimestre?: string;
  statusExecucao?: string;
  termoBusca?: string;
  period?: PeriodFilter;
}

@Injectable({
  providedIn: 'root',
})
export class ProducaoService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly apiUrl = '/api/producao';

  /**
   * Obtém o resumo mensal de produção por competência e opcionalmente CNES/instituição.
   * Suporta chamada HTTP com fallback transparente para dados mockados.
   */
  getResumoMensal(competencia: string, cnes?: string): Observable<ProducaoResumoMensal[]> {
    if (this.http) {
      let params = new HttpParams().set('competencia', competencia);
      if (cnes) {
        params = params.set('cnes', cnes);
      }
      return this.http
        .get<ProducaoResumoMensal[]>(`${this.apiUrl}/resumo-mensal`, { params })
        .pipe(catchError(() => this.getMockResumoMensal(competencia, cnes)));
    }
    return this.getMockResumoMensal(competencia, cnes);
  }

  /**
   * Obtém a produção detalhada por procedimento para uma competência específica (modo legado/mensal).
   */
  getProducaoPorProcedimento(
    competencia: string,
    instituicaoId?: number,
    cnes?: string,
    vinculoId?: number,
  ): Observable<ProducaoPorProcedimento[]> {
    const period: PeriodFilter = {
      mode: 'SPECIFIC',
      competencia,
      competenciaInicio: competencia,
      competenciaFim: competencia,
      mesesCount: 1,
      descricaoFormatada: competencia,
    };
    return this.getProducaoPorPeriodo(period, instituicaoId, cnes, vinculoId);
  }

  /**
   * Obtém a produção detalhada agregada por Período (Mês Específico, Recorte de Tempo ou Visão Global).
   */
  getProducaoPorPeriodo(
    period: PeriodFilter,
    instituicaoId?: number,
    cnes?: string,
    vinculoId?: number,
  ): Observable<ProducaoPorProcedimento[]> {
    if (this.http) {
      let params = new HttpParams().set('mode', period.mode);
      if (period.competencia) {
        params = params.set('competencia', period.competencia);
      }
      if (period.competenciaInicio) {
        params = params.set('competenciaInicio', period.competenciaInicio);
      }
      if (period.competenciaFim) {
        params = params.set('competenciaFim', period.competenciaFim);
      }
      if (period.mesesCount) {
        params = params.set('mesesCount', period.mesesCount.toString());
      }
      if (instituicaoId !== undefined) {
        params = params.set('instituicaoId', instituicaoId.toString());
      }
      if (cnes !== undefined) {
        params = params.set('cnes', cnes);
      }
      if (vinculoId !== undefined) {
        params = params.set('vinculoId', vinculoId.toString());
      }

      return this.http
        .get<ProducaoPorProcedimento[]>(`${this.apiUrl}/por-periodo`, { params })
        .pipe(
          catchError(() => this.getMockProducaoPorPeriodo(period, instituicaoId, cnes, vinculoId)),
        );
    }

    return this.getMockProducaoPorPeriodo(period, instituicaoId, cnes, vinculoId);
  }

  /**
   * Retorna resumo mockado filtrado por competência e CNES.
   */
  getMockResumoMensal(competencia?: string, cnes?: string): Observable<ProducaoResumoMensal[]> {
    let result = [...MOCK_PRODUCAO_RESUMO];
    if (competencia) {
      result = result.filter((r) => r.competencia === competencia);
    }
    if (cnes) {
      result = result.filter((r) => r.cnes === cnes);
    }
    return of(result).pipe(delay(150));
  }

  /**
   * Retorna lista de procedimentos mockados filtrados por competência, CNES e Vínculo.
   */
  getMockProducaoPorProcedimento(
    competencia?: string,
    cnes?: string,
    vinculoId?: number,
  ): Observable<ProducaoPorProcedimento[]> {
    let result = [...MOCK_PRODUCAO_PROCEDIMENTOS];
    if (competencia) {
      result = result.filter((p) => p.competencia === competencia);
    }
    if (cnes) {
      result = result.filter((p) => p.cnes === cnes);
    }
    if (vinculoId !== undefined) {
      result = result.filter((p) => p.vinculoId === vinculoId);
    }
    return of(result).pipe(delay(150));
  }

  /**
   * Consolidação / Agregação Temporal de Procedimentos para Mês Específico, Recortes e Visão Global.
   */
  getMockProducaoPorPeriodo(
    period: PeriodFilter,
    instituicaoId?: number,
    cnes?: string,
    vinculoId?: number,
  ): Observable<ProducaoPorProcedimento[]> {
    let allProcs = [...MOCK_PRODUCAO_PROCEDIMENTOS];

    if (cnes) {
      allProcs = allProcs.filter((p) => p.cnes === cnes);
    }
    if (vinculoId !== undefined) {
      allProcs = allProcs.filter((p) => p.vinculoId === vinculoId);
    }

    // Modo 1: Mês Específico (N = 1)
    if (period.mode === 'SPECIFIC' || period.mesesCount === 1) {
      const compTarget = period.competencia || period.competenciaInicio || '202401';
      let filtered = allProcs.filter((p) => p.competencia === compTarget);

      // Se a competência específica não tiver registros no mock, simula os procedimentos padrão com dados base
      if (filtered.length === 0 && allProcs.length > 0) {
        const uniqueProcsMap = new Map<string, ProducaoPorProcedimento>();
        for (const p of allProcs) {
          if (!uniqueProcsMap.has(p.coProcedimento)) {
            uniqueProcsMap.set(p.coProcedimento, { ...p, competencia: compTarget });
          }
        }
        filtered = Array.from(uniqueProcsMap.values());
      }

      return of(filtered).pipe(delay(120));
    }

    // Modo 2 e 3: RANGE ou GLOBAL (N > 1)
    const startComp = period.competenciaInicio || '202301';
    const endComp = period.competenciaFim || '202612';
    const N = Math.max(period.mesesCount || 1, 1);

    // Filtra pelo intervalo de competências no dataset
    let matchingProcs = allProcs.filter(
      (p) => p.competencia >= startComp && p.competencia <= endComp,
    );

    // Se o dataset não possui todas as competências gravadas explicitamente,
    // usamos os procedimentos base únicos do vínculo/CNES para compor a projeção dos N meses
    const baseMap = new Map<string, ProducaoPorProcedimento[]>();

    if (matchingProcs.length > 0) {
      for (const p of matchingProcs) {
        if (!baseMap.has(p.coProcedimento)) {
          baseMap.set(p.coProcedimento, []);
        }
        baseMap.get(p.coProcedimento)!.push(p);
      }
    } else {
      for (const p of allProcs) {
        if (!baseMap.has(p.coProcedimento)) {
          baseMap.set(p.coProcedimento, []);
        }
        baseMap.get(p.coProcedimento)!.push(p);
      }
    }

    const aggregatedList: ProducaoPorProcedimento[] = [];

    for (const [coProc, procList] of baseMap.entries()) {
      const template = procList[0];
      const countInInterval = procList.length;

      // Soma dos valores apurados reais nas competências presentes
      let sumQtdAprovada = procList.reduce((acc, cur) => acc + (cur.qtdAprovada || 0), 0);
      let sumVlrAprovado = procList.reduce((acc, cur) => acc + (cur.vlrAprovado || 0), 0);
      let sumQtdProduzida = procList.reduce((acc, cur) => acc + (cur.qtdProduzida || 0), 0);
      let sumVlrProduzido = procList.reduce((acc, cur) => acc + (cur.vlrProduzido || 0), 0);

      // Se o número de competências no mock for menor que N meses do período,
      // escala proporcionalmente a produção aprovada/produzida baseada na média mensal
      if (countInInterval > 0 && countInInterval < N) {
        const factor = N / countInInterval;
        sumQtdAprovada = Math.round(sumQtdAprovada * factor);
        sumVlrAprovado = Math.round(sumVlrAprovado * factor * 100) / 100;
        sumQtdProduzida = Math.round(sumQtdProduzida * factor);
        sumVlrProduzido = Math.round(sumVlrProduzido * factor * 100) / 100;
      }

      // Meta física pactuada mensal multiplicada por N meses
      const baseQtdMensal = template.qtdPactuadaMensal;
      const qtdPactuadaPeriodo = baseQtdMensal !== null ? baseQtdMensal * N : null;

      // Valor unitário SIGTAP
      const vlUnitario =
        template.vlUnitario !== undefined
          ? template.vlUnitario
          : sumQtdAprovada > 0
            ? Math.round((sumVlrAprovado / sumQtdAprovada) * 100) / 100
            : 10.0;

      // Financeiro pactuado multiplicado por N meses
      const vlrPactuadoPeriodo =
        qtdPactuadaPeriodo !== null
          ? Math.round(qtdPactuadaPeriodo * vlUnitario * 100) / 100
          : null;

      // Saldo financeiro recalculado para o período
      const saldoFinanceiro =
        vlrPactuadoPeriodo !== null
          ? Math.round((sumVlrAprovado - vlrPactuadoPeriodo) * 100) / 100
          : sumVlrAprovado;

      // Percentuais de execução para o período
      const percExecucao =
        qtdPactuadaPeriodo !== null && qtdPactuadaPeriodo > 0
          ? Math.round((sumQtdAprovada / qtdPactuadaPeriodo) * 10000) / 100
          : null;

      const percExecucaoFinanceira =
        vlrPactuadoPeriodo !== null && vlrPactuadoPeriodo > 0
          ? Math.round((sumVlrAprovado / vlrPactuadoPeriodo) * 10000) / 100
          : null;

      // Status da execução física no período
      const statusExecucao: StatusExecucao = calcularStatusExecucao(
        qtdPactuadaPeriodo !== null && qtdPactuadaPeriodo > 0 ? percExecucao : null,
      );

      aggregatedList.push({
        ...template,
        competencia: `${startComp} a ${endComp}`,
        ano: startComp.substring(0, 4),
        mes: startComp.substring(4, 6),
        nomeMes: period.descricaoFormatada,
        quadrimestre: period.descricaoFormatada,
        qtdAprovada: sumQtdAprovada,
        vlrAprovado: sumVlrAprovado,
        qtdProduzida: sumQtdProduzida,
        vlrProduzido: sumVlrProduzido,
        qtdPactuadaMensal: qtdPactuadaPeriodo,
        vlUnitario,
        vlrPactuado: vlrPactuadoPeriodo,
        saldoFinanceiro,
        percExecucao,
        percExecucaoFinanceira,
        statusExecucao,
      });
    }

    return of(aggregatedList).pipe(delay(150));
  }
}

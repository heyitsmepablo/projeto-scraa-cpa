import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ProducaoPorProcedimento, ProducaoResumoMensal } from '../models/producao.model';
import { MOCK_PRODUCAO_PROCEDIMENTOS, MOCK_PRODUCAO_RESUMO } from '../mocks/producao.mock';

export interface ProducaoFiltros {
  competencia?: string;
  cnes?: string;
  instituicaoId?: number;
  quadrimestre?: string;
  statusExecucao?: string;
  termoBusca?: string;
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
      return this.http.get<ProducaoResumoMensal[]>(`${this.apiUrl}/resumo-mensal`, { params }).pipe(
        catchError(() => this.getMockResumoMensal(competencia, cnes))
      );
    }
    return this.getMockResumoMensal(competencia, cnes);
  }

  /**
   * Obtém a produção detalhada por procedimento, com suporte a filtros e fallback mock.
   */
  getProducaoPorProcedimento(
    competencia: string,
    instituicaoId?: number,
    cnes?: string
  ): Observable<ProducaoPorProcedimento[]> {
    if (this.http) {
      let params = new HttpParams().set('competencia', competencia);
      if (instituicaoId !== undefined) {
        params = params.set('instituicaoId', instituicaoId.toString());
      }
      if (cnes !== undefined) {
        params = params.set('cnes', cnes);
      }
      return this.http.get<ProducaoPorProcedimento[]>(`${this.apiUrl}/por-procedimento`, { params }).pipe(
        catchError(() => this.getMockProducaoPorProcedimento(competencia, cnes))
      );
    }
    return this.getMockProducaoPorProcedimento(competencia, cnes);
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
   * Retorna lista de procedimentos mockados filtrados por competência e CNES.
   */
  getMockProducaoPorProcedimento(
    competencia?: string,
    cnes?: string
  ): Observable<ProducaoPorProcedimento[]> {
    let result = [...MOCK_PRODUCAO_PROCEDIMENTOS];
    if (competencia) {
      result = result.filter((p) => p.competencia === competencia);
    }
    if (cnes) {
      result = result.filter((p) => p.cnes === cnes);
    }
    return of(result).pipe(delay(150));
  }
}

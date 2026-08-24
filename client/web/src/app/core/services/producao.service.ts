import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProducaoPorProcedimento, ProducaoResumoMensal } from '../models/producao.model';

@Injectable({
  providedIn: 'root',
})
export class ProducaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/producao';

  getResumoMensal(competencia: string): Observable<ProducaoResumoMensal[]> {
    const params = new HttpParams().set('competencia', competencia);
    return this.http.get<ProducaoResumoMensal[]>(`${this.apiUrl}/resumo-mensal`, { params });
  }

  getProducaoPorProcedimento(competencia: string, instituicaoId?: number): Observable<ProducaoPorProcedimento[]> {
    let params = new HttpParams().set('competencia', competencia);
    if (instituicaoId !== undefined) {
      params = params.set('instituicaoId', instituicaoId.toString());
    }
    return this.http.get<ProducaoPorProcedimento[]>(`${this.apiUrl}/por-procedimento`, { params });
  }
}

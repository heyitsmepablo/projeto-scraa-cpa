import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PeriodFilter } from '../../../core/models/competence.model';
import { MonitoramentoAnaliticoDto, MonitoramentoResumoDto } from './monitoramento.dto';

@Injectable({ providedIn: 'root' })
export class MonitoramentoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/monitoramento';

  getResumo(vinculoId: number, filter: PeriodFilter): Observable<MonitoramentoResumoDto> {
    let params = new HttpParams();
    if (filter.mode === 'SPECIFIC' && filter.competencia) {
      params = params.set('mesAno', filter.competencia);
    } else if (filter.mode === 'RANGE' && filter.competenciaInicio && filter.competenciaFim) {
      // O backend espera dataInicio e dataFim, que podemos derivar das competências
      const startYear = filter.competenciaInicio.substring(0, 4);
      const startMonth = filter.competenciaInicio.substring(4, 6);
      params = params.set('dataInicio', `${startYear}-${startMonth}-01`);
      
      const endYear = filter.competenciaFim.substring(0, 4);
      const endMonth = filter.competenciaFim.substring(4, 6);
      params = params.set('dataFim', `${endYear}-${endMonth}-28`); // Dia fixo apenas para recorte
    }
    return this.http.get<MonitoramentoResumoDto>(`${this.baseUrl}/${vinculoId}/resumo`, { params });
  }

  getAnalitico(vinculoId: number, filter: PeriodFilter): Observable<MonitoramentoAnaliticoDto> {
    let params = new HttpParams();
    if (filter.mode === 'SPECIFIC' && filter.competencia) {
      params = params.set('mesAno', filter.competencia);
    } else if (filter.mode === 'RANGE' && filter.competenciaInicio && filter.competenciaFim) {
      const startYear = filter.competenciaInicio.substring(0, 4);
      const startMonth = filter.competenciaInicio.substring(4, 6);
      params = params.set('dataInicio', `${startYear}-${startMonth}-01`);
      
      const endYear = filter.competenciaFim.substring(0, 4);
      const endMonth = filter.competenciaFim.substring(4, 6);
      params = params.set('dataFim', `${endYear}-${endMonth}-28`);
    }
    return this.http.get<MonitoramentoAnaliticoDto>(`${this.baseUrl}/${vinculoId}/analitico`, { params });
  }
}

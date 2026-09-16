import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PlanoOperativo,
  PlanoOperativoProcedimento,
  PlanoOperativoResumo,
  VinculoPlanoOption,
  DistribuicaoComplexidade,
} from '../models/plano-operativo.model';
import { SigtapProcedimento } from '../../../core/models/sigtap.model';

@Injectable({
  providedIn: 'root',
})
export class PlanoOperativoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/planos-operativos';

  findAll(): Observable<PlanoOperativo[]> {
    return this.http.get<PlanoOperativo[]>(this.apiUrl);
  }

  findById(id: number): Observable<PlanoOperativo | undefined> {
    return this.http.get<PlanoOperativo>(`${this.apiUrl}/${id}`);
  }

  findByVinculoId(vinculoId: number): Observable<PlanoOperativo[]> {
    return this.http.get<PlanoOperativo[]>(`${this.apiUrl}/vinculo/${vinculoId}`);
  }

  findVigenteByVinculoId(vinculoId: number): Observable<PlanoOperativo | undefined> {
    return this.http.get<PlanoOperativo>(`${this.apiUrl}/vinculo/${vinculoId}/vigente`);
  }

  findProcedimentos(planoOperativoId: number): Observable<PlanoOperativoProcedimento[]> {
    return this.http.get<PlanoOperativoProcedimento[]>(`${this.apiUrl}/${planoOperativoId}/procedimentos`);
  }

  getResumo(planoOperativoId: number): Observable<PlanoOperativoResumo | undefined> {
    return this.http.get<PlanoOperativoResumo>(`${this.apiUrl}/${planoOperativoId}/resumo`);
  }

  getVinculoOptions(): Observable<VinculoPlanoOption[]> {
    return this.http.get<VinculoPlanoOption[]>(`${this.apiUrl}/opcoes/vinculos`);
  }
}


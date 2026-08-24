import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanoOperativo, PlanoOperativoProcedimento } from '../models/plano-operativo.model';

@Injectable({
  providedIn: 'root',
})
export class PlanoOperativoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/planos-operativos';

  findAll(): Observable<PlanoOperativo[]> {
    return this.http.get<PlanoOperativo[]>(this.apiUrl);
  }

  findById(id: number): Observable<PlanoOperativo> {
    return this.http.get<PlanoOperativo>(`${this.apiUrl}/${id}`);
  }

  findByVinculoId(vinculoId: number): Observable<PlanoOperativo[]> {
    return this.http.get<PlanoOperativo[]>(`${this.apiUrl}/vinculo/${vinculoId}`);
  }

  findProcedimentos(planoOperativoId: number): Observable<PlanoOperativoProcedimento[]> {
    return this.http.get<PlanoOperativoProcedimento[]>(`${this.apiUrl}/${planoOperativoId}/procedimentos`);
  }
}

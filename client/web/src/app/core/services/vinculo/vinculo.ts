import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vinculo, Aditivo } from '../../models/vinculo.model';
import { TipoAditivo, TipoComplexidade, TipoVinculo } from '../../models/domain-enums.model';

@Injectable({
  providedIn: 'root',
})
export class VinculoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/vinculos';

  findAll(): Observable<Vinculo[]> {
    return this.http.get<Vinculo[]>(this.apiUrl);
  }

  findById(id: number): Observable<Vinculo> {
    return this.http.get<Vinculo>(`${this.apiUrl}/${id}`);
  }

  findByInstituicaoId(instituicaoId: number): Observable<Vinculo[]> {
    return this.http.get<Vinculo[]>(`${this.apiUrl}/instituicao/${instituicaoId}`);
  }

  findAditivosByVinculoId(vinculoId: number): Observable<Aditivo[]> {
    return this.http.get<Aditivo[]>(`${this.apiUrl}/${vinculoId}/aditivos`);
  }
}

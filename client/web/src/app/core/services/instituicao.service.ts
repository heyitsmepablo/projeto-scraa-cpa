import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Instituicao } from '../models/instituicao.model';

@Injectable({
  providedIn: 'root',
})
export class InstituicaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/instituicoes';

  findAll(): Observable<Instituicao[]> {
    return this.http.get<Instituicao[]>(this.apiUrl);
  }

  findById(id: number): Observable<Instituicao> {
    return this.http.get<Instituicao>(`${this.apiUrl}/${id}`);
  }

  findByCnes(cnes: string): Observable<Instituicao> {
    return this.http.get<Instituicao>(`${this.apiUrl}/cnes/${cnes}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SigtapGrupo {
  coGrupo: string;
  noGrupo: string;
}

export interface SigtapSubgrupo {
  coGrupo: string;
  coSubGrupo: string;
  noSubGrupo: string;
}

export interface SigtapFormaOrganizacao {
  coGrupo: string;
  coSubGrupo: string;
  coFormaOrganizacao: string;
  noFormaOrganizacao: string;
}

export interface SigtapProcedimento {
  coProcedimento: string;
  noProcedimento: string;
  tpComplexidade: string;
  dtCompetencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class SigtapService {
  private http = inject(HttpClient);
  private apiUrl = '/api/sigtap';

  getGrupos(): Observable<SigtapGrupo[]> {
    return this.http.get<SigtapGrupo[]>(`${this.apiUrl}/grupos`);
  }

  getSubgrupos(grupoCodigo?: string): Observable<SigtapSubgrupo[]> {
    let params = new HttpParams();
    if (grupoCodigo) {
      params = params.set('grupoCodigo', grupoCodigo);
    }
    return this.http.get<SigtapSubgrupo[]>(`${this.apiUrl}/subgrupos`, { params });
  }

  getFormasOrganizacao(grupoCodigo?: string, subgrupoCodigo?: string): Observable<SigtapFormaOrganizacao[]> {
    let params = new HttpParams();
    if (grupoCodigo) {
      params = params.set('grupoCodigo', grupoCodigo);
    }
    if (subgrupoCodigo) {
      params = params.set('subgrupoCodigo', subgrupoCodigo);
    }
    return this.http.get<SigtapFormaOrganizacao[]>(`${this.apiUrl}/formas-organizacao`, { params });
  }

  getProcedimentos(busca?: string, complexidade?: string, limit: number = 50, competencia?: string): Observable<SigtapProcedimento[]> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (busca) {
      params = params.set('busca', busca);
    }
    if (complexidade) {
      params = params.set('complexidade', complexidade);
    }
    if (competencia) {
      params = params.set('competencia', competencia);
    }
    
    return this.http.get<SigtapProcedimento[]>(`${this.apiUrl}/procedimentos`, { params });
  }
}

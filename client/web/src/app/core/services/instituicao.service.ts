import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Instituicao } from '../models/instituicao.model';
import { TipoInstituicao } from '../models/domain-enums';

const MOCK_INSTITUICOES: Instituicao[] = [
  {
    id: 1,
    nome: 'SANTA CASA DE MISERICÓRDIA',
    cnes: '1234567',
    cnpj: '61.699.567/0001-92',
    tipoInstituicao: 'FILANTRÓPICO',
    criadoEm: new Date('2023-01-10T10:00:00Z'),
  },
  {
    id: 2,
    nome: 'HOSPITAL SÃO PAULO',
    cnes: '7654321',
    cnpj: '60.453.016/0001-74',
    tipoInstituicao: 'FILANTRÓPICO',
    criadoEm: new Date('2023-02-15T14:30:00Z'),
  },
  {
    id: 3,
    nome: 'CLÍNICA MÉDICA SAÚDE TOTAL LTDA',
    cnes: '2345678',
    cnpj: '12.345.678/0001-99',
    tipoInstituicao: 'EMPRESA',
    criadoEm: new Date('2023-03-20T09:15:00Z'),
  },
  {
    id: 4,
    nome: 'INSTITUTO DO CÂNCER',
    cnes: '3456789',
    cnpj: '09.123.456/0001-22',
    tipoInstituicao: 'EMPRESA',
    criadoEm: new Date('2023-04-05T11:45:00Z'),
  },
  {
    id: 5,
    nome: 'HOSPITAL BENEFICÊNCIA PORTUGUESA',
    cnes: '4567890',
    cnpj: '61.599.876/0001-34',
    tipoInstituicao: 'FILANTRÓPICO',
    criadoEm: new Date('2023-05-12T16:20:00Z'),
  }
];

@Injectable({
  providedIn: 'root',
})
export class InstituicaoService {
  findAll(): Observable<Instituicao[]> {
    return of(MOCK_INSTITUICOES).pipe(delay(200));
  }

  findById(id: number): Observable<Instituicao> {
    const inst = MOCK_INSTITUICOES.find(i => i.id === id);
    return of(inst as Instituicao).pipe(delay(200));
  }

  findByCnes(cnes: string): Observable<Instituicao> {
    const inst = MOCK_INSTITUICOES.find(i => i.cnes === cnes);
    return of(inst as Instituicao).pipe(delay(200));
  }
}

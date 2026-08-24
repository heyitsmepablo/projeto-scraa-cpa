import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Vinculo, Aditivo } from '../models/vinculo.model';
import { TipoAditivo, TipoComplexidade, TipoVinculo } from '../models/domain-enums';

const today = new Date();
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
const nextYear = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

const MOCK_VINCULOS: Vinculo[] = [
  {
    id: 1,
    instituicaoId: 1,
    numero: 'CONV-001/2023',
    numeroProcessoSei: '6018.2023/0000001-1',
    tipoVinculo: 'CONVÊNIO',
    objeto: 'Prestação de serviços de saúde ambulatorial e hospitalar.',
    complexidade: ['MC', 'AC'],
    dataDaAssinatura: new Date('2023-01-01T00:00:00Z'),
    dataInicio: new Date('2023-01-01T00:00:00Z'),
    dataFim: nextYear, // Ativo
    valorTotal: 15000000.00,
    aditivos: [
      {
        id: 101,
        vinculoId: 1,
        numero: 'TA-001/2023',
        numeroProcessoSei: '6018.2023/0000001-2',
        tipoAditivo: ['PRAZO', 'ACRÉSCIMO'],
        dataDaAssinatura: new Date('2023-12-01T00:00:00Z'),
        dataInicio: new Date('2024-01-01T00:00:00Z'),
        dataFim: nextYear,
        valorTotal: 1500000.00
      }
    ]
  },
  {
    id: 2,
    instituicaoId: 2,
    numero: 'CONT-042/2022',
    numeroProcessoSei: '6018.2022/0000042-8',
    tipoVinculo: 'CONTRATO',
    objeto: 'Gestão e execução de atividades de saúde em hospital geral.',
    complexidade: ['BC', 'MC', 'AC'],
    dataDaAssinatura: new Date('2022-06-15T00:00:00Z'),
    dataInicio: new Date('2022-06-15T00:00:00Z'),
    dataFim: nextWeek, // Expirando
    valorTotal: 8500000.00,
    aditivos: [
      {
        id: 102,
        vinculoId: 2,
        numero: 'TA-001/2023',
        numeroProcessoSei: '6018.2023/0000050-1',
        tipoAditivo: ['SUPRESSÃO'],
        dataDaAssinatura: new Date('2023-06-10T00:00:00Z'),
        dataInicio: new Date('2023-06-15T00:00:00Z'),
        dataFim: nextWeek,
        valorTotal: -500000.00
      }
    ]
  },
  {
    id: 3,
    instituicaoId: 3,
    numero: 'CONT-099/2021',
    numeroProcessoSei: '6018.2021/0000099-9',
    tipoVinculo: 'CONTRATO',
    objeto: 'Realização de exames de imagem e diagnóstico.',
    complexidade: ['MC'],
    dataDaAssinatura: new Date('2021-03-10T00:00:00Z'),
    dataInicio: new Date('2021-03-10T00:00:00Z'),
    dataFim: lastMonth, // Expirado
    valorTotal: 1200000.00,
    aditivos: []
  },
  {
    id: 4,
    instituicaoId: 1,
    numero: 'CONT-002/2024',
    numeroProcessoSei: '6018.2024/0000002-2',
    tipoVinculo: 'CONTRATO',
    objeto: 'Manutenção de leitos de UTI.',
    complexidade: ['AC'],
    dataDaAssinatura: new Date('2024-01-15T00:00:00Z'),
    dataInicio: new Date('2024-01-15T00:00:00Z'),
    dataFim: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // Expirando
    valorTotal: 5000000.00,
    aditivos: []
  }
];

@Injectable({
  providedIn: 'root',
})
export class VinculoService {
  findAll(): Observable<Vinculo[]> {
    return of(MOCK_VINCULOS).pipe(delay(200));
  }

  findById(id: number): Observable<Vinculo> {
    const vinculo = MOCK_VINCULOS.find(v => v.id === id);
    return of(vinculo as Vinculo).pipe(delay(200));
  }

  findByInstituicaoId(instituicaoId: number): Observable<Vinculo[]> {
    const vinculos = MOCK_VINCULOS.filter(v => v.instituicaoId === instituicaoId);
    return of(vinculos).pipe(delay(200));
  }

  findAditivosByVinculoId(vinculoId: number): Observable<Aditivo[]> {
    const vinculo = MOCK_VINCULOS.find(v => v.id === vinculoId);
    return of(vinculo?.aditivos || []).pipe(delay(200));
  }
}

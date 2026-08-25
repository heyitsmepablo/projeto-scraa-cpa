import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  PlanoOperativo,
  PlanoOperativoProcedimento,
  PlanoOperativoResumo,
  VinculoPlanoOption,
  DistribuicaoComplexidade,
} from '../models/plano-operativo.model';
import { SigtapProcedimento } from '../../../core/models/sigtap.model';

export const MOCK_SIGTAP_PROCEDIMENTOS: SigtapProcedimento[] = [
  {
    coProcedimento: '0301010072',
    noProcedimento: 'CONSULTA MEDICA EM ATENCAO ESPECIALIZADA',
    tpComplexidade: 'MC',
    tpSexo: 'I',
    qtMaximaExecucao: 99,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 10.0,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0204030188',
    noProcedimento: 'RADIOGRAFIA DE TORAX (PA E PERFIL)',
    tpComplexidade: 'BC',
    tpSexo: 'I',
    qtMaximaExecucao: 2,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 19.8,
    vlSp: 0,
    coFinanciamento: '01',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0205020097',
    noProcedimento: 'ULTRASSONOGRAFIA DE ABDOMEN TOTAL',
    tpComplexidade: 'MC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 37.95,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0206010079',
    noProcedimento: 'TOMOGRAFIA COMPUTADORIZADA DE CRANIO',
    tpComplexidade: 'MC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 86.2,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0207010064',
    noProcedimento: 'RESSONANCIA MAGNETICA DE CRANIO',
    tpComplexidade: 'AC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 268.75,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0406010683',
    noProcedimento: 'REVASCULARIZACAO DO MIOCARDIO COM USO DE ARTERIA OU VEIA',
    tpComplexidade: 'AC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 7,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 18,
    vlIdadeMaxima: 130,
    vlSh: 4250.0,
    vlSa: 0,
    vlSp: 1850.0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0305010166',
    noProcedimento: 'HEMODIALISE EM PACIENTE COM INSUFICIENCIA RENAL CRONICA (3 SESSOES/SEM)',
    tpComplexidade: 'AC',
    tpSexo: 'I',
    qtMaximaExecucao: 14,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 214.3,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0202020380',
    noProcedimento: 'HEMOGRAMA COMPLETO',
    tpComplexidade: 'BC',
    tpSexo: 'I',
    qtMaximaExecucao: 5,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 4.11,
    vlSp: 0,
    coFinanciamento: '01',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0202010120',
    noProcedimento: 'DOSAGEM DE GLICOSE',
    tpComplexidade: 'BC',
    tpSexo: 'I',
    qtMaximaExecucao: 5,
    qtDiasPermanencia: 0,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 1.85,
    vlSp: 0,
    coFinanciamento: '01',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0301080249',
    noProcedimento: 'DIARIA DE UNIDADE DE TERAPIA INTENSIVA ADULTO - TIPO III',
    tpComplexidade: 'AC',
    tpSexo: 'I',
    qtMaximaExecucao: 30,
    qtDiasPermanencia: 1,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 14,
    vlIdadeMaxima: 130,
    vlSh: 600.0,
    vlSa: 0,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0301080230',
    noProcedimento: 'DIARIA DE UNIDADE DE TERAPIA INTENSIVA CORONARIANA - UTI TIPO II',
    tpComplexidade: 'AC',
    tpSexo: 'I',
    qtMaximaExecucao: 30,
    qtDiasPermanencia: 1,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 14,
    vlIdadeMaxima: 130,
    vlSh: 550.0,
    vlSa: 0,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0408050161',
    noProcedimento: 'TRATAMENTO CIRURGICO DE FRATURA DIAFISARIA DOS OSSOS DO ANTEBRACO',
    tpComplexidade: 'MC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 3,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 380.0,
    vlSa: 0,
    vlSp: 190.0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
  {
    coProcedimento: '0301060088',
    noProcedimento: 'ATENDIMENTO DE URGENCIA COM OBSERVACAO ATE 24 HORAS EM ATENCAO ESPECIALIZADA',
    tpComplexidade: 'MC',
    tpSexo: 'I',
    qtMaximaExecucao: 1,
    qtDiasPermanencia: 1,
    qtTempoPermanencia: 0,
    qtPontos: 0,
    vlIdadeMinima: 0,
    vlIdadeMaxima: 130,
    vlSh: 0,
    vlSa: 45.0,
    vlSp: 0,
    coFinanciamento: '04',
    dtCompetencia: '202401',
  },
];

const sigtapMap = new Map<string, SigtapProcedimento>(
  MOCK_SIGTAP_PROCEDIMENTOS.map((proc) => [proc.coProcedimento, proc])
);

export const MOCK_PLANOS_OPERATIVOS: PlanoOperativo[] = [
  {
    id: 1,
    vinculoId: 1,
    vigente: true,
    criadoEm: new Date('2023-01-01T00:00:00Z'),
    vinculo: {
      id: 1,
      instituicaoId: 1,
      numero: 'CONV-001/2023',
      numeroProcessoSei: '6018.2023/0000001-1',
      tipoVinculo: 'CONVÊNIO',
      objeto: 'Prestação de serviços de saúde ambulatorial e hospitalar.',
      complexidade: ['MC', 'AC'],
      dataDaAssinatura: new Date('2023-01-01T00:00:00Z'),
      dataInicio: new Date('2023-01-01T00:00:00Z'),
      valorTotal: 500000.0,
      instituicao: {
        id: 1,
        nome: 'SANTA CASA DE MISERICÓRDIA',
        cnes: '1234567',
        cnpj: '61.699.567/0001-92',
        tipoInstituicao: 'FILANTRÓPICO',
      },
    },
    procedimentos: [
      {
        id: 101,
        planoOperativoId: 1,
        coProcedimento: '0301010072',
        quantidadePactuadaMensal: 1200,
        procedimento: sigtapMap.get('0301010072'),
      },
      {
        id: 102,
        planoOperativoId: 1,
        coProcedimento: '0205020097',
        quantidadePactuadaMensal: 350,
        procedimento: sigtapMap.get('0205020097'),
      },
      {
        id: 103,
        planoOperativoId: 1,
        coProcedimento: '0206010079',
        quantidadePactuadaMensal: 180,
        procedimento: sigtapMap.get('0206010079'),
      },
      {
        id: 104,
        planoOperativoId: 1,
        coProcedimento: '0207010064',
        quantidadePactuadaMensal: 85,
        procedimento: sigtapMap.get('0207010064'),
      },
      {
        id: 105,
        planoOperativoId: 1,
        coProcedimento: '0406010683',
        quantidadePactuadaMensal: 25,
        procedimento: sigtapMap.get('0406010683'),
      },
      {
        id: 106,
        planoOperativoId: 1,
        coProcedimento: '0305010166',
        quantidadePactuadaMensal: 480,
        procedimento: sigtapMap.get('0305010166'),
      },
    ],
  },
  {
    id: 2,
    vinculoId: 2,
    vigente: true,
    criadoEm: new Date('2022-06-15T00:00:00Z'),
    vinculo: {
      id: 2,
      instituicaoId: 2,
      numero: 'CONT-042/2022',
      numeroProcessoSei: '6018.2022/0000042-8',
      tipoVinculo: 'CONTRATO',
      objeto: 'Gestão e execução de atividades de saúde em hospital geral.',
      complexidade: ['BC', 'MC', 'AC'],
      dataDaAssinatura: new Date('2022-06-15T00:00:00Z'),
      dataInicio: new Date('2022-06-15T00:00:00Z'),
      valorTotal: 1200000.0,
      instituicao: {
        id: 2,
        nome: 'HOSPITAL SÃO PAULO',
        cnes: '7654321',
        cnpj: '60.453.016/0001-74',
        tipoInstituicao: 'FILANTRÓPICO',
      },
    },
    procedimentos: [
      {
        id: 201,
        planoOperativoId: 2,
        coProcedimento: '0202020380',
        quantidadePactuadaMensal: 2500,
        procedimento: sigtapMap.get('0202020380'),
      },
      {
        id: 202,
        planoOperativoId: 2,
        coProcedimento: '0202010120',
        quantidadePactuadaMensal: 2200,
        procedimento: sigtapMap.get('0202010120'),
      },
      {
        id: 203,
        planoOperativoId: 2,
        coProcedimento: '0204030188',
        quantidadePactuadaMensal: 800,
        procedimento: sigtapMap.get('0204030188'),
      },
      {
        id: 204,
        planoOperativoId: 2,
        coProcedimento: '0301010072',
        quantidadePactuadaMensal: 950,
        procedimento: sigtapMap.get('0301010072'),
      },
      {
        id: 205,
        planoOperativoId: 2,
        coProcedimento: '0301060088',
        quantidadePactuadaMensal: 600,
        procedimento: sigtapMap.get('0301060088'),
      },
      {
        id: 206,
        planoOperativoId: 2,
        coProcedimento: '0206010079',
        quantidadePactuadaMensal: 120,
        procedimento: sigtapMap.get('0206010079'),
      },
      {
        id: 207,
        planoOperativoId: 2,
        coProcedimento: '0408050161',
        quantidadePactuadaMensal: 45,
        procedimento: sigtapMap.get('0408050161'),
      },
      {
        id: 208,
        planoOperativoId: 2,
        coProcedimento: '0301080249',
        quantidadePactuadaMensal: 60,
        procedimento: sigtapMap.get('0301080249'),
      },
    ],
  },
  {
    id: 3,
    vinculoId: 3,
    vigente: false,
    criadoEm: new Date('2021-03-10T00:00:00Z'),
    expiradoEm: new Date('2024-01-01T00:00:00Z'),
    vinculo: {
      id: 3,
      instituicaoId: 3,
      numero: 'CONT-099/2021',
      numeroProcessoSei: '6018.2021/0000099-9',
      tipoVinculo: 'CONTRATO',
      objeto: 'Realização de exames de imagem e diagnóstico.',
      complexidade: ['MC'],
      dataDaAssinatura: new Date('2021-03-10T00:00:00Z'),
      dataInicio: new Date('2021-03-10T00:00:00Z'),
      valorTotal: 350000.0,
      instituicao: {
        id: 3,
        nome: 'CLÍNICA MÉDICA SAÚDE TOTAL LTDA',
        cnes: '2345678',
        cnpj: '12.345.678/0001-99',
        tipoInstituicao: 'EMPRESA',
      },
    },
    procedimentos: [
      {
        id: 301,
        planoOperativoId: 3,
        coProcedimento: '0301010072',
        quantidadePactuadaMensal: 400,
        procedimento: sigtapMap.get('0301010072'),
      },
      {
        id: 302,
        planoOperativoId: 3,
        coProcedimento: '0205020097',
        quantidadePactuadaMensal: 250,
        procedimento: sigtapMap.get('0205020097'),
      },
    ],
  },
  {
    id: 4,
    vinculoId: 4,
    vigente: true,
    criadoEm: new Date('2024-01-15T00:00:00Z'),
    vinculo: {
      id: 4,
      instituicaoId: 1,
      numero: 'CONT-002/2024',
      numeroProcessoSei: '6018.2024/0000002-2',
      tipoVinculo: 'CONTRATO',
      objeto: 'Manutenção de leitos de UTI.',
      complexidade: ['AC'],
      dataDaAssinatura: new Date('2024-01-15T00:00:00Z'),
      dataInicio: new Date('2024-01-15T00:00:00Z'),
      valorTotal: 800000.0,
      instituicao: {
        id: 1,
        nome: 'SANTA CASA DE MISERICÓRDIA',
        cnes: '1234567',
        cnpj: '61.699.567/0001-92',
        tipoInstituicao: 'FILANTRÓPICO',
      },
    },
    procedimentos: [
      {
        id: 401,
        planoOperativoId: 4,
        coProcedimento: '0301080249',
        quantidadePactuadaMensal: 90,
        procedimento: sigtapMap.get('0301080249'),
      },
      {
        id: 402,
        planoOperativoId: 4,
        coProcedimento: '0301080230',
        quantidadePactuadaMensal: 60,
        procedimento: sigtapMap.get('0301080230'),
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class PlanoOperativoService {
  findAll(): Observable<PlanoOperativo[]> {
    return of(MOCK_PLANOS_OPERATIVOS).pipe(delay(200));
  }

  findById(id: number): Observable<PlanoOperativo | undefined> {
    const plano = MOCK_PLANOS_OPERATIVOS.find((p) => p.id === id);
    return of(plano).pipe(delay(200));
  }

  findByVinculoId(vinculoId: number): Observable<PlanoOperativo[]> {
    const planos = MOCK_PLANOS_OPERATIVOS.filter((p) => p.vinculoId === vinculoId);
    return of(planos).pipe(delay(200));
  }

  findVigenteByVinculoId(vinculoId: number): Observable<PlanoOperativo | undefined> {
    const plano = MOCK_PLANOS_OPERATIVOS.find((p) => p.vinculoId === vinculoId && p.vigente);
    return of(plano).pipe(delay(200));
  }

  findProcedimentos(planoOperativoId: number): Observable<PlanoOperativoProcedimento[]> {
    const plano = MOCK_PLANOS_OPERATIVOS.find((p) => p.id === planoOperativoId);
    return of(plano?.procedimentos || []).pipe(delay(200));
  }

  getResumo(planoOperativoId: number): Observable<PlanoOperativoResumo | undefined> {
    const plano = MOCK_PLANOS_OPERATIVOS.find((p) => p.id === planoOperativoId);
    if (!plano) return of(undefined).pipe(delay(200));

    const procs = plano.procedimentos || [];
    const totalProcedimentos = procs.length;
    const metaFisicaTotal = procs.reduce((acc, curr) => acc + curr.quantidadePactuadaMensal, 0);

    const distribuicao: DistribuicaoComplexidade = {
      bc: 0,
      mc: 0,
      ac: 0,
    };

    for (const proc of procs) {
      const complexidade = proc.procedimento?.tpComplexidade?.toUpperCase();
      if (complexidade === 'BC') distribuicao.bc += proc.quantidadePactuadaMensal;
      else if (complexidade === 'MC') distribuicao.mc += proc.quantidadePactuadaMensal;
      else if (complexidade === 'AC') distribuicao.ac += proc.quantidadePactuadaMensal;
    }

    return of({
      planoOperativoId: plano.id,
      totalProcedimentos,
      metaFisicaTotal,
      distribuicaoComplexidade: distribuicao,
    }).pipe(delay(200));
  }

  getVinculoOptions(): Observable<VinculoPlanoOption[]> {
    const options: VinculoPlanoOption[] = MOCK_PLANOS_OPERATIVOS.map((p) => ({
      planoOperativoId: p.id,
      vinculoId: p.vinculoId,
      label: `${p.vinculo?.instituicao?.nome ?? 'Instituição'} - ${p.vinculo?.numero ?? 'Contrato'} ${p.vigente ? '(Vigente)' : '(Inativo)'}`,
      instituicaoNome: p.vinculo?.instituicao?.nome ?? 'Desconhecida',
      numeroVinculo: p.vinculo?.numero ?? `Vínculo #${p.vinculoId}`,
      vigente: p.vigente,
    }));
    return of(options).pipe(delay(150));
  }
}

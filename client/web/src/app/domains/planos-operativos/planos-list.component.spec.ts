import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { PlanosListComponent } from './planos-list.component';
import { CompetenceService } from '../../core/services/competence.service';
import { PlanoOperativoService } from '../../core/services/plano-operativo.service';
import { PlanoOperativo } from '../../core/models/plano-operativo.model';

describe('PlanosListComponent', () => {
  let component: PlanosListComponent;
  let fixture: ComponentFixture<PlanosListComponent>;
  let planoOperativoServiceMock: any;
  let competenceServiceMock: any;

  const mockPlanos: PlanoOperativo[] = [
    {
      id: 1,
      vinculoId: 1,
      vigente: true,
      criadoEm: '2024-01-01T00:00:00.000Z',
      vinculo: {
        id: 1,
        instituicaoId: 1,
        numero: 'CONV-001/2023',
        numeroProcessoSei: '6018.2023/0000001-1',
        tipoVinculo: 'CONVÊNIO' as any,
        objeto: 'Prestação de serviços hospitalares',
        complexidade: ['MC', 'AC'] as any,
        dataDaAssinatura: '2023-01-01',
        dataInicio: '2023-01-01',
        valorTotal: 500000,
        instituicao: {
          id: 1,
          nome: 'SANTA CASA DE MISERICÓRDIA',
          cnes: '1234567',
          cnpj: '61.699.567/0001-92',
          tipoInstituicao: 'FILANTRÓPICO' as any,
        },
      },
      procedimentos: [
        {
          id: 101,
          planoOperativoId: 1,
          coProcedimento: '0301010072',
          quantidadePactuadaMensal: 1000,
          procedimento: {
            coProcedimento: '0301010072',
            noProcedimento: 'CONSULTA MEDICA EM ATENCAO ESPECIALIZADA',
            tpComplexidade: 'MC',
            tpSexo: 'I',
            qtMaximaExecucao: 99,
            qtDiasPermanencia: 0,
            qtPontos: 0,
            vlIdadeMinima: 0,
            vlIdadeMaxima: 130,
            vlSh: 0,
            vlSa: 10.0,
            vlSp: 0,
            coFinanciamento: '04',
            qtTempoPermanencia: 0,
            dtCompetencia: '202401',
          },
        },
        {
          id: 102,
          planoOperativoId: 1,
          coProcedimento: '0204030188',
          quantidadePactuadaMensal: 500,
          procedimento: {
            coProcedimento: '0204030188',
            noProcedimento: 'RADIOGRAFIA DE TORAX (PA E PERFIL)',
            tpComplexidade: 'BC',
            tpSexo: 'I',
            qtMaximaExecucao: 2,
            qtDiasPermanencia: 0,
            qtPontos: 0,
            vlIdadeMinima: 0,
            vlIdadeMaxima: 130,
            vlSh: 0,
            vlSa: 19.8,
            vlSp: 0,
            coFinanciamento: '01',
            qtTempoPermanencia: 0,
            dtCompetencia: '202401',
          },
        },
        {
          id: 103,
          planoOperativoId: 1,
          coProcedimento: '0207010064',
          quantidadePactuadaMensal: 100,
          procedimento: {
            coProcedimento: '0207010064',
            noProcedimento: 'RESSONANCIA MAGNETICA DE CRANIO',
            tpComplexidade: 'AC',
            tpSexo: 'I',
            qtMaximaExecucao: 1,
            qtDiasPermanencia: 0,
            qtPontos: 0,
            vlIdadeMinima: 0,
            vlIdadeMaxima: 130,
            vlSh: 0,
            vlSa: 268.75,
            vlSp: 0,
            coFinanciamento: '04',
            qtTempoPermanencia: 0,
            dtCompetencia: '202401',
          },
        },
      ],
    },
    {
      id: 2,
      vinculoId: 2,
      vigente: false,
      criadoEm: '2022-01-01T00:00:00.000Z',
      vinculo: {
        id: 2,
        instituicaoId: 2,
        numero: 'CONT-042/2022',
        numeroProcessoSei: '6018.2022/0000042-8',
        tipoVinculo: 'CONTRATO' as any,
        objeto: 'Exames laboratoriais',
        complexidade: ['BC'] as any,
        dataDaAssinatura: '2022-01-01',
        dataInicio: '2022-01-01',
        valorTotal: 100000,
        instituicao: {
          id: 2,
          nome: 'LABORATÓRIO CENTRAL',
          cnes: '7654321',
          cnpj: '60.453.016/0001-74',
          tipoInstituicao: 'EMPRESA' as any,
        },
      },
      procedimentos: [],
    },
  ];

  beforeEach(async () => {
    planoOperativoServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockPlanos)),
    };

    competenceServiceMock = {
      competenciaFormatada: vi.fn().mockReturnValue('08/2026'),
      setCompetence: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PlanosListComponent],
      providers: [
        { provide: PlanoOperativoService, useValue: planoOperativoServiceMock },
        { provide: CompetenceService, useValue: competenceServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the standalone component', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title and formatted competence badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Planos Operativos (Pactuações)');
    expect(compiled.textContent).toContain('08/2026');
  });

  it('should load planos into signal and generate planoOptions computed signal', () => {
    expect(planoOperativoServiceMock.findAll).toHaveBeenCalled();
    expect(component.planos().length).toBe(2);

    const options = component.planoOptions();
    expect(options.length).toBe(2);
    expect(options[0].value).toBe(1);
    expect(options[0].label).toContain('SANTA CASA DE MISERICÓRDIA');
    expect(options[0].label).toContain('✓');
    expect(options[1].value).toBe(2);
    expect(options[1].label).toContain('(Inativo)');
  });

  it('should select plano 1 by default and format procedimentos', () => {
    expect(component.selectedPlanoId()).toBe(1);

    const plano = component.planoSelecionado();
    expect(plano).toBeDefined();
    expect(plano?.id).toBe(1);

    const procedimentos = component.procedimentosFormatados();
    expect(procedimentos.length).toBe(3);
    expect(procedimentos[0].coProcedimentoFormatado).toBe('03.01.01.007-2');
    expect(procedimentos[1].coProcedimentoFormatado).toBe('02.04.03.018-8');
    expect(procedimentos[2].coProcedimentoFormatado).toBe('02.07.01.006-4');
  });

  it('should calculate metrics in resumo computed signal accurately', () => {
    const resumo = component.resumo();
    expect(resumo.planoOperativoId).toBe(1);
    expect(resumo.totalProcedimentos).toBe(3);
    // 1000 (MC) + 500 (BC) + 100 (AC) = 1600
    expect(resumo.metaFisicaTotal).toBe(1600);
    expect(resumo.distribuicaoComplexidade).toEqual({
      bc: 500,
      mc: 1000,
      ac: 100,
    });
  });

  it('should update selected plano, procedimentos and metrics when onPlanoSelect is called', () => {
    component.onPlanoSelect(2);
    fixture.detectChanges();

    expect(component.selectedPlanoId()).toBe(2);
    expect(component.planoSelecionado()?.id).toBe(2);
    expect(component.procedimentosFormatados().length).toBe(0);

    const resumo = component.resumo();
    expect(resumo.planoOperativoId).toBe(2);
    expect(resumo.totalProcedimentos).toBe(0);
    expect(resumo.metaFisicaTotal).toBe(0);
    expect(resumo.distribuicaoComplexidade).toEqual({
      bc: 0,
      mc: 0,
      ac: 0,
    });
  });

  it('should format SIGTAP code correctly via formatSigtapCode', () => {
    expect(component.formatSigtapCode('0301010072')).toBe('03.01.01.007-2');
    expect(component.formatSigtapCode('0204030188')).toBe('02.04.03.018-8');
    expect(component.formatSigtapCode('')).toBe('-');
    expect(component.formatSigtapCode(undefined)).toBe('-');
    expect(component.formatSigtapCode('123')).toBe('123');
  });

  it('should return proper complexity labels via getComplexidadeLabel', () => {
    expect(component.getComplexidadeLabel('BC')).toBe('Baixa (BC)');
    expect(component.getComplexidadeLabel('bc')).toBe('Baixa (BC)');
    expect(component.getComplexidadeLabel('MC')).toBe('Média (MC)');
    expect(component.getComplexidadeLabel('AC')).toBe('Alta (AC)');
    expect(component.getComplexidadeLabel('OUTRO')).toBe('OUTRO');
    expect(component.getComplexidadeLabel(undefined)).toBe('Não Definido');
  });

  it('should return proper complexity severity tags via getComplexidadeSeverity', () => {
    expect(component.getComplexidadeSeverity('BC')).toBe('info');
    expect(component.getComplexidadeSeverity('bc')).toBe('info');
    expect(component.getComplexidadeSeverity('MC')).toBe('warn');
    expect(component.getComplexidadeSeverity('AC')).toBe('danger');
    expect(component.getComplexidadeSeverity('OUTRO')).toBe('secondary');
    expect(component.getComplexidadeSeverity(undefined)).toBe('secondary');
  });

  it('should return proper financing labels via getFinanciamentoLabel', () => {
    expect(component.getFinanciamentoLabel('01')).toBe('01 - Atenção Básica (PAB)');
    expect(component.getFinanciamentoLabel('02')).toBe('02 - Assistência Farmacêutica');
    expect(component.getFinanciamentoLabel('04')).toBe('04 - Média e Alta Complexidade (MAC)');
    expect(component.getFinanciamentoLabel('05')).toBe('05 - Vigilância em Saúde');
    expect(component.getFinanciamentoLabel('06')).toBe('06 - FAEC');
    expect(component.getFinanciamentoLabel('99')).toBe('Bloco 99');
    expect(component.getFinanciamentoLabel(undefined)).toBe('Não Informado');
  });

  it('should indicate loading state false when planos are loaded', () => {
    expect(component.loading()).toBe(false);
  });

  it('should render metric card values in the DOM', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const textContent = compiled.textContent || '';
    expect(textContent).toContain('Procedimentos Pactuados');
    expect(textContent).toContain('Meta Física Mensal Total');
    expect(textContent).toContain('Complexidade (Meta Física)');
    expect(textContent).toContain('BC:');
    expect(textContent).toContain('MC:');
    expect(textContent).toContain('AC:');
  });

  it('should render table global filter input with placeholder', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('input[pInputText]') as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    expect(searchInput.placeholder).toBe('Buscar procedimento ou código...');
  });

  it('should render table rows with formatted sigtap code and quantity', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    expect(compiled.textContent).toContain('03.01.01.007-2');
    expect(compiled.textContent).toContain('CONSULTA MEDICA EM ATENCAO ESPECIALIZADA');
  });
});


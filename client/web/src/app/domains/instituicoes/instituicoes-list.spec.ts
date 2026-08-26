import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InstituicoesListComponent } from './instituicoes-list';
import { CompetenceService } from '../../core/services/competence';
import { InstituicaoService } from '../../core/services/instituicao';
import { Instituicao } from '../../core/models/instituicao.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('InstituicoesListComponent', () => {
  let component: InstituicoesListComponent;
  let fixture: ComponentFixture<InstituicoesListComponent>;
  
  let instituicaoServiceMock: any;
  let competenceServiceMock: any;

  const mockInstituicoes: Partial<Instituicao>[] = [
    { id: 1, nome: 'Inst 1', cnes: '111111', cnpj: '111', tipoInstituicao: 'FILANTRÓPICO' },
    { id: 2, nome: 'Inst 2', cnes: '222222', cnpj: '222', tipoInstituicao: 'EMPRESA' },
    { id: 3, nome: 'Inst 3', cnes: '333333', cnpj: '333', tipoInstituicao: 'EMPRESA' }
  ];

  beforeEach(async () => {
    instituicaoServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockInstituicoes as Instituicao[]))
    };
    
    competenceServiceMock = {
      competenciaFormatada: vi.fn().mockReturnValue('08/2026')
    };

    await TestBed.configureTestingModule({
      imports: [InstituicoesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InstituicaoService, useValue: instituicaoServiceMock },
        { provide: CompetenceService, useValue: competenceServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstituicoesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load instituicoes on init', () => {
    expect(instituicaoServiceMock.findAll).toHaveBeenCalled();
    expect(component.instituicoes()?.length).toBe(3);
  });

  it('should return correct severity for tipoInstituicao', () => {
    expect(component.getTipoSeverity('FILANTRÓPICO')).toBe('success');
    expect(component.getTipoSeverity('EMPRESA')).toBe('info');
    expect(component.getTipoSeverity('OUTROS')).toBe('secondary');
  });
});

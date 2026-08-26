import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VinculosListComponent } from './vinculos-list';
import { CompetenceService } from '../../core/services/competence';
import { VinculoService } from '../../core/services/vinculo';
import { Vinculo } from '../../core/models/vinculo.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('VinculosListComponent', () => {
  let component: VinculosListComponent;
  let fixture: ComponentFixture<VinculosListComponent>;
  
  let vinculoServiceMock: any;
  let competenceServiceMock: any;

  const mockVinculos: Partial<Vinculo>[] = [
    { 
      id: 1, 
      numero: '001', 
      numeroProcessoSei: '123', 
      dataInicio: new Date('2025-01-01'), 
      dataFim: new Date('2025-12-31'), 
      valorTotal: 1000 
    }
  ];

  beforeEach(async () => {
    vinculoServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockVinculos as Vinculo[]))
    };
    
    competenceServiceMock = {
      competenciaFormatada: vi.fn().mockReturnValue('08/2026')
    };

    await TestBed.configureTestingModule({
      imports: [VinculosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VinculoService, useValue: vinculoServiceMock },
        { provide: CompetenceService, useValue: competenceServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VinculosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load vinculos on init', () => {
    expect(vinculoServiceMock.findAll).toHaveBeenCalled();
    expect(component.vinculos()?.length).toBe(1);
  });

  it('should calculate vigencia status correctly', () => {
    expect(component.getVigenciaStatus(null)).toBe('Indeterminado');
    
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(component.getVigenciaStatus(past)).toBe('Expirado');
    
    const expiring = new Date();
    expiring.setDate(expiring.getDate() + 30);
    expect(component.getVigenciaStatus(expiring)).toBe('Expirando');
    
    const active = new Date();
    active.setDate(active.getDate() + 90);
    expect(component.getVigenciaStatus(active)).toBe('Ativo');
  });

  it('should calculate vigencia severity correctly', () => {
    expect(component.getVigenciaSeverity(null)).toBe('info');
    
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(component.getVigenciaSeverity(past)).toBe('danger');
    
    const expiring = new Date();
    expiring.setDate(expiring.getDate() + 30);
    expect(component.getVigenciaSeverity(expiring)).toBe('warn');
    
    const active = new Date();
    active.setDate(active.getDate() + 90);
    expect(component.getVigenciaSeverity(active)).toBe('success');
  });
});

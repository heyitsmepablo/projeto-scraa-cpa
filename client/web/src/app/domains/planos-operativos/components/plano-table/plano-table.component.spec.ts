import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoTableComponent } from './plano-table.component';

describe('PlanoTableComponent', () => {
  let component: PlanoTableComponent;
  let fixture: ComponentFixture<PlanoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanoTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct complexity label and severity', () => {
    expect(component.getComplexidadeLabel('BC')).toBe('Baixa (BC)');
    expect(component.getComplexidadeLabel('MC')).toBe('Média (MC)');
    expect(component.getComplexidadeLabel('AC')).toBe('Alta (AC)');
    expect(component.getComplexidadeLabel(undefined)).toBe('Não Definido');

    expect(component.getComplexidadeSeverity('BC')).toBe('info');
    expect(component.getComplexidadeSeverity('MC')).toBe('warn');
    expect(component.getComplexidadeSeverity('AC')).toBe('danger');
    expect(component.getComplexidadeSeverity('OTHER')).toBe('secondary');
  });

  it('should return correct financing label', () => {
    expect(component.getFinanciamentoLabel('01')).toContain('Atenção Básica');
    expect(component.getFinanciamentoLabel('04')).toContain('Média e Alta Complexidade');
    expect(component.getFinanciamentoLabel('99')).toBe('Bloco 99');
    expect(component.getFinanciamentoLabel(undefined)).toBe('Não Informado');
  });
});

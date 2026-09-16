import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoTableComponent } from './monitoramento-table';

describe('MonitoramentoTableComponent', () => {
  let component: MonitoramentoTableComponent;
  let fixture: ComponentFixture<MonitoramentoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose getComplexidadeSeverity and getComplexidadeLabel', () => {
    expect(component.getComplexidadeSeverity('1')).toBe('info');
    expect(component.getComplexidadeSeverity('2')).toBe('warn');
    expect(component.getComplexidadeSeverity('3')).toBe('danger');
    expect(component.getComplexidadeSeverity('0')).toBe('secondary');
    expect(component.getComplexidadeSeverity(undefined)).toBe('secondary');

    expect(component.getComplexidadeLabel('1')).toBe('Atenção Básica');
    expect(component.getComplexidadeLabel('2')).toBe('Média Complexidade');
    expect(component.getComplexidadeLabel('3')).toBe('Alta Complexidade');
    expect(component.getComplexidadeLabel('0')).toBe('Não se aplica');
    expect(component.getComplexidadeLabel(undefined)).toBe('-');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoKpisComponent } from './monitoramento-kpis.component';

describe('MonitoramentoKpisComponent', () => {
  let component: MonitoramentoKpisComponent;
  let fixture: ComponentFixture<MonitoramentoKpisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoKpisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoKpisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(null)).toBe('R$ 0,00');
    expect(component.formatCurrency(5000)).toContain('5.000,00');
  });
});

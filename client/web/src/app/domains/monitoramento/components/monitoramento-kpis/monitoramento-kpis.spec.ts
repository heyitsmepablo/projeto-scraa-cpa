import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoKpisComponent } from './monitoramento-kpis';

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
});

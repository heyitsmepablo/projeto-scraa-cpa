import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoTableComponent } from './monitoramento-table.component';

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
});

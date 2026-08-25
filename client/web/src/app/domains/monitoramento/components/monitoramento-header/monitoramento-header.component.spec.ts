import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoHeaderComponent } from './monitoramento-header.component';

describe('MonitoramentoHeaderComponent', () => {
  let component: MonitoramentoHeaderComponent;
  let fixture: ComponentFixture<MonitoramentoHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

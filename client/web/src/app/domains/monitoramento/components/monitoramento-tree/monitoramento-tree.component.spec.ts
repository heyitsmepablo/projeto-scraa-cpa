import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoTreeComponent } from './monitoramento-tree.component';

describe('MonitoramentoTreeComponent', () => {
  let component: MonitoramentoTreeComponent;
  let fixture: ComponentFixture<MonitoramentoTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

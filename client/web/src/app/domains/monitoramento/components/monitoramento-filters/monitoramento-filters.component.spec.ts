import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoFiltersComponent } from './monitoramento-filters.component';

describe('MonitoramentoFiltersComponent', () => {
  let component: MonitoramentoFiltersComponent;
  let fixture: ComponentFixture<MonitoramentoFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

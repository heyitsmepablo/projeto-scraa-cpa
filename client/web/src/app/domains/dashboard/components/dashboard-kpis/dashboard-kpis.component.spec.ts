import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardKpisComponent } from './dashboard-kpis.component';

describe('DashboardKpisComponent', () => {
  let component: DashboardKpisComponent;
  let fixture: ComponentFixture<DashboardKpisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKpisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKpisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(null)).toBe('R$ 0,00');
    expect(component.formatCurrency(1250.5)).toContain('1.250,50');
  });
});

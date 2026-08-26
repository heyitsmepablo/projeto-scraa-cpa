import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardKpisComponent } from './dashboard-kpis';

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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardCtaComponent } from './dashboard-cta';

describe('DashboardCtaComponent', () => {
  let component: DashboardCtaComponent;
  let fixture: ComponentFixture<DashboardCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCtaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

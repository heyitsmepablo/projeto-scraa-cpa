import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoMetricsComponent } from './plano-metrics';

describe('PlanoMetricsComponent', () => {
  let component: PlanoMetricsComponent;
  let fixture: ComponentFixture<PlanoMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanoMetricsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanoMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoHeaderComponent } from './plano-header';

describe('PlanoHeaderComponent', () => {
  let component: PlanoHeaderComponent;
  let fixture: ComponentFixture<PlanoHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanoHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanoHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

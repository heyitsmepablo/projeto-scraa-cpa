import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoTableComponent } from './plano-table';

describe('PlanoTableComponent', () => {
  let component: PlanoTableComponent;
  let fixture: ComponentFixture<PlanoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanoTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

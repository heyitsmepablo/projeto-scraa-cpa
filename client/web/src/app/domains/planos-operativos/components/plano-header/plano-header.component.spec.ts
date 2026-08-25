import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoHeaderComponent } from './plano-header.component';

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

  it('should emit planoChange event on select', () => {
    const spy = vi.fn();
    component.planoChange.subscribe(spy);

    component.onSelect(2);
    expect(spy).toHaveBeenCalledWith(2);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VinculosHeaderComponent } from './vinculos-header.component';

describe('VinculosHeaderComponent', () => {
  let component: VinculosHeaderComponent;
  let fixture: ComponentFixture<VinculosHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinculosHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VinculosHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

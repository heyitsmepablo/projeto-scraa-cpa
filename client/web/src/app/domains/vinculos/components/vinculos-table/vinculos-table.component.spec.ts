import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VinculosTableComponent } from './vinculos-table.component';

describe('VinculosTableComponent', () => {
  let component: VinculosTableComponent;
  let fixture: ComponentFixture<VinculosTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinculosTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VinculosTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

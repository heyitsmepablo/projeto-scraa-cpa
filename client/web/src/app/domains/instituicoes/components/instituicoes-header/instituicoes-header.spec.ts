import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstituicoesHeaderComponent } from './instituicoes-header';

describe('InstituicoesHeaderComponent', () => {
  let component: InstituicoesHeaderComponent;
  let fixture: ComponentFixture<InstituicoesHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstituicoesHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstituicoesHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

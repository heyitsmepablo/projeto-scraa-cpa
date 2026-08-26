import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstituicoesTableComponent } from './instituicoes-table';

describe('InstituicoesTableComponent', () => {
  let component: InstituicoesTableComponent;
  let fixture: ComponentFixture<InstituicoesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstituicoesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstituicoesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

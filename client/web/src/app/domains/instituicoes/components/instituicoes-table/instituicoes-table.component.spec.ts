import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstituicoesTableComponent } from './instituicoes-table.component';

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

  it('should return correct severity for institution types', () => {
    expect(component.getTipoSeverity('FILANTRÓPICO')).toBe('success');
    expect(component.getTipoSeverity('EMPRESA')).toBe('info');
    expect(component.getTipoSeverity('OTHER')).toBe('secondary');
  });
});

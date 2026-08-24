import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstituicoesListComponent } from './instituicoes-list.component';
import { CompetenceService } from '../../core/services/competence.service';

describe('InstituicoesListComponent', () => {
  let component: InstituicoesListComponent;
  let fixture: ComponentFixture<InstituicoesListComponent>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstituicoesListComponent],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(InstituicoesListComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the header title and formatted competence', async () => {
    competenceService.setCompetence('202404');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Instituições Prestadoras SUS');
    expect(compiled.textContent).toContain('04/2024');
  });
});

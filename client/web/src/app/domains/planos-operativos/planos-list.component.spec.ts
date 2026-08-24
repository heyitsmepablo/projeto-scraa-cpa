import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanosListComponent } from './planos-list.component';
import { CompetenceService } from '../../core/services/competence.service';

describe('PlanosListComponent', () => {
  let component: PlanosListComponent;
  let fixture: ComponentFixture<PlanosListComponent>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanosListComponent],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanosListComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display header and formatted competence', async () => {
    competenceService.setCompetence('202407');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Planos Operativos');
    expect(compiled.textContent).toContain('07/2024');
  });
});

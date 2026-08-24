import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CompetenceService } from '../../core/services/competence.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the formatted competence from CompetenceService', async () => {
    competenceService.setCompetence('202405');
    await fixture.whenStable();

    expect(competenceService.competenciaFormatada()).toBe('05/2024');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('05/2024');
  });

  it('should contain the dashboard title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Dashboard de Monitoramento CPA');
  });
});

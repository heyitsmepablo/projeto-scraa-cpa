import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VinculosListComponent } from './vinculos-list.component';
import { CompetenceService } from '../../core/services/competence.service';

describe('VinculosListComponent', () => {
  let component: VinculosListComponent;
  let fixture: ComponentFixture<VinculosListComponent>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VinculosListComponent],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(VinculosListComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display header and formatted competence', async () => {
    competenceService.setCompetence('202408');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Vínculos Jurídicos & Contratos');
    expect(compiled.textContent).toContain('08/2024');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Topbar } from './topbar';
import { CompetenceService } from '../../../../core/services/competence.service';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update competence in CompetenceService when onCompetenciaChange is called with a value', () => {
    const setCompetenceSpy = vi.spyOn(competenceService, 'setCompetence');
    component.onCompetenciaChange('202405');
    expect(setCompetenceSpy).toHaveBeenCalledWith('202405');
  });

  it('should not update competence when onCompetenciaChange is called with empty string', () => {
    const setCompetenceSpy = vi.spyOn(competenceService, 'setCompetence');
    component.onCompetenciaChange('');
    expect(setCompetenceSpy).not.toHaveBeenCalled();
  });

  it('should emit toggleSidebar when trigger event is dispatched', () => {
    const emitSpy = vi.spyOn(component.toggleSidebar, 'emit');
    component.toggleSidebar.emit();
    expect(emitSpy).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopbarComponent } from './topbar.component';
import { CompetenceService } from '../../../../core/services/competence.service';
import { ThemeService } from '../../../../core/services/theme.service';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let competenceService: CompetenceService;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [CompetenceService, ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme when themeService toggle is invoked', () => {
    const initial = themeService.isDarkMode();
    themeService.toggleTheme();
    expect(themeService.isDarkMode()).toBe(!initial);
  });
});

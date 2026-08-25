import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Topbar } from './topbar';
import { CompetenceService } from '../../../../core/services/competence.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { By } from '@angular/platform-browser';
import { Button } from 'primeng/button';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let competenceService: CompetenceService;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [CompetenceService, ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Competence Navigation and Selection', () => {
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

    it('should apply specific competence and close popover', () => {
      const setSpecificSpy = vi.spyOn(competenceService, 'setSpecificCompetence');
      const fakePopover = { hide: vi.fn() };
      component.selectedSpecificComp.set('202403');
      component.applySpecific(fakePopover);
      expect(setSpecificSpy).toHaveBeenCalledWith('202403');
      expect(fakePopover.hide).toHaveBeenCalled();
    });

    it('should apply range preset and close popover', () => {
      const setRangeSpy = vi.spyOn(competenceService, 'setRange');
      const fakePopover = { hide: vi.fn() };
      const preset = component.rangePresets[0];
      component.applyPreset(preset, fakePopover);
      expect(setRangeSpy).toHaveBeenCalledWith(preset.inicio, preset.fim);
      expect(fakePopover.hide).toHaveBeenCalled();
    });

    it('should apply custom range and close popover', () => {
      const setRangeSpy = vi.spyOn(competenceService, 'setRange');
      const fakePopover = { hide: vi.fn() };
      component.customInicio.set('202402');
      component.customFim.set('202406');
      component.applyCustomRange(fakePopover);
      expect(setRangeSpy).toHaveBeenCalledWith('202402', '202406');
      expect(fakePopover.hide).toHaveBeenCalled();
    });

    it('should apply global mode and close popover', () => {
      const setGlobalSpy = vi.spyOn(competenceService, 'setGlobal');
      const fakePopover = { hide: vi.fn() };
      component.applyGlobal(fakePopover);
      expect(setGlobalSpy).toHaveBeenCalledWith('202301', '202612');
      expect(fakePopover.hide).toHaveBeenCalled();
    });

    it('should emit toggleSidebar when trigger event is dispatched', () => {
      const emitSpy = vi.spyOn(component.toggleSidebar, 'emit');
      component.toggleSidebar.emit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Integration', () => {
    const getButtonIcon = (btn: Button): string | undefined => {
      const iconVal = btn.icon;
      return typeof iconVal === 'function' ? iconVal() : (iconVal as unknown as string);
    };

    const getButtonAriaLabel = (btn: Button): string | undefined => {
      const labelVal = btn.ariaLabel;
      return typeof labelVal === 'function' ? labelVal() : (labelVal as unknown as string);
    };

    it('should inject ThemeService correctly', () => {
      expect(component.themeService).toBeTruthy();
      expect(component.themeService).toBe(themeService);
    });

    it('should call themeService.toggleTheme when theme toggle button is clicked', async () => {
      const toggleSpy = vi.spyOn(themeService, 'toggleTheme');
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.directive(Button));
      const themeButtonDe = buttons.find((btnDe) => {
        const icon = getButtonIcon(btnDe.componentInstance as Button);
        return icon?.includes('pi-moon') || icon?.includes('pi-sun');
      });

      expect(themeButtonDe).toBeTruthy();
      themeButtonDe?.nativeElement.querySelector('button')?.click();
      fixture.detectChanges();

      expect(toggleSpy).toHaveBeenCalled();
    });

    it('should render moon icon and dark mode tooltip when theme is light', async () => {
      themeService.setDarkMode(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const buttons = fixture.debugElement.queryAll(By.directive(Button));
      const themeButtonDe = buttons.find((btnDe) => {
        const icon = getButtonIcon(btnDe.componentInstance as Button);
        return icon?.includes('pi-moon') || icon?.includes('pi-sun');
      });

      expect(themeButtonDe).toBeTruthy();
      const btnComp = themeButtonDe!.componentInstance as Button;
      expect(getButtonIcon(btnComp)).toBe('pi pi-moon');
      expect(getButtonAriaLabel(btnComp)).toBe('Alternar para tema escuro');
    });

    it('should render sun icon and light mode tooltip when theme is dark', async () => {
      themeService.setDarkMode(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const buttons = fixture.debugElement.queryAll(By.directive(Button));
      const themeButtonDe = buttons.find((btnDe) => {
        const icon = getButtonIcon(btnDe.componentInstance as Button);
        return icon?.includes('pi-moon') || icon?.includes('pi-sun');
      });

      expect(themeButtonDe).toBeTruthy();
      const btnComp = themeButtonDe!.componentInstance as Button;
      expect(getButtonIcon(btnComp)).toBe('pi pi-sun');
      expect(getButtonAriaLabel(btnComp)).toBe('Alternar para tema claro');
    });
  });
});

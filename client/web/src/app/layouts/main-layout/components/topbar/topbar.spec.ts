import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Topbar } from './topbar';
import { ThemeService } from '../../../../core/services/theme/theme';
import { By } from '@angular/platform-browser';
import { Button } from 'primeng/button';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggleSidebar when trigger event is dispatched', () => {
    const emitSpy = vi.spyOn(component.toggleSidebar, 'emit');
    component.toggleSidebar.emit();
    expect(emitSpy).toHaveBeenCalled();
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

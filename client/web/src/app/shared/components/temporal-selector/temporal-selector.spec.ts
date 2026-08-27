import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemporalSelectorComponent } from './temporal-selector';
import { CompetenceService } from '../../../core/services/competence/competence';

describe('TemporalSelectorComponent', () => {
  let component: TemporalSelectorComponent;
  let fixture: ComponentFixture<TemporalSelectorComponent>;
  let competenceService: CompetenceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemporalSelectorComponent],
      providers: [CompetenceService],
    }).compileComponents();

    fixture = TestBed.createComponent(TemporalSelectorComponent);
    component = fixture.componentInstance;
    competenceService = TestBed.inject(CompetenceService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Competence Navigation and Selection', () => {
    it('should apply specific competence and close popover', () => {
      const setSpecificSpy = vi.spyOn(competenceService, 'setSpecificCompetence');
      const fakePopover = { hide: vi.fn() };
      component.selectedSpecificDate.set(new Date(2024, 2, 1));
      component.applySpecific(fakePopover);
      expect(setSpecificSpy).toHaveBeenCalledWith('202403');
      expect(fakePopover.hide).toHaveBeenCalled();
    });

    it('should apply custom range and close popover', () => {
      const setRangeSpy = vi.spyOn(competenceService, 'setRange');
      const fakePopover = { hide: vi.fn() };
      component.rangeStartDate.set(new Date(2024, 1, 1));
      component.rangeEndDate.set(new Date(2024, 5, 1));
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

    it('should return correct severity and labels for period modes', () => {
      expect(component.getModeSeverity('SPECIFIC')).toBe('info');
      expect(component.getModeSeverity('RANGE')).toBe('warn');
      expect(component.getModeSeverity('GLOBAL')).toBe('success');
      expect(component.getModeSeverity('OTHER' as any)).toBe('secondary');

      expect(component.getModeLabel('SPECIFIC')).toBe('Mês');
      expect(component.getModeLabel('RANGE')).toBe('Recorte');
      expect(component.getModeLabel('GLOBAL')).toBe('Global');
      expect(component.getModeLabel('CUSTOM' as any)).toBe('CUSTOM');
    });

    it('should not apply specific competence if selectedSpecificDate is null', () => {
      const setSpecificSpy = vi.spyOn(competenceService, 'setSpecificCompetence');
      const fakePopover = { hide: vi.fn() };
      component.selectedSpecificDate.set(null);
      component.applySpecific(fakePopover);
      expect(setSpecificSpy).not.toHaveBeenCalled();
      expect(fakePopover.hide).not.toHaveBeenCalled();
    });

    it('should not apply custom range if rangeStartDate or rangeEndDate is null', () => {
      const setRangeSpy = vi.spyOn(competenceService, 'setRange');
      const fakePopover = { hide: vi.fn() };

      component.rangeStartDate.set(null);
      component.rangeEndDate.set(new Date(2024, 5, 1));
      component.applyCustomRange(fakePopover);
      expect(setRangeSpy).not.toHaveBeenCalled();
      expect(fakePopover.hide).not.toHaveBeenCalled();

      component.rangeStartDate.set(new Date(2024, 1, 1));
      component.rangeEndDate.set(null);
      component.applyCustomRange(fakePopover);
      expect(setRangeSpy).not.toHaveBeenCalled();
      expect(fakePopover.hide).not.toHaveBeenCalled();
    });

    it('should navigate to previous and next period via competenceService', () => {
      const prevSpy = vi.spyOn(competenceService, 'previousPeriod');
      const nextSpy = vi.spyOn(competenceService, 'nextPeriod');

      competenceService.previousPeriod();
      expect(prevSpy).toHaveBeenCalled();

      competenceService.nextPeriod();
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should sync linkedSignals when competenceService periodFilter changes', () => {
      competenceService.setRange('202404', '202408');
      fixture.detectChanges();

      expect(component.activeMode()).toBe('RANGE');
      expect(component.rangeStartDate()?.getFullYear()).toBe(2024);
      expect(component.rangeStartDate()?.getMonth()).toBe(3); // 04 -> month index 3
      expect(component.rangeEndDate()?.getFullYear()).toBe(2024);
      expect(component.rangeEndDate()?.getMonth()).toBe(7); // 08 -> month index 7
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardFiltersComponent } from './dashboard-filters';

describe('DashboardFiltersComponent', () => {
  let component: DashboardFiltersComponent;
  let fixture: ComponentFixture<DashboardFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.selectedInstituicaoCnes()).toBe('ALL');
    expect(component.selectedStatusExecucao()).toBe('ALL');
    expect(component.instituicaoOptions()).toEqual([]);
    expect(component.statusOptions()).toEqual([]);
  });

  it('should emit reset event when called', () => {
    const emitSpy = vi.spyOn(component.reset, 'emit');
    component.reset.emit();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit instituicaoChange and statusChange events when called', () => {
    const instSpy = vi.spyOn(component.instituicaoChange, 'emit');
    const statusSpy = vi.spyOn(component.statusChange, 'emit');

    component.instituicaoChange.emit('1234567');
    expect(instSpy).toHaveBeenCalledWith('1234567');

    component.statusChange.emit('ACIMA');
    expect(statusSpy).toHaveBeenCalledWith('ACIMA');
  });
});

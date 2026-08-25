import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 navigation items', () => {
    expect(component.navItems.length).toBe(5);
    expect(component.navItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'Monitoramento',
      'Instituições',
      'Vínculos e Contratos',
      'Planos Operativos',
    ]);
  });

  it('should not emit closeSidebar onNavigate when isMobile is false', () => {
    const emitSpy = vi.spyOn(component.closeSidebar, 'emit');
    fixture.componentRef.setInput('isMobile', false);
    component.onNavigate();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit closeSidebar onNavigate when isMobile is true', () => {
    const emitSpy = vi.spyOn(component.closeSidebar, 'emit');
    fixture.componentRef.setInput('isMobile', true);
    component.onNavigate();
    expect(emitSpy).toHaveBeenCalled();
  });
});

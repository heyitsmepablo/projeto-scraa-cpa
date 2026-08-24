import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar state', () => {
    const initialState = component.isSidebarOpen();
    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(!initialState);
    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(initialState);
  });

  it('should close sidebar when closeSidebar is called on mobile', () => {
    component.isMobile.set(true);
    component.isSidebarOpen.set(true);
    component.closeSidebar();
    expect(component.isSidebarOpen()).toBe(false);
  });

  it('should not close sidebar when closeSidebar is called on desktop', () => {
    component.isMobile.set(false);
    component.isSidebarOpen.set(true);
    component.closeSidebar();
    expect(component.isSidebarOpen()).toBe(true);
  });
});

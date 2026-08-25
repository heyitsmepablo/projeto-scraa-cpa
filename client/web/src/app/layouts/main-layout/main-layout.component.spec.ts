import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { CompetenceService } from '../../core/services/competence.service';
import { ThemeService } from '../../core/services/theme.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), CompetenceService, ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar', () => {
    const initial = component.isSidebarOpen();
    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(!initial);
  });
});

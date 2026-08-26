import { Component, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './components/topbar/topbar';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, TopbarComponent, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayoutComponent {
  readonly isSidebarOpen = signal<boolean>(true);
  readonly isMobile = signal<boolean>(false);

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    if (this.isMobile()) {
      this.isSidebarOpen.set(false);
    }
  }

  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 1024;
      this.isMobile.set(mobile);
      if (mobile) {
        this.isSidebarOpen.set(false);
      } else {
        this.isSidebarOpen.set(true);
      }
    }
  }
}

export { MainLayoutComponent as MainLayout };

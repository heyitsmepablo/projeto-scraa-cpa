import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Topbar } from './components/topbar/topbar';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Topbar, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
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

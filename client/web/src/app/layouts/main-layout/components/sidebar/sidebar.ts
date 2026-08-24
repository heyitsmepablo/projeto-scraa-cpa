import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly isOpen = input<boolean>(true);
  readonly isMobile = input<boolean>(false);
  readonly closeSidebar = output<void>();

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi pi-chart-bar',
    },
    {
      label: 'Instituições',
      route: '/instituicoes',
      icon: 'pi pi-building',
    },
    {
      label: 'Vínculos e Contratos',
      route: '/vinculos',
      icon: 'pi pi-file-edit',
    },
    {
      label: 'Planos Operativos',
      route: '/planos-operativos',
      icon: 'pi pi-list-check',
    },
  ];

  onNavigate(): void {
    if (this.isMobile()) {
      this.closeSidebar.emit();
    }
  }
}

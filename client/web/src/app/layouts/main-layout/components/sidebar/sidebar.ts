import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
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
      label: 'Monitoramento',
      route: '/monitoramento',
      icon: 'pi pi-chart-line',
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

export { SidebarComponent as Sidebar };

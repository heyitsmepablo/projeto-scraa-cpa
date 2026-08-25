import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./domains/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'monitoramento',
        loadComponent: () =>
          import('./domains/monitoramento/monitoramento.component').then(
            (m) => m.MonitoramentoComponent
          ),
      },
      {
        path: 'instituicoes',
        loadComponent: () =>
          import('./domains/instituicoes/instituicoes-list.component').then(
            (m) => m.InstituicoesListComponent
          ),
      },
      {
        path: 'vinculos',
        loadComponent: () =>
          import('./domains/vinculos/vinculos-list.component').then((m) => m.VinculosListComponent),
      },
      {
        path: 'planos-operativos',
        loadComponent: () =>
          import('./domains/planos-operativos/planos-list.component').then((m) => m.PlanosListComponent),
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./domains/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

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
          import('./domains/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'monitoramento',
        loadComponent: () =>
          import('./domains/monitoramento/monitoramento').then(
            (m) => m.MonitoramentoComponent
          ),
      },
      {
        path: 'instituicoes',
        loadComponent: () =>
          import('./domains/instituicoes/instituicoes-list').then(
            (m) => m.InstituicoesListComponent
          ),
      },
      {
        path: 'vinculos',
        loadComponent: () =>
          import('./domains/vinculos/vinculos-list').then((m) => m.VinculosListComponent),
      },
      {
        path: 'planos-operativos',
        loadComponent: () =>
          import('./domains/planos-operativos/planos-list').then((m) => m.PlanosListComponent),
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

import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
  },
  {
    path: 'auth',
    loadChildren: () => import('./domains/auth/auth.routes').then((m) => m.authRoutes),
  },
];

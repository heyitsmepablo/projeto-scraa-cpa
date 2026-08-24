import { Routes } from '@angular/router';
import { Login } from './login/login';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
];

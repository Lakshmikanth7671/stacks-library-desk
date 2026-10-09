import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/http';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'admin', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/admin.component').then(m => m.AdminComponent) },
  { path: '**', redirectTo: 'dashboard' },
];

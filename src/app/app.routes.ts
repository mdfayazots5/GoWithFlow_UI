// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/user/user.routes').then(m => m.USER_ROUTES)
  },
  {
    path: 'session',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/session/session.routes').then(m => m.SESSION_ROUTES)
  },
  {
    path: 'repractice',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/repractice/repractice.routes').then(m => m.REPRACTICE_ROUTES)
  },
  {
    path: 'live-session',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/live-session/live-session.routes').then(m => m.LIVE_SESSION_ROUTES)
  },
  {
    path: 'scripts',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/scripts/scripts.routes').then(m => m.SCRIPTS_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

const autoLoginGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    const role = auth.getRole();
    return router.createUrlTree([role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard']);
  }
  return router.createUrlTree(['/auth/login']);
};

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
    pathMatch: 'full',
    canActivate: [autoLoginGuard],
    children: []
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

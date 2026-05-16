import { Routes } from '@angular/router';

export const SESSION_ROUTES: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create/create-session.component').then(m => m.CreateSessionComponent)
  },
  {
    path: 'join',
    loadComponent: () => import('./join/join-session.component').then(m => m.JoinSessionComponent)
  },
  {
    path: 'lobby/:sessionId',
    loadComponent: () => import('./lobby/lobby.component').then(m => m.LobbyComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./session-list/session-list.component').then(m => m.SessionListComponent)
  },
  {
    path: ':sessionId/detail',
    loadComponent: () => import('./session-detail/session-detail.component').then(m => m.SessionDetailComponent)
  },
  {
    path: 'report/:sessionId',
    loadComponent: () => import('./session-report/session-report.component').then(m => m.SessionReportComponent)
  },
  {
    path: '',
    redirectTo: 'join',
    pathMatch: 'full'
  }
];

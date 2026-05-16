import { Routes } from '@angular/router';

export const LIVE_SESSION_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./session-room/session-room.component').then(m => m.SessionRoomComponent)
  }
];

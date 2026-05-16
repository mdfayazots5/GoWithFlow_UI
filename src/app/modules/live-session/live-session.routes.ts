import { Routes } from '@angular/router';

export const LIVE_SESSION_ROUTES: Routes = [
  {
    path: 'room/:sessionId',
    loadComponent: () => import('./session-room/session-room.component').then(m => m.SessionRoomComponent)
  }
];

import { Routes } from '@angular/router';
import { sessionGuard } from '@core/guards/session.guard';

export const LIVE_SESSION_ROUTES: Routes = [
  {
    path: 'room/:sessionId',
    canActivate: [sessionGuard],
    loadComponent: () => import('./session-room/session-room.component').then(m => m.SessionRoomComponent)
  }
];

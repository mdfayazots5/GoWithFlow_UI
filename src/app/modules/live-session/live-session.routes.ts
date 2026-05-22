import { Routes } from '@angular/router';
import { sessionGuard } from '@core/guards/session.guard';
import { SessionRoomComponent } from './session-room/session-room.component';

export const LIVE_SESSION_ROUTES: Routes = [
  {
    path: 'room/:sessionId',
    canActivate: [sessionGuard],
    component: SessionRoomComponent
  }
];

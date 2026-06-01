// File: src/app/modules/repractice/repractice.routes.ts
import { Routes } from '@angular/router';

export const REPRACTICE_ROUTES: Routes = [
  {
    path: ':repracticeSessionId',
    loadComponent: () => import('./correction-round/correction-round.component').then(m => m.CorrectionRoundComponent)
  }
];

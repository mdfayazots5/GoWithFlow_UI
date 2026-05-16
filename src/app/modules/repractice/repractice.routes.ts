import { Routes } from '@angular/router';

export const REPRACTICE_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./correction-round.component').then(m => m.CorrectionRoundComponent)
  }
];

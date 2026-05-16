import { Routes } from '@angular/router';

export const SCRIPTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./script-library.component').then(m => m.ScriptLibraryComponent)
  }
];

// File: src/app/modules/scripts/scripts.routes.ts
import { Routes } from '@angular/router';

export const SCRIPTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./script-library/script-library.component').then(m => m.ScriptLibraryComponent)
  },
  {
    path: 'upload',
    data: { title: 'Upload Script' },
    loadComponent: () => import('./script-upload/script-upload.component').then(m => m.ScriptUploadComponent)
  }
];

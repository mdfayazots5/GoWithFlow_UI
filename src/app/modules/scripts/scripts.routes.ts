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
  },
  {
    path: 'prepare/:scriptId',
    loadComponent: () => import('./script-prepare/script-prepare.component').then(m => m.ScriptPrepareComponent)
  },
  {
    path: 'listen',
    data: { title: 'Listen Script' },
    loadComponent: () => import('./listen-script/listen-picker.component').then(m => m.ListenPickerComponent)
  },
  {
    path: 'listen/:scriptId',
    data: { title: 'Listen Script' },
    loadComponent: () => import('./listen-script/listen-script.component').then(m => m.ListenScriptComponent)
  }
];

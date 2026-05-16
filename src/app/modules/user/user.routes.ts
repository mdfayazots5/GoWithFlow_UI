import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
  },
  {
    path: 'progress',
    loadComponent: () => import('./improvement-tracker/improvement-tracker.component').then(m => m.ImprovementTrackerComponent)
  },
  {
    path: 'my-mistakes',
    loadComponent: () => import('./my-mistakes/my-mistakes.component').then(m => m.MyMistakesComponent)
  },
  {
    path: 'mistakes',
    redirectTo: 'my-mistakes',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/user-settings.component').then(m => m.UserSettingsComponent)
  }
];

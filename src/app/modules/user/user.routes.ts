import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
  },
  {
    path: 'improvement',
    loadComponent: () => import('./improvement-tracker/improvement-tracker.component').then(m => m.ImprovementTrackerComponent)
  },
  {
    path: 'mistakes',
    loadComponent: () => import('./my-mistakes/my-mistakes.component').then(m => m.MyMistakesComponent)
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

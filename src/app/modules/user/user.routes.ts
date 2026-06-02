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
  },
  {
    path: 'vocabulary',
    loadComponent: () => import('./vocabulary-bank/vocabulary-bank.component').then(m => m.VocabularyBankComponent)
  },
  {
    path: 'interview-performance',
    loadComponent: () => import('./interview-performance/interview-performance.component').then(m => m.InterviewPerformanceComponent)
  },
  {
    path: 'pronunciation-timeline',
    loadComponent: () => import('./pronunciation-timeline/pronunciation-timeline.component').then(m => m.PronunciationTimelineComponent)
  },
  {
    path: 'goals',
    loadComponent: () => import('./learning-goals/learning-goals.component').then(m => m.LearningGoalsComponent)
  },
  {
    path: 'invitations',
    loadComponent: () => import('./invitations/my-invitations.component').then(m => m.MyInvitationsComponent)
  }
];

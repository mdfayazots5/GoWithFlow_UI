import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent)
  },
  {
    path: 'reports/users/:id',
    loadComponent: () => import('./reports/user-detail-report.component').then(m => m.UserDetailReportComponent)
  }
];

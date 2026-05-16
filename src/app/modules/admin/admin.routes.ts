import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        data: { title: 'User Management' },
        loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'scripts',
        data: { title: 'Script Management' },
        loadComponent: () => import('./scripts/admin-scripts.component').then(m => m.AdminScriptsComponent)
      },
      {
        path: 'scripts/upload',
        data: { title: 'Upload Script' },
        loadComponent: () => import('../scripts/script-upload/script-upload.component').then(m => m.ScriptUploadComponent)
      },
      {
        path: 'reports',
        data: { title: 'System Reports' },
        loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: 'reports/user/:id',
        data: { title: 'User Performance Report' },
        loadComponent: () => import('./reports/user-detail-report.component').then(m => m.UserDetailReportComponent)
      }
    ]
  }
];

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';
import { DUMMY_SESSIONS } from '../../data/dummy/session.dummy';
import { DUMMY_USERS } from '../../data/dummy/user.dummy';
import { DUMMY_SCRIPTS } from '../../data/dummy/script.dummy';

export interface AdminDashboard {
  stats: {
    totalUsers: number;
    activeSessions: number;
    totalScripts: number;
    totalMistakes: number;
  };
  recentActivity: any[];
  weakAreas: { tag: string; count: number; percentage: number }[];
}

export interface AdminUserListItem {
  id: string;
  name: string;
  avatar: string;
  mobileNumber: string;
  ageGroup: string;
  sessions: number;
  streak: number;
  lastActive: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AdminUserDetail extends AdminUserListItem {
  email?: string;
  preferredHintLanguage: string;
  recentSessions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/admin`;

  getDashboard(): Observable<AdminDashboard> {
    if (environment.isDemo) {
      return of({
        stats: {
          totalUsers: 156,
          activeSessions: 12,
          totalScripts: 42,
          totalMistakes: 1240
        },
        recentActivity: [
          { userName: 'Ravi Kumar', sessionName: 'Office Basics', date: new Date().toISOString(), fluencyScore: 85, mistakes: 3, status: 'COMPLETED' },
          { userName: 'Arjun Kumar', sessionName: 'Interview Prep', date: new Date().toISOString(), fluencyScore: 72, mistakes: 8, status: 'ACTIVE' },
          { userName: 'Priya Kumar', sessionName: 'Kitchen Roleplay', date: new Date().toISOString(), fluencyScore: 94, mistakes: 1, status: 'COMPLETED' },
        ],
        weakAreas: [
          { tag: 'Have Been', count: 34, percentage: 85 },
          { tag: 'Must Be', count: 28, percentage: 70 },
          { tag: 'Should Be', count: 22, percentage: 55 },
          { tag: 'Was/Were', count: 18, percentage: 45 },
          { tag: 'Did/Didn\'t', count: 15, percentage: 35 },
        ]
      }).pipe(delay(500));
    }
    return this.http.get<AdminDashboard>(`${this.baseUrl}/dashboard`);
  }

  getUsers(params: any = {}): Observable<any> {
    if (environment.isDemo) {
      return of({
        items: DUMMY_USERS.slice(1).map(u => ({
          id: u.id,
          name: u.fullName,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.fullName}`,
          mobileNumber: '+91 987654321' + Math.floor(Math.random() * 9),
          ageGroup: u.ageGroup || 'Adult (18+)',
          sessions: u.totalSessionsPlayed || 0,
          streak: u.dailyStreakCount || 0,
          lastActive: '2024-03-' + (20 - Math.floor(Math.random() * 5)),
          status: 'ACTIVE' as const
        })),
        total: 156
      }).pipe(delay(500));
    }
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<any>(`${this.baseUrl}/users`, { params: httpParams });
  }

  getUserDetail(userId: string): Observable<AdminUserDetail> {
    if (environment.isDemo) {
      const user = DUMMY_USERS.find(u => u.id === userId) || DUMMY_USERS[1];
      return of({
        id: user.id,
        name: user.fullName,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`,
        mobileNumber: '+91 9876543210',
        ageGroup: user.ageGroup || 'Adult (18+)',
        sessions: user.totalSessionsPlayed || 23,
        streak: user.dailyStreakCount || 7,
        lastActive: '2024-03-20',
        status: 'ACTIVE' as const,
        preferredHintLanguage: 'Telugu',
        recentSessions: [
          { id: 'S01', title: 'Office Basics', date: '2024-03-20', score: 85 },
          { id: 'S02', title: 'Daily Grammar', date: '2024-03-18', score: 91 }
        ]
      } as AdminUserDetail).pipe(delay(400));
    }
    return this.http.get<AdminUserDetail>(`${this.baseUrl}/users/${userId}`);
  }

  updateUserStatus(payload: { userId: string, status: string }): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.patch<boolean>(`${this.baseUrl}/users/status`, payload);
  }

  addAdminNote(payload: { userId: string, note: string }): Observable<any> {
    if (environment.isDemo) return of({ id: 'N1', ...payload, date: new Date().toISOString() }).pipe(delay(300));
    return this.http.post<any>(`${this.baseUrl}/users/notes`, payload);
  }

  getReports(params: any = {}): Observable<any> {
    if (environment.isDemo) {
      return of({
        items: [
          { userId: 'U001', name: 'Ravi Kumar', sessions: 23, avgScore: 85, commonMistakes: 'Have Been, Was/Were', improvement: 12, lastSession: '2024-03-20' },
          { userId: 'U002', name: 'Priya Kumar', sessions: 18, avgScore: 92, commonMistakes: 'Can Be', improvement: 8, lastSession: '2024-03-19' },
          { userId: 'U003', name: 'Arjun Kumar', sessions: 30, avgScore: 78, commonMistakes: 'Should Be, Must Be', improvement: 15, lastSession: '2024-03-18' },
        ],
        total: 3
      }).pipe(delay(500));
    }
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<any>(`${this.baseUrl}/reports`, { params: httpParams });
  }

  getUserFullReport(userId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        user: { name: 'Ravi Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi', streak: 7, sessions: 23, avgScore: 85 },
        sessionHistory: [
          { date: '2024-03-20', script: 'Office Basics', duration: '12:30', fluency: 88, mistakes: 2 },
          { date: '2024-03-18', script: 'Daily Grammar', duration: '10:15', fluency: 82, mistakes: 5 }
        ],
        mistakeBreakdown: [
          { label: 'Grammar', count: 12, percentage: 60 },
          { label: 'Pronunciation', count: 5, percentage: 25 },
          { label: 'Hesitation', count: 3, percentage: 15 }
        ],
        improvementTrend: [
          { week: 'Week 1', fluency: 75 },
          { week: 'Week 2', fluency: 78 },
          { week: 'Week 3', fluency: 82 },
          { week: 'Week 4', fluency: 85 }
        ],
        notes: "Consistent improvement in 'Have been' usage."
      }).pipe(delay(600));
    }
    return this.http.get<any>(`${this.baseUrl}/reports/users/${userId}`);
  }

  exportReports(params: any = {}): Observable<Blob> {
    if (environment.isDemo) {
      // Return a fake blob
      return of(new Blob(['demo data'], { type: 'text/csv' })).pipe(delay(1000));
    }
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.baseUrl}/reports/export`, { params: httpParams, responseType: 'blob' });
  }
}

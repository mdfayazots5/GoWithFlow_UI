import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface DashboardSummary {
  totalUsers: number;
  activeSessions: number;
  topMistakes: { type: string; count: number }[];
  recentActivity: any[];
}

export interface UserDetail {
  id: string;
  name: string;
  mobileNumber: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  streak: number;
  sessions: number;
  totalMistakes: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    if (environment.isDemo) {
      return of({
        totalUsers: 156,
        activeSessions: 12,
        topMistakes: [
          { type: 'GRAMMAR', count: 45 },
          { type: 'PRONUNCIATION', count: 32 },
          { type: 'HESITATION', count: 18 }
        ],
        recentActivity: [
          { id: '1', user: 'Ravi Kumar', action: 'Finished session "Office Basics"', time: '2m ago' },
          { id: '2', user: 'Sneha Kumar', action: 'Earned 12-day streak', time: '15m ago' }
        ]
      }).pipe(delay(500));
    }
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard`);
  }

  getUsers(filters: any): Observable<any> {
    if (environment.isDemo) {
      return of({
        items: [
          { id: 'U001', name: 'Ravi Kumar', mobileNumber: '+91 9876543210', role: 'USER', status: 'ACTIVE', sessions: 23 },
          { id: 'U002', name: 'Priya Kumar', mobileNumber: '+91 9876543211', role: 'USER', status: 'ACTIVE', sessions: 18 },
          { id: 'U003', name: 'Arjun Kumar', mobileNumber: '+91 9876543212', role: 'USER', status: 'INACTIVE', sessions: 30 }
        ],
        total: 156
      }).pipe(delay(500));
    }
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get(`${this.baseUrl}/users`, { params });
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(300));
    return this.http.patch(`${this.baseUrl}/users/status`, { userId, status });
  }

  getUserDetail(userId: string): Observable<UserDetail> {
    if (environment.isDemo) {
      return of({
        id: userId,
        name: 'Ravi Kumar',
        mobileNumber: '+91 9876543210',
        role: 'USER',
        status: 'ACTIVE',
        streak: 7,
        sessions: 23,
        totalMistakes: 12
      } as UserDetail).pipe(delay(400));
    }
    return this.http.get<UserDetail>(`${this.baseUrl}/users/${userId}`);
  }

  getReportSummary(filters: any): Observable<any> {
    if (environment.isDemo) {
      return of([
        { userId: 'U001', name: 'Ravi Kumar', avgScore: 85, sessions: 23, mistakes: 12 },
        { userId: 'U002', name: 'Priya Kumar', avgScore: 92, sessions: 18, mistakes: 5 }
      ]).pipe(delay(500));
    }
    return this.http.get(`${this.baseUrl}/reports`);
  }

  getUserFullReport(userId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        userId,
        sessions: [
          { id: 'S01', date: '2024-03-20', title: 'Office Prep', score: 88 },
          { id: 'S02', date: '2024-03-18', title: 'Daily Grammar', score: 91 }
        ],
        mistakeTrends: [8, 5, 12, 4, 3],
        notes: "Consistent improvement in 'Have been' usage."
      }).pipe(delay(600));
    }
    return this.http.get(`${this.baseUrl}/reports/users/${userId}`);
  }

  saveUserNote(userId: string, note: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(300));
    return this.http.post(`${this.baseUrl}/users/notes`, { userId, note });
  }

  exportReports(): Observable<any> {
    if (environment.isDemo) return of({ url: '#' }).pipe(delay(1000));
    return this.http.get(`${this.baseUrl}/reports/export`);
  }
}

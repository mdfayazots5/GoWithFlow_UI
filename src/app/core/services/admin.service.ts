import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

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
    return this.http.get<any>(`${this.baseUrl}/dashboard`).pipe(
      map(res => ({
        stats: {
          totalUsers: res.data.totalUsers,
          activeSessions: res.data.activeSessions,
          totalScripts: res.data.totalScripts,
          totalMistakes: res.data.totalMistakes
        },
        recentActivity: res.data.recentActivities,
        weakAreas: res.data.topGrammarMistakes
      } as AdminDashboard))
    );
  }

  getUsers(params: any = {}): Observable<any> {
    const httpParams = new HttpParams({
      fromObject: {
        searchTerm: params.search || params.searchTerm || '',
        ageGroup: params.ageGroup || '',
        isActive: params.activeOnly !== undefined ? String(params.activeOnly) : '',
        pageNumber: String((params.page ?? 0) + 1),
        pageSize: String(params.size || params.pageSize || 10)
      }
    });
    return this.http.get<any>(`${this.baseUrl}/users`, { params: httpParams }).pipe(
      map(res => res.data)
    );
  }

  getUserDetail(userId: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.baseUrl}/users/${userId}`);
  }

  updateUserStatus(payload: { userId: number, isActive: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/users/status`, payload);
  }

  addAdminNote(payload: { targetUserId: number, noteText: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/notes`, payload);
  }

  getAdminNotes(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}/notes`).pipe(map(res => res.data));
  }

  getReports(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<any>(`${this.baseUrl}/reports`, { params: httpParams });
  }

  getUserFullReport(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/users/${userId}`);
  }

  exportReports(params: any = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.baseUrl}/reports/export`, { params: httpParams, responseType: 'blob' });
  }
}

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
          totalUsers:     res.data.totalUsers             ?? 0,
          activeSessions: res.data.activeSessionsToday    ?? 0,
          totalScripts:   res.data.totalScriptsUploaded   ?? 0,
          totalMistakes:  res.data.totalMistakesRecorded  ?? 0,
        },
        recentActivity: (res.data.recentActivities ?? []).map((a: any) => ({
          userName:     a.userFullName,
          sessionName:  a.sessionName,
          sessionDate:  a.sessionDate,
          fluencyScore: a.fluencyScore,
          mistakeCount: a.mistakeCount,
          status:       a.sessionStatus,
        })),
        weakAreas: (res.data.topGrammarMistakes ?? []),
      } as AdminDashboard))
    );
  }

  getUsers(params: any = {}): Observable<any> {
    const httpParams = new HttpParams({
      fromObject: {
        searchTerm: params.search || params.searchTerm || '',
        ageGroup: params.ageGroup || '',
        isActive: params.activeOnly === true ? 'true' : '',
        pageNumber: String((params.page ?? 0) + 1),
        pageSize: String(params.size || params.pageSize || 10)
      }
    });
    return this.http.get<any>(`${this.baseUrl}/users`, { params: httpParams }).pipe(
      map(res => ({
        total: res.data.totalCount,
        totalCount: res.data.totalCount,
        items: (res.data.items || []).map((u: any) => ({
          id:           String(u.userId),
          name:         u.fullName,
          avatar:       u.avatarUrl || '',
          mobileNumber: u.mobileNumber,
          ageGroup:     u.ageGroup,
          sessions:     u.totalSessionsPlayed ?? 0,
          streak:       u.dailyStreakCount ?? 0,
          lastActive:   u.lastLoginDate || null,
          status:       u.isActive ? 'ACTIVE' : 'INACTIVE',
        } as AdminUserListItem))
      }))
    );
  }

  getUserDetail(userId: string): Observable<AdminUserDetail> {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}`).pipe(
      map(res => {
        const d = res.data;
        return {
          id:                   String(d.userId),
          name:                 d.fullName,
          avatar:               d.avatarUrl || '',
          mobileNumber:         d.mobileNumber,
          ageGroup:             d.ageGroup,
          sessions:             d.totalSessionsPlayed ?? 0,
          streak:               d.dailyStreakCount ?? 0,
          lastActive:           d.lastLoginDate || null,
          status:               d.isActive ? 'ACTIVE' : 'INACTIVE',
          email:                d.email,
          preferredHintLanguage: d.preferredHintLanguage,
          recentSessions:       (d.recentSessions || []).map((s: any) => ({
            id:    s.sessionId ?? s.id,
            title: s.scriptTitle ?? s.title,
            date:  s.sessionDate ?? s.date,
            score: s.fluencyScore ?? s.score,
          })),
        } as AdminUserDetail;
      })
    );
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
      if (params[key] !== undefined && params[key] !== null && params[key] !== '')
        httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<any>(`${this.baseUrl}/reports`, { params: httpParams }).pipe(
      map(res => ({
        totalCount: res.data?.totalCount ?? 0,
        items: (res.data?.items ?? []).map((r: any) => ({
          userId:               r.userId,
          fullName:             r.fullName,
          totalSessions:        r.totalSessions ?? 0,
          avgFluencyScore:      r.avgFluencyScore ?? 0,
          mostCommonMistakeType: r.mostCommonMistakeType || '—',
          improvementPercent:   r.improvementPercent ?? 0,
          lastSessionDate:      r.lastSessionDate || null,
        }))
      }))
    );
  }

  getUserFullReport(userId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/users/${userId}`).pipe(
      map(res => res.data)
    );
  }

  createUser(payload: {
    fullName: string;
    mobileNumber: string;
    email?: string;
    ageGroup: string;
    preferredHintLanguage: string;
    password?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, payload);
  }

  updateUser(userId: string, payload: {
    fullName: string;
    mobileNumber: string;
    email?: string;
    ageGroup: string;
    preferredHintLanguage: string;
    password?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}`, payload);
  }

  getSessionHistory(params: {
    searchTerm?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Observable<{ totalCount: number; items: any[] }> {
    let httpParams = new HttpParams();
    if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params.status)     httpParams = httpParams.set('status',     params.status);
    if (params.fromDate)   httpParams = httpParams.set('fromDate',   params.fromDate);
    if (params.toDate)     httpParams = httpParams.set('toDate',     params.toDate);
    httpParams = httpParams.set('pageNumber', String(params.pageNumber ?? 1));
    httpParams = httpParams.set('pageSize',   String(params.pageSize   ?? 20));

    return this.http.get<any>(`${this.baseUrl}/sessions/history`, { params: httpParams }).pipe(
      map(res => ({
        totalCount: res.data?.totalCount ?? 0,
        items: (res.data?.items ?? []).map((s: any) => ({
          sessionId:    s.sessionId,
          sessionName:  s.sessionName,
          joinCode:     s.joinCode,
          hostName:     s.hostName,
          memberCount:  s.memberCount,
          status:       s.status,
          sessionDate:  s.sessionDate,
          durationMin:  s.durationMin,
          avgFluency:   s.avgFluency,
          mistakeCount: s.mistakeCount,
        }))
      }))
    );
  }

  exportReports(params: any = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.baseUrl}/reports/export`, { params: httpParams, responseType: 'blob' });
  }
}

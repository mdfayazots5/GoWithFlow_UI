import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';
import { UserProfile, ImprovementData, StreakData, UserBadge } from '@core/models/user.model';
import { SessionDetail } from '@core/models/session.model';
import { DUMMY_USER_PROFILE, DUMMY_IMPROVEMENT_DATA, DUMMY_STREAK_DATA, DUMMY_BADGES } from '@data/dummy/user.dummy';
import { DUMMY_SESSION_DETAIL } from '@data/dummy/session.dummy';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;
  private baseUrl = `${environment.apiBaseUrl}/users`;

  getProfile(): Observable<UserProfile> {
    if (environment.isDemo) {
      return of(DUMMY_USER_PROFILE as UserProfile).pipe(delay(500));
    }
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    if (environment.isDemo) {
      return of({ ...DUMMY_USER_PROFILE, ...payload } as UserProfile).pipe(delay(800));
    }
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, payload);
  }

  uploadAvatar(file: File): Observable<{avatarUrl: string}> {
    if (environment.isDemo) {
      return of({ avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=updated' }).pipe(delay(1000));
    }
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{avatarUrl: string}>(`${this.baseUrl}/profile/avatar`, formData);
  }

  getSessionDetail(sessionId: string): Observable<SessionDetail> {
    if (environment.isDemo) {
      return of(DUMMY_SESSION_DETAIL as SessionDetail).pipe(delay(600));
    }
    return this.http.get<SessionDetail>(`${this.baseUrl}/sessions/${sessionId}/detail`);
  }

  getImprovementData(): Observable<ImprovementData> {
    if (environment.isDemo) {
      return of(DUMMY_IMPROVEMENT_DATA as ImprovementData).pipe(delay(700));
    }
    return this.http.get<ImprovementData>(`${this.baseUrl}/progress`);
  }

  getStreakData(): Observable<StreakData> {
    if (environment.isDemo) {
      return of(DUMMY_STREAK_DATA as StreakData).pipe(delay(400));
    }
    return this.http.get<StreakData>(`${this.baseUrl}/streak`);
  }

  getBadges(): Observable<UserBadge[]> {
    if (environment.isDemo) {
      return of(DUMMY_BADGES as UserBadge[]).pipe(delay(500));
    }
    return this.http.get<UserBadge[]>(`${this.baseUrl}/badges`);
  }

  getDashboard(): Observable<any> {
    if (environment.isDemo) {
      return of({
        activeSession: { id: 'S001', title: 'Ongoing Room', joinCode: '482931' },
        pendingRepracticeCount: 12,
        pendingMistakesCount: 5,
        recentSessions: [
          { id: 'S002', title: 'Office Talk', date: '2024-03-14', score: 92 },
          { id: 'S003', title: 'Kitchen Help', date: '2024-03-13', score: 85 }
        ]
      }).pipe(delay(700));
    }
    return this.http.get(`${environment.apiBaseUrl}/dashboard`);
  }
}

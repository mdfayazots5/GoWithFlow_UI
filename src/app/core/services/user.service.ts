import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
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
    return this.http.get<{ data: UserProfile }>(`${this.baseUrl}/profile`).pipe(map(r => r.data));
  }

  updateProfile(payload: { fullName: string; email?: string; ageGroup: string; preferredHintLanguage: string; avatarUrl?: string }): Observable<UserProfile> {
    if (environment.isDemo) {
      return of({ ...DUMMY_USER_PROFILE, ...payload } as UserProfile).pipe(delay(800));
    }
    return this.http.put<{ data: UserProfile }>(`${this.baseUrl}/profile`, payload).pipe(map(r => r.data));
  }

  uploadAvatar(file: File): Observable<{avatarUrl: string}> {
    if (environment.isDemo) {
      return of({ avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=updated' }).pipe(delay(1000));
    }
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ data: { avatarUrl: string } }>(`${this.baseUrl}/profile/avatar`, formData).pipe(map(r => r.data));
  }

  getSessionDetail(sessionId: string): Observable<SessionDetail> {
    if (environment.isDemo) {
      return of(DUMMY_SESSION_DETAIL as SessionDetail).pipe(delay(600));
    }
    return this.http.get<{ data: SessionDetail }>(`${this.baseUrl}/sessions/${sessionId}/detail`).pipe(map(r => r.data));
  }

  getImprovementData(): Observable<ImprovementData> {
    if (environment.isDemo) {
      return of(DUMMY_IMPROVEMENT_DATA as ImprovementData).pipe(delay(700));
    }
    return this.http.get<{ data: ImprovementData }>(`${this.baseUrl}/progress`).pipe(map(r => r.data));
  }

  getStreakData(): Observable<StreakData> {
    if (environment.isDemo) {
      return of(DUMMY_STREAK_DATA as StreakData).pipe(delay(400));
    }
    return this.http.get<{ data: StreakData }>(`${this.baseUrl}/streak`).pipe(map(r => r.data));
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
        userName: 'Ravi Kumar',
        currentStreak: 7,
        todayDate: new Date().toISOString(),
        activeSession: { sessionId: 'S001', sessionName: 'Ongoing Room', status: 'ACTIVE', joinCode: '482931' },
        pendingRepracticeCount: 12,
        recentSessions: [
          { sessionId: 'S002', sessionName: 'Office Talk', createdDate: '2024-03-14', myScore: 92 },
          { sessionId: 'S003', sessionName: 'Kitchen Help', createdDate: '2024-03-13', myScore: 85 }
        ],
        pendingMistakes: [
          { text: 'I have been to there yesterday', type: 'GRAMMAR' },
          { text: 'He did not went to school', type: 'GRAMMAR' },
          { text: 'Un-clear pronun-ciation', type: 'PRONUNCIATION' }
        ]
      }).pipe(delay(700));
    }
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard`).pipe(map(r => r.data));
  }
}

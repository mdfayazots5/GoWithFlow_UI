import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { UserProfile, ImprovementData, StreakData, UserBadge } from '@core/models/user.model';
import { SessionDetail } from '@core/models/session.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/users`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<{ data: UserProfile }>(`${this.baseUrl}/profile`).pipe(map(r => r.data));
  }

  updateProfile(payload: { fullName: string; email?: string; ageGroup: string; preferredHintLanguage: string; avatarUrl?: string }): Observable<UserProfile> {
    return this.http.put<{ data: UserProfile }>(`${this.baseUrl}/profile`, payload).pipe(map(r => r.data));
  }

  uploadAvatar(file: File): Observable<{avatarUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ data: { avatarUrl: string } }>(`${this.baseUrl}/profile/avatar`, formData).pipe(map(r => r.data));
  }

  getSessionDetail(sessionId: string): Observable<SessionDetail> {
    return this.http.get<{ data: SessionDetail }>(`${this.baseUrl}/sessions/${sessionId}/detail`).pipe(map(r => r.data));
  }

  getImprovementData(): Observable<ImprovementData> {
    return this.http.get<{ data: ImprovementData }>(`${this.baseUrl}/progress`).pipe(map(r => r.data));
  }

  getStreakData(): Observable<StreakData> {
    return this.http.get<{ data: StreakData }>(`${this.baseUrl}/streak`).pipe(map(r => r.data));
  }

  getBadges(): Observable<UserBadge[]> {
    return this.http.get<UserBadge[]>(`${this.baseUrl}/badges`);
  }

  getDashboard(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard`).pipe(map(r => r.data));
  }
}

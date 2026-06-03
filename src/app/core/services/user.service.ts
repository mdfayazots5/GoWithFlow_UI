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
    return this.http.get<{ data: any }>(`${this.baseUrl}/sessions/${sessionId}/detail`).pipe(
      map(r => {
        const d = r.data;
        const h = d?.sessionHeader ?? {};
        return {
          sessionName:     h.sessionName  ?? '',
          sessionMode:     h.sessionMode  ?? '',
          scriptTitle:     h.scriptTitle  ?? '',
          sessionDuration: h.duration     ?? 0,
          myPerformance: {
            fluency:    d?.myPerformance?.fluencyScore    ?? 0,
            confidence: d?.myPerformance?.confidenceScore ?? 0,
            speedWpm:   d?.myPerformance?.speakingSpeedWpm ?? 0,
            pauses:     d?.myPerformance?.pauseCount      ?? 0,
          },
          myMistakes: (d?.myMistakes ?? []).map((m: any) => ({
            type:     m.mistakeType   ?? '',
            said:     m.spokenText    ?? '',
            shouldBe: m.utteranceText ?? '',
            tag:      m.grammarTag    ?? '',
          })),
          listenerFeedbackReceived: (d?.listenerFeedbackReceived ?? []).map((f: any) => ({
            tag:   f.tag   ?? '',
            count: f.count ?? 0,
          })),
          allMemberScores: (d?.allMemberScores ?? []).map((s: any) => ({
            name:       s.fullName       ?? '',
            fluency:    s.fluencyScore   ?? 0,
            confidence: s.confidenceScore ?? 0,
            mistakes:   s.mistakeCount   ?? 0,
          })),
        } as SessionDetail;
      })
    );
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

  getVocabularyBank(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/vocabulary/bank`).pipe(map(r => r.data));
  }

  getWeeklyReport(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard/weekly-report`).pipe(map(r => r.data));
  }

  getLearningPath(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard/learning-path`).pipe(map(r => r.data));
  }

  getInterviewPerformanceDashboard(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard/interview-performance`).pipe(map(r => r.data));
  }

  getPronunciationTimeline(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/dashboard/pronunciation-timeline`).pipe(map(r => r.data));
  }

  getGoalProgress(): Observable<any> {
    return this.http.get<{ data: any }>(`${environment.apiBaseUrl}/users/goal`).pipe(map(r => r.data));
  }

  setGoal(goalType: string, timelineWeeks: number): Observable<any> {
    return this.http.post<{ data: any }>(`${environment.apiBaseUrl}/users/goal`, { goalType, timelineWeeks }).pipe(map(r => r.data));
  }
}

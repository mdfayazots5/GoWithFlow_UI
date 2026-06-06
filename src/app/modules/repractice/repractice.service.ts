import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { RepracticeSession } from '@core/models/mistake.model';
import { PagedResult } from '@core/models/script.model';

/** Authoritative server-side result of recording a repractice attempt. */
export interface AttemptResult {
  repracticeUtteranceId: number;
  isResolved: boolean;
  attemptCount: number;
  bestScore: number;
  lastScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class RepracticeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/repractice`;

  /**
   * Generates a repractice round.
   * @param sourceSessionId  Anchor session. Ignored for mistake selection when includeAllSessions is true.
   * @param includeAllSessions  "Practice All Mistakes" — pulls every unresolved mistake across all sessions.
   */
  generateRepracticeSession(sourceSessionId: number, includeAllSessions = false): Observable<{ repracticeSessionId: number }> {
    const body = { sourceSessionId: sourceSessionId || 0, includeAllSessions };
    console.log('[Repractice] generate request', body);
    return this.http.post<{ data: { repracticeSessionId: number } }>(`${this.baseUrl}/generate`, body).pipe(
      map(r => {
        console.log('[Repractice] generate response', r.data);
        return r.data;
      })
    );
  }

  getRepracticeSession(id: string): Observable<RepracticeSession> {
    return this.http.get<{ data: any }>(`${this.baseUrl}/${id}`).pipe(
      map(r => {
        const d = r.data;
        return {
          id:                  String(d.repracticeSessionId),
          userId:              '',
          status:              d.status,
          startedDate:         d.generatedDate,
          overallImprovement:  d.improvementPercent ?? 0,
          utterances:          (d.utterances ?? []).map((u: any) => ({
            id:              String(u.repracticeUtteranceId),
            englishText:     u.englishText,
            hintText:        u.hintText ?? '',
            mistakeType:     u.mistakeType,
            mistakeDetail:   u.mistakeDetail ?? '',
            correctionNote:  u.correctionNote ?? '',
            attemptCount:    u.attemptCount,
            bestScore:       u.bestScore,
            lastScore:       u.lastScore,
            isResolved:      u.isResolved,
          })),
        } as RepracticeSession;
      })
    );
  }

  getRepracticeHistory(page = 1, size = 10): Observable<PagedResult<RepracticeSession>> {
    return this.http.get<PagedResult<RepracticeSession>>(`${this.baseUrl}/history?page=${page}&size=${size}`);
  }

  updateAttempt(payload: { repracticeUtteranceId: number; score: number }): Observable<AttemptResult> {
    return this.http.patch<{ data: AttemptResult }>(`${this.baseUrl}/attempt`, payload).pipe(map(r => r.data));
  }

  completeRepracticeSession(id: string): Observable<{ improvementPercent: number; resolvedCount: number }> {
    return this.http.post<{ data: { improvementPercent: number; resolvedCount: number } }>(`${this.baseUrl}/${id}/complete`, {}).pipe(map(r => r.data));
  }

  getImprovementPercent(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/improvement`);
  }
}

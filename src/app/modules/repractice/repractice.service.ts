// File: src/app/modules/repractice/repractice.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';
import { RepracticeSession } from '@core/models/mistake.model';
import { DUMMY_REPRACTICE } from '@data/dummy/mistake.dummy';
import { PagedResult } from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class RepracticeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/repractice`;

  generateRepracticeSession(sourceSessionId: string): Observable<RepracticeSession> {
    if (environment.isDemo) {
      return of(DUMMY_REPRACTICE).pipe(delay(1000));
    }
    return this.http.post<RepracticeSession>(`${this.baseUrl}/generate`, { sourceSessionId });
  }

  getRepracticeSession(id: string): Observable<RepracticeSession> {
    if (environment.isDemo) {
      return of(DUMMY_REPRACTICE).pipe(delay(500));
    }
    return this.http.get<RepracticeSession>(`${this.baseUrl}/${id}`);
  }

  getRepracticeHistory(page = 1, size = 10): Observable<PagedResult<RepracticeSession>> {
    if (environment.isDemo) {
      return of({
        items: [DUMMY_REPRACTICE],
        total: 1
      }).pipe(delay(600));
    }
    return this.http.get<PagedResult<RepracticeSession>>(`${this.baseUrl}/history?page=${page}&size=${size}`);
  }

  updateAttempt(payload: { sessionId: string; utteranceId: string; score: number; spokenText: string }): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.patch<boolean>(`${this.baseUrl}/attempt`, payload);
  }

  completeRepracticeSession(id: string): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(500));
    return this.http.post<boolean>(`${this.baseUrl}/${id}/complete`, {});
  }

  getImprovementPercent(): Observable<number> {
    if (environment.isDemo) return of(72).pipe(delay(400));
    return this.http.get<number>(`${this.baseUrl}/improvement`);
  }
}

// File: src/app/modules/repractice/repractice.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
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

  generateRepracticeSession(sourceSessionId: number): Observable<{ repracticeSessionId: number }> {
    if (environment.isDemo) {
      return of({ repracticeSessionId: 1 }).pipe(delay(1000));
    }
    return this.http.post<{ data: { repracticeSessionId: number } }>(`${this.baseUrl}/generate`, { sourceSessionId }).pipe(map(r => r.data));
  }

  getRepracticeSession(id: string): Observable<RepracticeSession> {
    if (environment.isDemo) {
      return of(DUMMY_REPRACTICE).pipe(delay(500));
    }
    return this.http.get<{ data: RepracticeSession }>(`${this.baseUrl}/${id}`).pipe(map(r => r.data));
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

  updateAttempt(payload: { repracticeUtteranceId: number; score: number }): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.patch<{ data: boolean }>(`${this.baseUrl}/attempt`, payload).pipe(map(r => r.data));
  }

  completeRepracticeSession(id: string): Observable<{ improvementPercent: number }> {
    if (environment.isDemo) return of({ improvementPercent: Math.floor(Math.random() * 40) + 60 }).pipe(delay(500));
    return this.http.post<{ data: { improvementPercent: number } }>(`${this.baseUrl}/${id}/complete`, {}).pipe(map(r => r.data));
  }

  getImprovementPercent(): Observable<number> {
    if (environment.isDemo) return of(72).pipe(delay(400));
    return this.http.get<number>(`${this.baseUrl}/improvement`);
  }
}

// File: src/app/modules/user/mistake.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '@env/environment';
import { Mistake, MistakeSummary, GrammarProgress } from '@core/models/mistake.model';
import { DUMMY_MISTAKES, DUMMY_MISTAKE_SUMMARY } from '@data/dummy/mistake.dummy';
import { PagedResult } from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class MistakeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mistakes`;

  getMistakes(filters?: { mistakeType?: string; isResolved?: boolean; pageNumber?: number; pageSize?: number }): Observable<PagedResult<Mistake>> {
    if (environment.isDemo) {
      let filtered = [...DUMMY_MISTAKES];
      if (filters?.mistakeType && filters.mistakeType !== 'All') {
        filtered = filtered.filter(m => m.type === filters.mistakeType!.toUpperCase());
      }
      return of({ items: filtered, total: filtered.length }).pipe(delay(600));
    }
    let params = new HttpParams()
      .set('pageNumber', String(filters?.pageNumber ?? 1))
      .set('pageSize', String(filters?.pageSize ?? 20));
    if (filters?.mistakeType && filters.mistakeType !== 'All') {
      params = params.set('mistakeType', filters.mistakeType);
    }
    if (filters?.isResolved !== undefined) {
      params = params.set('isResolved', String(filters.isResolved));
    }
    return this.http.get<PagedResult<Mistake>>(this.baseUrl, { params });
  }

  getMistakeSummary(): Observable<MistakeSummary> {
    if (environment.isDemo) {
      return of(DUMMY_MISTAKE_SUMMARY).pipe(delay(400));
    }
    return this.http.get<{ data: MistakeSummary }>(`${this.baseUrl}/summary`).pipe(map(r => r.data));
  }

  getGrammarProgress(): Observable<GrammarProgress[]> {
    if (environment.isDemo) {
      return of([
        { grammarTag: 'Have Been', totalMistakes: 12, resolvedMistakes: 9, improvementPercent: 80, progressBarValue: 80 },
        { grammarTag: 'Was/Were', totalMistakes: 5, resolvedMistakes: 4, improvementPercent: 95, progressBarValue: 95 },
        { grammarTag: "Doesn't", totalMistakes: 8, resolvedMistakes: 4, improvementPercent: 60, progressBarValue: 60 }
      ]).pipe(delay(500));
    }
    return this.http.get<{ data: GrammarProgress[] }>(`${this.baseUrl}/grammar-progress`).pipe(map(r => r.data));
  }
}

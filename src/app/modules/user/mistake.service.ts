// File: src/app/modules/user/mistake.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
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

  getMistakes(filters?: any): Observable<PagedResult<Mistake>> {
    if (environment.isDemo) {
      let filtered = [...DUMMY_MISTAKES];
      if (filters?.type && filters.type !== 'All') {
        filtered = filtered.filter(m => m.type === filters.type.toUpperCase());
      }
      return of({
        items: filtered,
        total: filtered.length
      }).pipe(delay(600));
    }
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get<PagedResult<Mistake>>(this.baseUrl, { params });
  }

  getMistakeSummary(): Observable<MistakeSummary> {
    if (environment.isDemo) {
      return of(DUMMY_MISTAKE_SUMMARY).pipe(delay(400));
    }
    return this.http.get<MistakeSummary>(`${this.baseUrl}/summary`);
  }

  getGrammarProgress(): Observable<GrammarProgress[]> {
    if (environment.isDemo) {
      return of([
        { tag: 'Have Been', errorCount: 12, improvementPercent: 80 },
        { tag: 'Was/Were', errorCount: 5, improvementPercent: 95 },
        { tag: 'Doesn\'t', errorCount: 8, improvementPercent: 60 }
      ]).pipe(delay(500));
    }
    return this.http.get<GrammarProgress[]>(`${this.baseUrl}/grammar-progress`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Mistake, MistakeSummary, GrammarProgress } from '@core/models/mistake.model';
import { PagedResult } from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class MistakeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/mistakes`;

  getMistakes(filters?: { mistakeType?: string; isResolved?: boolean; pageNumber?: number; pageSize?: number }): Observable<PagedResult<Mistake>> {
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
    return this.http.get<{ data: MistakeSummary }>(`${this.baseUrl}/summary`).pipe(map(r => r.data));
  }

  getGrammarProgress(): Observable<GrammarProgress[]> {
    return this.http.get<{ data: GrammarProgress[] }>(`${this.baseUrl}/grammar-progress`).pipe(map(r => r.data));
  }
}

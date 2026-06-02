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
    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        // Unwrap ApiResponse wrapper — backend returns { success, data: { items, totalCount } }
        const d = res?.data ?? res;
        const items: Mistake[] = (d?.items ?? []).map((r: any) => ({
          id:            String(r.mistakeId ?? r.id ?? ''),
          userId:        String(r.userId ?? ''),
          type:          r.mistakeType ?? r.type ?? 'GRAMMAR',
          spokenText:    r.spokenText ?? '',
          expectedText:  r.utteranceText ?? r.expectedText ?? '',
          sessionId:     String(r.sessionId ?? ''),
          sessionName:   r.sessionName ?? '',
          createdDate:   r.firstOccurrence ?? r.createdDate ?? '',
          occurredCount: r.occurredCount ?? 1,
          practicedCount: r.practiceCount ?? r.practicedCount ?? 0,
          isResolved:    r.isResolved ?? false,
          correctionNote: r.correctionText ?? r.correctionNote ?? undefined
        } as Mistake));
        return {
          items,
          total:      d?.totalCount ?? d?.total ?? items.length,
          totalCount: d?.totalCount ?? d?.total ?? items.length
        } as PagedResult<Mistake>;
      })
    );
  }

  getMistakeSummary(): Observable<MistakeSummary> {
    return this.http.get<{ data: MistakeSummary }>(`${this.baseUrl}/summary`).pipe(map(r => r.data));
  }

  getGrammarProgress(): Observable<GrammarProgress[]> {
    return this.http.get<{ data: GrammarProgress[] }>(`${this.baseUrl}/grammar-progress`).pipe(map(r => r.data));
  }

  getGrammarProgressWithTrend(): Observable<any[]> {
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/grammar-trends`).pipe(map(r => r.data));
  }

  getDueForReview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/due-for-review`);
  }
}

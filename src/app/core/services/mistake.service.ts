import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface Mistake {
  id: string;
  type: 'GRAMMAR' | 'PRONUNCIATION' | 'HESITATION';
  originalText: string;
  transcribedText: string;
  grammarFocus?: string;
  resolved: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MistakeService {
  private baseUrl = `${environment.apiBaseUrl}/mistakes`;

  constructor(private http: HttpClient) {}

  getMistakes(filters: any): Observable<{ items: Mistake[], total: number }> {
    if (environment.isDemo) {
      return of({
        items: [
          { id: 'M001', type: 'GRAMMAR', originalText: 'I have been here.', transcribedText: 'I am here.', grammarFocus: 'Have Been', resolved: false, createdAt: '2024-03-10' },
          { id: 'M002', type: 'PRONUNCIATION', originalText: 'Entrepreneur', transcribedText: 'Enter-pay-neur', resolved: false, createdAt: '2024-03-11' },
          { id: 'M003', type: 'HESITATION', originalText: 'Wait for me.', transcribedText: 'um... wait... uh for me.', resolved: false, createdAt: '2024-03-12' }
        ] as Mistake[],
        total: 3
      }).pipe(delay(500));
    }
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get<{ items: Mistake[], total: number }>(this.baseUrl, { params });
  }

  getSummary(): Observable<any> {
    if (environment.isDemo) {
      return of({
        unresolvedCount: 12,
        todayResolved: 4,
        topMistakeType: 'GRAMMAR'
      }).pipe(delay(400));
    }
    return this.http.get(`${this.baseUrl}/summary`);
  }

  getGrammarProgress(): Observable<any[]> {
    if (environment.isDemo) {
      return of([
        { label: 'Have Been', progress: 65 },
        { label: 'Was/Were', progress: 82 },
        { label: 'Did/Didn\'t', progress: 45 }
      ]).pipe(delay(600));
    }
    return this.http.get<any[]>(`${this.baseUrl}/grammar-progress`);
  }
}

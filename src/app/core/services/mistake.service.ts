import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key]);
    });
    return this.http.get<{ items: Mistake[], total: number }>(this.baseUrl, { params });
  }

  getSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`);
  }

  getGrammarProgress(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/grammar-progress`);
  }
}

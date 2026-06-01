import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class LiveSessionService {
  private baseUrl = `${environment.apiBaseUrl}/sessions`;

  constructor(private http: HttpClient) {}

  completeSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${sessionId}/complete`, {});
  }

  getSessionSummary(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${sessionId}/summary`);
  }

  getSessionDetail(sessionId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/users/sessions/${sessionId}/detail`);
  }
}

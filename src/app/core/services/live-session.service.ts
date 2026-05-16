import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class LiveSessionService {
  private baseUrl = `${environment.apiBaseUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getSessionSummary(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        id: sessionId,
        title: 'Family Grammar Practice',
        date: new Date().toISOString(),
        duration: '15:20',
        score: 88,
        mistakesCount: 3,
        members: [
          { name: 'Ravi Kumar', score: 92, mistakes: 1 },
          { name: 'Priya Kumar', score: 85, mistakes: 2 }
        ],
        topGrammarFocus: 'Have Been',
        overallFeedback: 'Great collaboration! Practice "Have Been" more.'
      }).pipe(delay(800));
    }
    return this.http.get(`${this.baseUrl}/${sessionId}/complete`);
  }
}

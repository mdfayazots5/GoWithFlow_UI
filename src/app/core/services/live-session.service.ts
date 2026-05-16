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

  completeSession(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return this.getSessionSummary(sessionId).pipe(delay(1000));
    }
    return this.http.post(`${this.baseUrl}/${sessionId}/complete`, {});
  }

  getSessionSummary(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        id: sessionId,
        title: 'Family Grammar Practice',
        scriptTitle: 'Office Conversation — Have Been / Has Been',
        date: new Date().toISOString(),
        duration: '15:20',
        score: 88,
        totalTurns: 24,
        grammarFocusTag: 'Have Been',
        totalMistakesAllMembers: 3,
        memberScores: [
          { userId: 'U001', fullName: 'Ravi Kumar', fluencyScore: 92, confidenceScore: 88, mistakeCount: 1, listenerRating: 5 },
          { userId: 'U002', fullName: 'Priya Kumar', fluencyScore: 85, confidenceScore: 90, mistakeCount: 2, listenerRating: 4 }
        ],
        overallFeedback: 'Great collaboration! Practice "Have Been" more.'
      }).pipe(delay(800));
    }
    return this.http.get<any>(`${this.baseUrl}/${sessionId}/summary`);
  }

  getSessionDetail(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return this.getSessionSummary(sessionId);
    }
    return this.http.get<any>(`${environment.apiBaseUrl}/users/sessions/${sessionId}/detail`);
  }
}

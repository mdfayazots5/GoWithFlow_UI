import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface RepracticeUtterance {
  id: string;
  originalUtteranceId: string;
  englishText: string;
  hintText: string;
  completed: boolean;
  score?: number;
}

export interface RepracticeSession {
  id: string;
  title: string;
  utterances: RepracticeUtterance[];
}

@Injectable({
  providedIn: 'root'
})
export class RepracticeService {
  private baseUrl = `${environment.apiBaseUrl}/repractice`;

  constructor(private http: HttpClient) {}

  generate(sourceSessionId?: string): Observable<RepracticeSession> {
    if (environment.isDemo) {
      return of({
        id: 'RP' + Math.floor(Math.random() * 1000),
        title: 'Correction Round - Office Basics',
        utterances: [
          { id: 'RPU1', originalUtteranceId: 'U1', englishText: 'I have been working here.', hintText: 'నేను ఇక్కడ పనిచేస్తున్నాను.', completed: false },
          { id: 'RPU2', originalUtteranceId: 'U2', englishText: 'Did you finish it?', hintText: 'మీరు పూర్తి చేసారా?', completed: false }
        ]
      }).pipe(delay(1000));
    }
    return this.http.post<RepracticeSession>(`${this.baseUrl}/generate`, { sourceSessionId });
  }

  getSession(id: string): Observable<RepracticeSession> {
    if (environment.isDemo) {
      return of({
        id,
        title: 'Correction Round - Office Basics',
        utterances: [
          { id: 'RPU1', originalUtteranceId: 'U1', englishText: 'I have been working here.', hintText: 'నేను ఇక్కడ పనిచేస్తున్నాను.', completed: false },
          { id: 'RPU2', originalUtteranceId: 'U2', englishText: 'Did you finish it?', hintText: 'మీరు పూర్తి చేసారా?', completed: false }
        ]
      }).pipe(delay(500));
    }
    return this.http.get<RepracticeSession>(`${this.baseUrl}/${id}`);
  }

  recordAttempt(utteranceId: string, score: number): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(500));
    return this.http.patch(`${this.baseUrl}/attempt`, { repracticeUtteranceId: utteranceId, score });
  }

  complete(id: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(800));
    return this.http.post(`${this.baseUrl}/${id}/complete`, {});
  }
}

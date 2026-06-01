import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  generate(sourceSessionId?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/generate`, { sourceSessionId });
  }

  getSession(id: string): Observable<RepracticeSession> {
    return this.http.get<RepracticeSession>(`${this.baseUrl}/${id}`);
  }

  recordAttempt(utteranceId: string, score: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/attempt`, { repracticeUtteranceId: utteranceId, score });
  }

  complete(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/complete`, {});
  }
}

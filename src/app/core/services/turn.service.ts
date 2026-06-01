import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

export interface Utterance {
  sequenceId: number;
  speakerLabel: string;
  englishText: string;
  hintText: string;
  grammarTag: string;
  contextTag: string;
  focusWord?: string;
  pronunciationNote?: string;
}

export interface TurnState {
  sessionId: string;
  activeMemberId: string;
  slotIndex: number;
  turnIndex: number;
  utterance: Utterance;
  isLastTurn: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TurnService {
  private baseUrl = `${environment.apiBaseUrl}/turns`;

  constructor(private http: HttpClient) {}

  getCurrentTurn(sessionId: string): Observable<TurnState> {
    return this.http.get<{ data: TurnState }>(`${this.baseUrl}/${sessionId}/current`).pipe(map(r => r.data));
  }

  submitVoiceAnalysis(sessionId: string, analysis: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${sessionId}/voice-analysis`, analysis);
  }

  requestReRead(sessionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${sessionId}/re-read`, {});
  }

  shiftTurn(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${sessionId}/shift`, {});
  }

  submitListenerFeedback(sessionId: string, feedback: { turnIndex: number, targetUserId: string, feedbackTag: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/${sessionId}/listener-feedback`, feedback);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
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
    if (environment.isDemo) {
      return of({
        sessionId,
        activeMemberId: 'U001',
        slotIndex: 0,
        turnIndex: 0,
        utterance: {
          sequenceId: 1,
          speakerLabel: 'Ravi',
          englishText: 'I have been working here for five years.',
          hintText: 'నేను ఇక్కడ ఐదేళ్లుగా పనిచేస్తున్నాను.',
          grammarTag: 'Have Been',
          contextTag: 'Office'
        },
        isLastTurn: false
      } as TurnState).pipe(delay(500));
    }
    return this.http.get<TurnState>(`${this.baseUrl}/${sessionId}/current`);
  }

  submitVoiceAnalysis(sessionId: string, analysis: any): Observable<any> {
    if (environment.isDemo) return of({ success: true, score: 85 }).pipe(delay(800));
    return this.http.post(`${this.baseUrl}/${sessionId}/voice-analysis`, analysis);
  }

  requestReRead(sessionId: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(300));
    return this.http.post(`${this.baseUrl}/${sessionId}/re-read`, {});
  }

  shiftTurn(sessionId: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(500));
    return this.http.post(`${this.baseUrl}/${sessionId}/shift`, {});
  }

  submitListenerFeedback(sessionId: string, feedback: { turnIndex: number, targetUserId: string, feedbackTag: string }): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(300));
    return this.http.post(`${this.baseUrl}/${sessionId}/listener-feedback`, feedback);
  }
}

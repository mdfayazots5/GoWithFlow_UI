// File: src/app/modules/live-session/live-session.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '@env/environment';
import { TurnState, VoiceAnalysisResponse } from '@core/models/voice.model';

@Injectable({
  providedIn: 'root'
})
export class LiveSessionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/turns`;

  getCurrentTurn(sessionId: string): Observable<TurnState> {
    if (environment.isDemo) {
      return of({
        sessionId,
        turnIndex: 1,
        totalTurns: 10,
        activeMemberId: 'U001',
        activeMemberName: 'Ravi Kumar',
        reReadAllowed: true,
        reReadCount: 0,
        maxReReads: 2,
        utterance: {
          sequenceId: 1,
          speakerLabel: 'Host',
          englishText: 'I have been working as a developer for a long time.',
          hintText: 'నేను చాలా కాలంగా డెవలపర్‌గా పని చేస్తున్నాను.',
          grammarTag: 'Have Been',
          contextTag: 'Interview',
          focusWord: 'developer'
        }
      }).pipe(delay(500));
    }
    return this.http.get<{ data: TurnState }>(`${this.baseUrl}/${sessionId}/current`).pipe(map(r => r.data));
  }

  shiftTurn(sessionId: string, payload: any): Observable<TurnState> {
    if (environment.isDemo) {
      return this.getCurrentTurn(sessionId);
    }
    return this.http.post<TurnState>(`${this.baseUrl}/${sessionId}/shift`, payload);
  }

  saveVoiceAnalysis(sessionId: string, payload: any): Observable<VoiceAnalysisResponse> {
    if (environment.isDemo) {
      return of({
        id: 'VA-' + Date.now(),
        score: payload.fluencyScore,
        isAutoSavedAsMistake: payload.fluencyScore < 80
      }).pipe(delay(800));
    }
    return this.http.post<VoiceAnalysisResponse>(`${this.baseUrl}/${sessionId}/voice-analysis`, payload);
  }

  submitListenerFeedback(sessionId: string, payload: any): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(200));
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/listener-feedback`, payload);
  }

  requestReRead(sessionId: string): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/re-read`, {});
  }

  completeSession(sessionId: string): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(500));
    return this.http.post<{ data: any }>(`${environment.apiBaseUrl}/sessions/${sessionId}/complete`, {}).pipe(map(r => r.data));
  }
}

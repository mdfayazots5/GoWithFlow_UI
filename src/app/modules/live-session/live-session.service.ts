import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { environment } from '@env/environment';
import { TurnState, VoiceAnalysisResponse } from '@core/models/voice.model';
import { WebsocketService } from '@core/services/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class LiveSessionService {
  private http = inject(HttpClient);
  private ws = inject(WebsocketService);
  private readonly baseUrl = `${environment.apiBaseUrl}/turns`;

  getCurrentTurn(sessionId: string): Observable<TurnState> {
    return this.http.get<{ data: TurnState }>(`${this.baseUrl}/${sessionId}/current`).pipe(map(r => r.data));
  }

  shiftTurn(sessionId: string, payload: any): Observable<TurnState> {
    return this.http.post<TurnState>(`${this.baseUrl}/${sessionId}/shift`, payload);
  }

  saveVoiceAnalysis(sessionId: string, payload: any): Observable<VoiceAnalysisResponse> {
    return this.http.post<VoiceAnalysisResponse>(`${this.baseUrl}/${sessionId}/voice-analysis`, payload);
  }

  submitListenerFeedback(sessionId: string, payload: any): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/listener-feedback`, payload);
  }

  requestReRead(sessionId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/re-read`, {});
  }

  completeSession(sessionId: string): Observable<any> {
    return this.http.post<{ data: any }>(`${environment.apiBaseUrl}/sessions/${sessionId}/complete`, {}).pipe(map(r => r.data));
  }

  completeTurnRealtime(sessionId: string | number, memberId: string | number, turnIndex: number, score: number): Observable<void> {
    return from(this.ws.emit('CompleteTurn', String(sessionId), String(memberId), turnIndex, score));
  }

  submitListenerFeedbackRealtime(sessionId: string | number, tag: string, targetTurnIndex: number): Observable<void> {
    return from(this.ws.emit('SubmitListenerFeedback', String(sessionId), tag, targetTurnIndex));
  }

  requestReReadRealtime(sessionId: string | number, requesterId: string | number): Observable<void> {
    return from(this.ws.emit('RequestReRead', String(sessionId), String(requesterId)));
  }
}

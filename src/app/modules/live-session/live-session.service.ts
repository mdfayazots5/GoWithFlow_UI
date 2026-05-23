import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { environment } from '@env/environment';
import { TurnState, VoiceAnalysisResponse, SessionSummary } from '@core/models/voice.model';
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

  completeSession(sessionId: string): Observable<SessionSummary> {
    return this.http.post<{ data: SessionSummary }>(`${environment.apiBaseUrl}/sessions/${sessionId}/complete`, {}).pipe(map(r => r.data));
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

  startVoiceBroadcast(sessionId: string, speakerId: string): Observable<void> {
    return from(this.ws.emit('VoiceBroadcastStart', sessionId, speakerId));
  }

  stopVoiceBroadcast(sessionId: string, speakerId: string): Observable<void> {
    return from(this.ws.emit('VoiceBroadcastStop', sessionId, speakerId));
  }

  requestVoiceStream(sessionId: string, listenerUserId: string): Observable<void> {
    return from(this.ws.emit('RequestVoiceStream', sessionId, listenerUserId));
  }

  sendWebRTCOffer(sessionId: string, toUserId: string, offer: string): Observable<void> {
    return from(this.ws.emit('SendWebRTCOffer', sessionId, toUserId, offer));
  }

  sendWebRTCAnswer(sessionId: string, toUserId: string, answer: string): Observable<void> {
    return from(this.ws.emit('SendWebRTCAnswer', sessionId, toUserId, answer));
  }

  sendICECandidate(sessionId: string, toUserId: string, candidate: string): Observable<void> {
    return from(this.ws.emit('SendICECandidate', sessionId, toUserId, candidate));
  }

  leaveSession(sessionId: string): Observable<boolean> {
    return this.http.post<{ data: boolean }>(`${environment.apiBaseUrl}/sessions/${sessionId}/leave`, {}).pipe(map(r => r.data));
  }
}

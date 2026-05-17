import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Session,
  CreateSessionResponse,
  SessionPreview,
  LobbyState
} from '@core/models/session.model';
import { PagedResult } from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sessions`;

  getSessionHistory(statusFilter?: string): Observable<PagedResult<Session>> {
    let params = new HttpParams();
    if (statusFilter) params = params.set('status', statusFilter);
    return this.http.get<PagedResult<Session>>(`${this.baseUrl}/history`, { params });
  }

  getSessionById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }

  createSession(payload: any): Observable<CreateSessionResponse> {
    return this.http.post<any>(this.baseUrl, payload).pipe(map(res => res.data as CreateSessionResponse));
  }

  validateCode(joinCode: string): Observable<SessionPreview> {
    return this.http.get<any>(`${this.baseUrl}/validate/${joinCode}`).pipe(map(res => res.data as SessionPreview));
  }

  joinSession(payload: { joinCode: string, slotIndex: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/join`, payload).pipe(map(res => res.data));
  }

  getLobbyState(sessionId: string): Observable<LobbyState> {
    return this.http.get<any>(`${this.baseUrl}/lobby/${sessionId}`).pipe(map(res => res.data as LobbyState));
  }

  updateReadyStatus(payload: { sessionId: number, isReady: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/ready`, payload);
  }

  startSession(sessionId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/start`, {});
  }

  endSession(sessionId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/end`, {});
  }

  leaveSession(sessionId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/leave`, {});
  }
}

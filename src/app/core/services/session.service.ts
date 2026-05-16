// File: src/app/core/services/session.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '@env/environment';
import { 
  Session, 
  CreateSessionResponse, 
  SessionPreview, 
  LobbyState,
  LobbyMember
} from '@core/models/session.model';
import { DUMMY_SESSIONS } from '@data/dummy/session.dummy';
import { PagedResult } from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sessions`;

  getSessionHistory(statusFilter?: string): Observable<PagedResult<Session>> {
    if (environment.isDemo) {
      let filtered = [...DUMMY_SESSIONS];
      if (statusFilter && statusFilter !== 'All') {
        filtered = filtered.filter((s: Session) => s.status === statusFilter.toUpperCase());
      }
      return of({
        items: filtered,
        total: filtered.length
      }).pipe(delay(600));
    }
    let params = new HttpParams();
    if (statusFilter) params = params.set('status', statusFilter);
    return this.http.get<PagedResult<Session>>(`${this.baseUrl}/history`, { params });
  }

  getSessionById(id: string): Observable<Session> {
    if (environment.isDemo) {
      const session = DUMMY_SESSIONS.find((s: Session) => s.id === id) || DUMMY_SESSIONS[0];
      return of(session).pipe(delay(300));
    }
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }

  createSession(payload: any): Observable<CreateSessionResponse> {
    if (environment.isDemo) {
      return of({
        id: 'DEMO-' + Math.floor(Math.random() * 1000),
        joinCode: 'KLM' + Math.floor(100 + Math.random() * 899),
        status: 'LOBBY'
      }).pipe(delay(1000));
    }
    return this.http.post<any>(this.baseUrl, payload).pipe(map(res => res.data as CreateSessionResponse));
  }

  validateCode(joinCode: string): Observable<SessionPreview> {
    if (environment.isDemo) {
      const session = DUMMY_SESSIONS[0];
      return of({
        id: session.id,
        sessionName: session.sessionName,
        sessionMode: session.sessionMode,
        scriptTitle: session.scriptTitle,
        sessionDuration: session.sessionDuration,
        currentMembers: 1,
        maxMembers: session.maxMembers,
        slots: [
          { slotIndex: 1, slotName: 'Moderator', isOccupied: true, userId: 'U001', userName: 'Ravi Kumar' },
          { slotIndex: 2, slotName: 'Speaker A', isOccupied: false },
          { slotIndex: 3, slotName: 'Speaker B', isOccupied: false },
          { slotIndex: 4, slotName: 'Listener', isOccupied: false }
        ]
      }).pipe(delay(500));
    }
    return this.http.get<any>(`${this.baseUrl}/validate/${joinCode}`).pipe(map(res => res.data as SessionPreview));
  }

  joinSession(payload: { joinCode: string, slotIndex: number }): Observable<any> {
    if (environment.isDemo) {
      return this.getLobbyState('DEMO');
    }
    return this.http.post<any>(`${this.baseUrl}/join`, payload).pipe(map(res => res.data));
  }

  getLobbyState(sessionId: string): Observable<LobbyState> {
    if (environment.isDemo) {
      const session = DUMMY_SESSIONS.find(s => s.id === sessionId) || DUMMY_SESSIONS[1];
      const members: LobbyMember[] = [
        { userId: 'U001', name: 'Ravi Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi', ready: true, isHost: true, slotIndex: 1, slotName: 'Moderator' },
        { userId: 'U002', name: 'Priya Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', ready: true, isHost: false, slotIndex: 2, slotName: 'Speaker A' },
        { userId: 'U003', name: 'Arjun Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun', ready: true, isHost: false, slotIndex: 3, slotName: 'Speaker B' },
        { userId: 'U004', name: 'Sneha Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha', ready: true, isHost: false, slotIndex: 4, slotName: 'Listener' }
      ];
      return of({
        session: { ...session, status: 'LOBBY' } as Session,
        members: members,
        canStart: true
      }).pipe(delay(500));
    }
    return this.http.get<any>(`${this.baseUrl}/lobby/${sessionId}`).pipe(map(res => res.data as LobbyState));
  }

  updateReadyStatus(payload: { sessionId: number, isReady: boolean }): Observable<any> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.patch<any>(`${this.baseUrl}/ready`, payload);
  }

  startSession(sessionId: string): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/start`, {});
  }

  endSession(sessionId: string): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/end`, {});
  }

  leaveSession(sessionId: string): Observable<boolean> {
    if (environment.isDemo) return of(true).pipe(delay(300));
    return this.http.post<boolean>(`${this.baseUrl}/${sessionId}/leave`, {});
  }
}

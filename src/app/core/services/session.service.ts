import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface Session {
  id: string;
  joinCode: string;
  title: string;
  mode: string;
  scriptId: string;
  status: 'LOBBY' | 'ACTIVE' | 'COMPLETED';
  hostId: string;
  maxMembers: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private baseUrl = `${environment.apiBaseUrl}/sessions`;

  constructor(private http: HttpClient) {}

  createSession(payload: { title: string, mode: string, scriptId: string, maxMembers: number }): Observable<Session> {
    if (environment.isDemo) {
      return of({
        id: 'S' + Math.floor(Math.random() * 1000),
        joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
        title: payload.title,
        mode: payload.mode,
        scriptId: payload.scriptId,
        status: 'LOBBY',
        hostId: 'U001',
        maxMembers: payload.maxMembers
      } as Session).pipe(delay(800));
    }
    return this.http.post<Session>(this.baseUrl, payload);
  }

  validateCode(code: string): Observable<Session> {
    if (environment.isDemo) {
      return of({
        id: 'S001',
        joinCode: code,
        title: 'Family Grammar Practice',
        mode: 'Grammar Drill',
        scriptId: 'SC001',
        status: 'LOBBY',
        hostId: 'U001',
        maxMembers: 4
      } as Session).pipe(delay(500));
    }
    return this.http.get<Session>(`${this.baseUrl}/validate/${code}`);
  }

  joinSession(payload: { sessionId: string, userId: string, name: string }): Observable<any> {
    if (environment.isDemo) return of({ success: true, slotIndex: 1 }).pipe(delay(500));
    return this.http.post(`${this.baseUrl}/join`, payload);
  }

  getLobbyInfo(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        session: { id: sessionId, title: 'Family Grammar Practice', joinCode: '482931', mode: 'Grammar Drill' },
        members: [
          { userId: 'U001', name: 'Ravi Kumar', ready: true, isHost: true, slotIndex: 0 },
          { userId: 'U002', name: 'Priya Kumar', ready: false, isHost: false, slotIndex: 1 }
        ]
      }).pipe(delay(500));
    }
    return this.http.get(`${this.baseUrl}/lobby/${sessionId}`);
  }

  getSessionHistory(filters: any): Observable<{ items: any[], total: number }> {
    if (environment.isDemo) {
      return of({
        items: [
          { id: 'S001', title: 'Office Gossip', date: '2024-03-15', score: 88, status: 'COMPLETED' },
          { id: 'S002', title: 'Kitchen Recipe', date: '2024-03-14', score: 92, status: 'COMPLETED' }
        ],
        total: 2
      }).pipe(delay(600));
    }
    return this.http.get<{ items: any[], total: number }>(`${this.baseUrl}/history`, { params: filters });
  }
}

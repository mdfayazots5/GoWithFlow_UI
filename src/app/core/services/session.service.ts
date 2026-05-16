import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface SlotInfo {
  slotIndex: number;
  slotName: string;
  isOccupied: boolean;
  userId?: string;
  userName?: string;
}

export interface Session {
  id: number;
  joinCode: string;
  title: string;
  mode: string;
  scriptId: string;
  status: 'LOBBY' | 'ACTIVE' | 'COMPLETED';
  hostId: string;
  maxMembers: number;
  slots: SlotInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private baseUrl = `${environment.apiBaseUrl}/sessions`;

  constructor(private http: HttpClient) {}

  createSession(payload: { title: string, mode: string, scriptId: string, maxMembers: number }): Observable<any> {
    if (environment.isDemo) {
      return of({
        id: Math.floor(Math.random() * 1000),
        joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
        title: payload.title,
        mode: payload.mode,
        scriptId: payload.scriptId,
        status: 'LOBBY',
        hostId: 'U001',
        maxMembers: payload.maxMembers
      }).pipe(delay(800));
    }
    return this.http.post<any>(this.baseUrl, payload);
  }

  validateCode(code: string): Observable<Session> {
    if (environment.isDemo) {
      return of({
        id: 101,
        joinCode: code,
        title: 'Family Grammar Practice',
        mode: 'Grammar Drill',
        scriptId: 'SC001',
        status: 'LOBBY',
        hostId: 'U001',
        maxMembers: 4,
        slots: [
          { slotIndex: 0, slotName: 'Narrator', isOccupied: true, userId: 'U001', userName: 'Ravi Kumar' },
          { slotIndex: 1, slotName: 'Father', isOccupied: false },
          { slotIndex: 2, slotName: 'Daughter', isOccupied: false },
          { slotIndex: 3, slotName: 'Mother', isOccupied: false },
        ]
      } as Session).pipe(delay(500));
    }
    return this.http.get<Session>(`${this.baseUrl}/validate/${code}`);
  }

  joinSession(payload: { sessionId: number, userId: string, name: string, slotIndex: number }): Observable<any> {
    if (environment.isDemo) return of({ success: true, sessionId: payload.sessionId }).pipe(delay(500));
    return this.http.post(`${this.baseUrl}/join`, payload);
  }

  getLobbyInfo(sessionId: number): Observable<any> {
    if (environment.isDemo) {
      return of({
        session: { id: sessionId, title: 'Family Grammar Practice', joinCode: '482931', mode: 'Grammar Drill' },
        members: [
          { userId: 'U001', name: 'Ravi Kumar', ready: true, isHost: true, slotIndex: 0, slotName: 'Narrator' },
          { userId: 'U002', name: 'Priya Kumar', ready: false, isHost: false, slotIndex: 1, slotName: 'Father' }
        ]
      }).pipe(delay(500));
    }
    return this.http.get(`${this.baseUrl}/lobby/${sessionId}`);
  }

  getSessionHistory(filters: any): Observable<{ items: any[], total: number }> {
    if (environment.isDemo) {
      return of({
        items: [
          { id: 'S001', title: 'Office Gossip', date: '2024-03-15', score: 88, fluencyScore: 88, mistakesCount: 2, status: 'COMPLETED' },
          { id: 'S002', title: 'Kitchen Recipe', date: '2024-03-14', score: 92, fluencyScore: 92, mistakesCount: 1, status: 'COMPLETED' }
        ],
        total: 2
      }).pipe(delay(600));
    }
    return this.http.get<{ items: any[], total: number }>(`${this.baseUrl}/history`, { params: filters });
  }
}

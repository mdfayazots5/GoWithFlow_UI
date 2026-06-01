import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Session,
  CreateSessionResponse,
  SessionPreview,
  JoinSessionResponse,
  LobbyState,
  LobbyMember
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
    return this.http.get<any>(`${this.baseUrl}/history`, { params }).pipe(
      map(res => {
        const data = res.data;
        return {
          ...data,
          items: (data.items ?? []).map((item: any) => ({
            ...item,
            id: String(item.sessionId),
            createdDate: item.sessionDate,
            sessionDuration: item.duration,
            mistakesCount: item.mistakeCount
          } as Session))
        } as PagedResult<Session>;
      })
    );
  }

  getSessionById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }

  createSession(payload: any): Observable<CreateSessionResponse> {
    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => ({
        sessionId: String(res.data.sessionId),
        sessionName: res.data.sessionName,
        joinCode: res.data.joinCode,
        status: res.data.status,
        scriptTitle: res.data.scriptTitle
      } as CreateSessionResponse))
    );
  }

  validateCode(joinCode: string): Observable<SessionPreview> {
    return this.http.get<any>(`${this.baseUrl}/validate/${joinCode}`).pipe(
      map(res => {
        const d = res.data;
        return {
          id: String(d.sessionId),
          sessionName: d.sessionName,
          sessionMode: d.sessionMode,
          scriptTitle: d.scriptTitle,
          sessionDuration: d.duration ?? d.sessionDuration ?? 0,
          currentMembers: d.currentMemberCount ?? d.currentMembers ?? 0,
          maxMembers: d.maxMembers,
          slots: (d.slots ?? []).map((slot: any) => ({
            slotIndex: slot.slotIndex,
            slotName: slot.slotName ?? '',
            isOccupied: slot.isOccupied === true,
            userId: slot.userId != null ? String(slot.userId) : undefined,
            userName: slot.userFullName ?? slot.userName ?? undefined,
            isReady: slot.isReady === true
          }))
        } as SessionPreview;
      })
    );
  }

  joinSession(payload: { joinCode: string, slotIndex: number }): Observable<JoinSessionResponse> {
    return this.http.post<any>(`${this.baseUrl}/join`, payload).pipe(
      map(res => {
        const d = res.data;
        return {
          sessionId: String(d.sessionId),
          sessionName: d.sessionName,
          joinCode: d.joinCode,
          sessionMode: d.sessionMode,
          scriptTitle: d.scriptTitle,
          maxMembers: d.maxMembers,
          sessionDuration: d.sessionDuration,
          canStart: d.canStart === true,
          members: (d.members ?? []).map((m: any) => ({
            userId: String(m.userId),
            name: m.fullName,
            avatar: m.avatarUrl ?? '',
            ready: m.isReady === true,
            isHost: m.isHost === true,
            slotIndex: m.slotIndex,
            slotName: m.slotName ?? ''
          } as LobbyMember))
        } as JoinSessionResponse;
      })
    );
  }

  getLobbyState(sessionId: string): Observable<LobbyState> {
    return this.http.get<any>(`${this.baseUrl}/lobby/${sessionId}`).pipe(
      map(res => {
        const d = res.data;
        return {
          session: {
            id: String(d.sessionId),
            sessionName: d.sessionName,
            joinCode: d.joinCode,
            sessionMode: d.sessionMode,
            scriptTitle: d.scriptTitle,
            maxMembers: d.maxMembers,
            sessionDuration: d.sessionDuration,
            currentMembers: (d.members ?? []).length,
            status: d.status ?? 'LOBBY'
          },
          members: (d.members ?? []).map((m: any) => ({
            userId: String(m.userId),
            name: m.fullName,
            avatar: m.avatarUrl ?? '',
            ready: m.isReady === true,
            isHost: m.isHost === true,
            slotIndex: m.slotIndex,
            slotName: m.slotName ?? ''
          } as LobbyMember)),
          canStart: d.canStart ?? false
        } as LobbyState;
      })
    );
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

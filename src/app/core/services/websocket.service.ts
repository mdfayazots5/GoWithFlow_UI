import { Injectable } from '@angular/core';
import { Subject, Observable, interval, map, filter, EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private lobbyConnection: signalR.HubConnection | null = null;
  private liveConnection: signalR.HubConnection | null = null;
  private demoSubject = new Subject<{type: string, data: any}>();

  constructor() {
    if (environment.isDemo) {
      this.startDemoMode();
    }
  }

  connectLobby(sessionId: string): void {
    if (environment.isDemo) return;

    this.lobbyConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRHubUrl}/hubs/session?sessionId=${sessionId}`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.lobbyConnection.start().catch(err => console.error('Lobby Connection Error:', err));
  }

  connectLive(sessionId: string): void {
    if (environment.isDemo) return;

    this.liveConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRHubUrl}/hubs/live-session?sessionId=${sessionId}`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.liveConnection.start().catch(err => console.error('Live Connection Error:', err));
  }

  onLobby(event: string): Observable<any> {
    if (environment.isDemo) {
      return this.demoSubject.asObservable().pipe(
        filter(msg => msg.type === event),
        map(msg => msg.data)
      );
    }

    return new Observable(observer => {
      this.lobbyConnection?.on(event, (data) => observer.next(data));
    });
  }

  onLive(event: string): Observable<any> {
    if (environment.isDemo) {
      return this.demoSubject.asObservable().pipe(
        filter(msg => msg.type === event),
        map(msg => msg.data)
      );
    }

    return new Observable(observer => {
      this.liveConnection?.on(event, (data) => observer.next(data));
    });
  }

  invokeLobby(method: string, ...args: any[]): void {
    if (environment.isDemo) {
      console.log(`[Demo Lobby] Invoke ${method}`, args);
      if (method === 'JoinLobby') {
        // Echo back for demo
      }
      return;
    }
    this.lobbyConnection?.invoke(method, ...args).catch(err => console.error(`Invoke Lobby Error (${method}):`, err));
  }

  invokeLive(method: string, ...args: any[]): void {
    if (environment.isDemo) {
      console.log(`[Demo Live] Invoke ${method}`, args);
      return;
    }
    this.liveConnection?.invoke(method, ...args).catch(err => console.error(`Invoke Live Error (${method}):`, err));
  }

  disconnectAll(): void {
    this.lobbyConnection?.stop();
    this.liveConnection?.stop();
    this.lobbyConnection = null;
    this.liveConnection = null;
  }

  private startDemoMode() {
    // Keep some simulation for demo mode so the UI is testable
    interval(15000).subscribe(i => {
      this.demoSubject.next({
        type: 'TURN_SHIFT',
        data: {
          newActiveMemberId: i % 2 === 0 ? 'U002' : 'U001',
          slotIndex: i % 2 === 0 ? 1 : 0,
          turnIndex: i + 1,
          nextUtterance: {
            sequenceId: i + 2,
            speakerLabel: i % 2 === 0 ? 'Priya' : 'Ravi',
            englishText: i % 2 === 0 ? 'Have you been working here long?' : 'No, I just started last week.',
            hintText: i % 2 === 0 ? 'మీరు ఇక్కడ చాలా కాలం నుండి పని చేస్తున్నారా?' : 'లేదు, నేను పోయిన వారమే ప్రారంభించాను.'
          }
        }
      });
    });

    interval(10000).subscribe(i => {
      if (i === 1) {
        this.demoSubject.next({
          type: 'MEMBER_JOINED',
          data: { userId: 'U003', name: 'Arjun Kumar', slotIndex: 2, slotName: 'Daughter' }
        });
      }
    });
    
    // Simulate RE_READ_REQUESTED
    setTimeout(() => {
      this.demoSubject.next({ type: 'RE_READ_REQUESTED', data: {} });
    }, 8000);
  }
}

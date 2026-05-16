import { Injectable } from '@angular/core';
import { Subject, Observable, interval, map } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private hubConnection?: signalR.HubConnection;
  private rawWsSubject?: WebSocketSubject<any>;
  private messageSubject = new Subject<any>();

  constructor(private auth: AuthService) {}

  async connect(sessionId: string, hubPath: string = 'session') {
    if (environment.isDemo) {
      this.startDemoMode(hubPath);
      return;
    }

    // Primary: SignalR
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.signalRHubUrl}/${hubPath}?sessionId=${sessionId}`, {
          accessTokenFactory: () => localStorage.getItem('gwf_token') || ''
        })
        .withAutomaticReconnect()
        .build();

      const events = ['TURN_SHIFT', 'MEMBER_JOINED', 'MEMBER_READY', 'SESSION_STARTED', 'SESSION_ENDED', 'LISTENER_TAG'];
      events.forEach(evt => {
        this.hubConnection?.on(evt, (data: any) => {
          this.messageSubject.next({ type: evt, data });
        });
      });

      await this.hubConnection.start();
      console.log('SignalR Connected');
    } catch (err) {
      console.error('SignalR Start Error, falling back to raw WS:', err);
      this.connectRaw(sessionId, hubPath);
    }
  }

  private connectRaw(sessionId: string, hubPath: string) {
    const token = localStorage.getItem('gwf_token');
    const wsUrl = `${environment.wsBaseUrl}/${hubPath}?sessionId=${sessionId}&token=${token}`;
    this.rawWsSubject = webSocket(wsUrl);
    this.rawWsSubject.subscribe({
      next: (msg: any) => this.messageSubject.next(msg),
      error: (err) => console.error('Raw WebSocket Error:', err),
      complete: () => console.log('Raw WebSocket Closed')
    });
  }

  private startDemoMode(hubPath: string) {
    if (hubPath === 'live-session') {
      interval(15000).subscribe(i => {
         this.messageSubject.next({ 
           type: 'TURN_SHIFT', 
           data: { 
             newActiveMemberId: i % 2 === 0 ? 'U002' : 'U001', 
             slotIndex: i % 2 === 0 ? 1 : 0, 
             turnIndex: i + 1,
             nextUtterance: {
               sequenceId: i + 2,
               speakerLabel: i % 2 === 0 ? 'Priya' : 'Ravi',
               englishText: i % 2 === 0 ? 'That is a long time! How do you like it?' : 'It is great, the team is very supportive.',
               hintText: i % 2 === 0 ? 'అది చాలా కాలం! మీకు అది ఎలా అనిపిస్తుంది?' : 'బాగుంది, టీం చాలా సపోర్టివ్‌గా ఉంటారు.'
             }
           } 
         });
      });
    } else {
      interval(10000).subscribe(i => {
        if (i === 1) {
          this.messageSubject.next({ type: 'MEMBER_JOINED', data: { userId: 'U003', name: 'Arjun Kumar', slotIndex: 2 } });
        }
      });
    }
  }

  onEvent(type: string): Observable<any> {
    return this.messageSubject.asObservable().pipe(
      map(msg => msg?.type === type ? msg.data : null)
    );
  }

  async invoke(method: string, ...args: any[]) {
    if (environment.isDemo) {
      console.log(`[WS-DEMO] Invoking ${method} with args:`, args);
      if (method === 'SetReady') {
         this.messageSubject.next({ type: 'MEMBER_READY', data: { userId: args[1], ready: args[2] } });
      }
      return;
    }
    
    if (this.hubConnection) {
      try {
        await this.hubConnection.invoke(method, ...args);
      } catch (err) {
        console.error(`SignalR Invoke Error (${method}):`, err);
      }
    }
  }

  async disconnect() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
    }
  }
}

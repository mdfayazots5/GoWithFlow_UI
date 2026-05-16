// File: src/app/core/services/websocket.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, EMPTY } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private connection: signalR.HubConnection | null = null;
  private messageSubjects: { [key: string]: Subject<any> } = {};

  connect(sessionId: string, userId: string, hubPath: 'session' | 'live-session'): void {
    if (environment.isDemo) {
      console.log(`[Demo] Connected to ${hubPath} hub for session ${sessionId}`);
      return;
    }

    const token = localStorage.getItem('gwf_token');
    const hubUrl = `${environment.signalRHubUrl}/hubs/${hubPath}`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}?access_token=${token}&sessionId=${sessionId}`)
      .withAutomaticReconnect()
      .build();

    this.connection.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => console.error('SignalR Error: ', err));

    // Register generic handler for common events if needed, or dynamically per on()
  }

  on(eventType: string): Observable<any> {
    if (environment.isDemo) {
      return EMPTY; // Demo handles simulation in components as per instructions
    }

    if (!this.messageSubjects[eventType]) {
      this.messageSubjects[eventType] = new Subject<any>();
      this.connection?.on(eventType, (data) => {
        this.messageSubjects[eventType].next(data);
      });
    }

    return this.messageSubjects[eventType].asObservable();
  }

  emit(method: string, ...args: any[]): void {
    if (environment.isDemo) return;
    this.connection?.invoke(method, ...args)
      .catch(err => console.error('SignalR Emit Error: ', err));
  }

  disconnect(): void {
    if (environment.isDemo) return;
    this.connection?.stop();
    this.connection = null;
    this.messageSubjects = {};
  }
}

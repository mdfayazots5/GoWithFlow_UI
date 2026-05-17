import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private connection: signalR.HubConnection | null = null;
  private messageSubjects: { [key: string]: Subject<any> } = {};

  connect(sessionId: string, userId: string, hubPath: 'session' | 'live-session'): void {
    const token = localStorage.getItem('gwf_token');
    const hubUrl = `${environment.wsBaseUrl}/hubs/${hubPath}`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}?access_token=${token}&sessionId=${sessionId}`)
      .withAutomaticReconnect()
      .build();

    this.connection.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => console.error('SignalR Error: ', err));
  }

  on(eventType: string): Observable<any> {
    if (!this.messageSubjects[eventType]) {
      this.messageSubjects[eventType] = new Subject<any>();
      this.connection?.on(eventType, (data) => {
        this.messageSubjects[eventType].next(data);
      });
    }
    return this.messageSubjects[eventType].asObservable();
  }

  emit(method: string, ...args: any[]): void {
    this.connection?.invoke(method, ...args)
      .catch(err => console.error('SignalR Emit Error: ', err));
  }

  disconnect(): void {
    this.connection?.stop();
    this.connection = null;
    this.messageSubjects = {};
  }
}

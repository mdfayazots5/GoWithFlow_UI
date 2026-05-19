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
  private connectionStartPromise: Promise<void> | null = null;

  connect(sessionId: string, userId: string, hubPath: 'session' | 'live-session'): void {
    const token = localStorage.getItem('gwf_token');
    const hubUrl = `${environment.wsBaseUrl}/hubs/${hubPath}`;

    if (this.connection) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}?access_token=${token}&sessionId=${sessionId}`)
      .withAutomaticReconnect()
      .build();

    this.connectionStartPromise = this.connection.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => {
        console.error('SignalR Error: ', err);
        throw err;
      });
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

  emit(method: string, ...args: any[]): Promise<void> {
    if (!this.connection) {
      return Promise.reject(new Error('SignalR connection is not initialized.'));
    }

    return this.ensureConnected().then(() => this.connection!.invoke(method, ...args))
      .catch(err => {
        console.error('SignalR Emit Error: ', err);
        throw err;
      });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection is not initialized.');
    }

    const initialState = this.connection.state as signalR.HubConnectionState;

    if (initialState === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connectionStartPromise) {
      await this.connectionStartPromise;
    }

    const currentState = this.connection.state as signalR.HubConnectionState;

    if (currentState === signalR.HubConnectionState.Connected) {
      return;
    }

    if (currentState === signalR.HubConnectionState.Disconnected) {
      this.connectionStartPromise = this.connection.start()
        .then(() => console.log('SignalR reconnected'))
        .catch(err => {
          console.error('SignalR Reconnect Error: ', err);
          throw err;
        });

      await this.connectionStartPromise;
      return;
    }

    throw new Error(`SignalR connection is in '${currentState}' state.`);
  }

  disconnect(): void {
    this.connection?.stop();
    this.connection = null;
    this.connectionStartPromise = null;
    this.messageSubjects = {};
  }
}

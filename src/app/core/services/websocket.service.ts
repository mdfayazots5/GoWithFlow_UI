import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private auth = inject(AuthService);
  private connection: signalR.HubConnection | null = null;
  private messageSubjects: { [key: string]: Subject<any> } = {};
  private connectionStartPromise: Promise<void> | null = null;
  // De-dupes concurrent refreshes when several negotiate/reconnect attempts overlap.
  private refreshInFlight: Promise<string> | null = null;

  connect(sessionId: string | null, userId: string, hubPath: 'session' | 'live-session'): void {
    const hubUrl = `${environment.wsBaseUrl}/hubs/${hubPath}`;

    if (this.connection) {
      // If already connected to the same hub, reuse it
      if (this.connection.baseUrl?.includes(`/hubs/${hubPath}`)) return;
      // Different hub — disconnect first
      this.connection.stop().catch(() => {});
      this.connection = null;
      this.connectionStartPromise = null;
      this.messageSubjects = {};
    }

    // sessionId stays as the only manual query param. The JWT is supplied via
    // accessTokenFactory so SignalR re-reads it on every negotiate AND every
    // auto-reconnect (the old static `?access_token=` snapshot went stale on
    // reconnect / token rotation → negotiate 401).
    const qs = sessionId ? `?sessionId=${sessionId}` : '';

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}${qs}`, {
        accessTokenFactory: () => this.resolveAccessToken()
      })
      .withAutomaticReconnect()
      .build();

    // Lifecycle diagnostics — helps confirm whether "SignalR not working" is a real
    // connection problem vs. a missing event. After an auto-reconnect the backend runs
    // OnConnectedAsync again (sessionId stays in the URL query), so group membership is
    // restored automatically; the lobby's 3s poll re-syncs any events missed while down.
    this.connection.onreconnecting(err =>
      console.warn(`[WS] ${hubPath} reconnecting`, err?.message ?? ''));
    this.connection.onreconnected(id =>
      console.log(`[WS] ${hubPath} reconnected`, { connectionId: id }));
    this.connection.onclose(err =>
      console.warn(`[WS] ${hubPath} closed`, err?.message ?? '(clean)'));

    this.connectionStartPromise = this.connection.start()
      .then(() => console.log(`[WS] ${hubPath} connected`, { sessionId }))
      .catch(err => {
        console.error(`[WS] ${hubPath} connect failed`, err);
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

  /**
   * Supplies the freshest JWT to SignalR on every negotiate / reconnect.
   * If the stored token is missing or expired, refreshes it first so an
   * idle-expired token never reaches the negotiate endpoint (→ 401).
   */
  private async resolveAccessToken(): Promise<string> {
    const token = localStorage.getItem('gwf_token');

    if (token && !this.isExpired(token)) {
      return token;
    }

    // Token missing or expired — try a refresh (only if we have a refresh token).
    if (localStorage.getItem('gwf_refreshToken')) {
      try {
        return await this.refreshAccessToken();
      } catch (err) {
        console.error('[WS] token refresh before negotiate failed', err);
      }
    }

    // Best-effort fallback: hand over whatever we have (may be empty) and let
    // the backend reject it cleanly rather than throwing here.
    return token ?? '';
  }

  /** Shares a single in-flight refresh across overlapping negotiate/reconnect attempts. */
  private refreshAccessToken(): Promise<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = firstValueFrom(this.auth.refreshToken())
        .then(() => localStorage.getItem('gwf_token') ?? '')
        .finally(() => { this.refreshInFlight = null; });
    }
    return this.refreshInFlight;
  }

  /** Decodes the JWT `exp` claim; treats unparseable tokens and a 30s skew window as expired. */
  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload?.exp) return false; // no exp claim → let backend decide
      const skewSeconds = 30;
      return Date.now() >= (payload.exp - skewSeconds) * 1000;
    } catch {
      return true; // malformed token → force a refresh attempt
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, finalize, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { UserStateService } from './user-state.service';
import { TabReuseStrategy } from '@core/strategies/tab-reuse.strategy';

export interface User {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  mobile?: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userState     = inject(UserStateService);
  private reuseStrategy = inject(TabReuseStrategy);
  constructor(private http: HttpClient, private router: Router) {}

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  requestOtp(mobileNumber: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/send-otp`, { mobileNumber });
  }

  verifyOtp(mobileNumber: string, code: string): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/verify-otp`, { mobileNumber, otpCode: code }).pipe(
      tap(res => {
        if (res.data && !res.data.isRegistrationRequired) {
          this.setSession(res.data);
        }
      })
    );
  }

  private setSession(res: any) {
    const user = {
      id: String(res.userId ?? res.user?.id ?? ''),
      fullName: res.fullName ?? res.user?.fullName ?? '',
      mobileNumber: res.mobileNumber ?? res.user?.mobileNumber ?? res.mobile ?? res.user?.mobile ?? '',
      email: res.email ?? res.user?.email ?? '',
      role: res.role ?? res.user?.role ?? '',
      avatarUrl: res.avatarUrl ?? res.user?.avatarUrl ?? null
    };

    localStorage.setItem('gwf_token', res.accessToken);
    localStorage.setItem('gwf_refreshToken', res.refreshToken);
    localStorage.setItem('gwf_userId', user.id);
    localStorage.setItem('gwf_role', user.role);
    localStorage.setItem('gwf_user', JSON.stringify(user));
  }

  /**
   * Single in-flight refresh shared across ALL callers (HTTP interceptor, SignalR token factory,
   * startup hydration). The backend ROTATES the refresh token on every refresh (revokes the old,
   * issues a new one), so two concurrent refreshes with the same token would make the loser send a
   * now-revoked token → forced logout. Centralizing here guarantees exactly one rotation per burst
   * — this is what previously bounced users to the login screen the next day.
   */
  private refreshInFlight$: Observable<any> | null = null;

  refreshToken(): Observable<any> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    const refreshToken = localStorage.getItem('gwf_refreshToken');
    this.refreshInFlight$ = this.http.post<any>(`${environment.apiBaseUrl}/auth/refresh-token`, { refreshToken }).pipe(
      map(res => res.data),
      tap(res => this.setSession(res)),
      finalize(() => { this.refreshInFlight$ = null; }),   // clear so the NEXT expiry refreshes anew
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight$;
  }

  /** Decoded `exp` (epoch seconds) of the current access token, or null if absent/unparseable. */
  private accessTokenExp(): number | null {
    const token = localStorage.getItem('gwf_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return typeof payload?.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }

  /** True when the access token is missing or within `skewSeconds` of expiry. */
  private isAccessTokenExpired(skewSeconds = 60): boolean {
    const exp = this.accessTokenExp();
    if (exp == null) return true;
    return exp - skewSeconds <= Math.floor(Date.now() / 1000);
  }

  /**
   * Startup "stay logged in" hydration: if a refresh token exists and the access token is expired,
   * silently refresh ONCE so the app opens straight into the session the next day instead of bouncing
   * to login. Non-blocking and best-effort — a hard failure (revoked/expired refresh token) lets the
   * normal 401 path drive the user to login. Shares the single in-flight refresh above.
   */
  ensureFreshSessionOnStartup(): void {
    if (!localStorage.getItem('gwf_refreshToken')) return;
    if (!this.isAccessTokenExpired()) return;
    this.refreshToken().subscribe({ error: () => { /* 401 path will handle re-auth */ } });
  }

  getRole(): string | null {
    return localStorage.getItem('gwf_role');
  }

  get currentUser(): User | null {
    const user = localStorage.getItem('gwf_user');
    const legacyProfile = localStorage.getItem('gwf_user_profile');
    return JSON.parse(user ?? legacyProfile ?? 'null');
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('gwf_token');
  }

  logout() {
    this.userState.reset();        // wipe in-memory cache before clearing storage
    this.reuseStrategy.clearCache(); // drop cached tab components so they're never reattached after logout
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}

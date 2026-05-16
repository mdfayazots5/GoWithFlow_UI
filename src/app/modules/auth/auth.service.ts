import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { User } from '../../core/models/user.model';
import { DemoService } from '@core/services/demo.service';
import { DUMMY_USERS } from '../../data/dummy/user.dummy';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private demo = inject(DemoService);

  private readonly TOKEN_KEY = 'gwf_token';
  private readonly REFRESH_TOKEN_KEY = 'gwf_refreshToken';
  private readonly USER_ID_KEY = 'gwf_userId';
  private readonly ROLE_KEY = 'gwf_role';
  private readonly PROFILE_KEY = 'gwf_user_profile';

  requestOtp(mobile: string): Observable<{sent: boolean, expiresIn: number}> {
    if (this.demo.isDemo) {
      return of({ sent: true, expiresIn: 300 }).pipe(delay(500));
    }
    return this.http.post<{sent: boolean, expiresIn: number}>(`${environment.apiBaseUrl}/auth/send-otp`, { mobileNumber: mobile });
  }

  verifyOtp(mobile: string, otp: string): Observable<any> {
    if (this.demo.isDemo) {
      const user = DUMMY_USERS[1]; 
      return of({
        token: 'demo-token',
        refreshToken: 'demo-refresh-token',
        userId: user.id,
        role: user.role,
        profile: user
      }).pipe(
        delay(500),
        tap(res => this.setSession(res))
      );
    }
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/verify-otp`, { mobileNumber: mobile, otpCode: otp }).pipe(
      tap(res => this.setSession(res.data))
    );
  }

  register(payload: any): Observable<User> {
    if (this.demo.isDemo) {
      return of({
        ...DUMMY_USERS[1],
        ...payload,
        id: 'U' + Math.floor(Math.random() * 1000),
        dailyStreakCount: 0,
        totalSessionsPlayed: 0,
        active: true,
        registrationDate: new Date().toISOString().split('T')[0]
      } as User).pipe(delay(1000));
    }
    return this.http.post<User>(`${environment.apiBaseUrl}/auth/register`, payload);
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http.post<any>(`${environment.apiBaseUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, res.data.refreshToken);
        }
      })
    );
  }

  setSession(res: any) {
    localStorage.setItem(this.TOKEN_KEY, res.token || res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    }
    localStorage.setItem(this.USER_ID_KEY, String(res.userId));
    localStorage.setItem(this.ROLE_KEY, res.role);

    if (res.profile) {
       localStorage.setItem(this.PROFILE_KEY, JSON.stringify(res.profile));
    }
  }

  loginAsDemo(user: User) {
    const res = {
      token: 'demo-token-' + user.role,
      refreshToken: 'demo-refresh-token-' + user.role,
      userId: user.id,
      role: user.role,
      profile: user
    };
    this.setSession(res);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): User | null {
    const profile = localStorage.getItem(this.PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}

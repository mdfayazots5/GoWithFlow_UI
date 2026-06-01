import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { User } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'gwf_token';
  private readonly REFRESH_TOKEN_KEY = 'gwf_refreshToken';
  private readonly USER_ID_KEY = 'gwf_userId';
  private readonly ROLE_KEY = 'gwf_role';
  private readonly USER_KEY = 'gwf_user';
  private readonly PROFILE_KEY = 'gwf_user_profile';

  login(mobile: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/login`, { mobileNumber: mobile, password }).pipe(
      tap(res => this.setSession(res.data))
    );
  }

  register(payload: any): Observable<User> {
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
    const user = {
      id: String(res.userId ?? res.user?.id ?? ''),
      fullName: res.fullName ?? res.user?.fullName ?? res.profile?.fullName ?? '',
      mobileNumber: res.mobileNumber ?? res.user?.mobileNumber ?? res.profile?.mobileNumber ?? '',
      email: res.email ?? res.user?.email ?? res.profile?.email ?? '',
      role: res.role ?? res.user?.role ?? res.profile?.role ?? '',
      avatarUrl: res.avatarUrl ?? res.user?.avatarUrl ?? res.profile?.avatarUrl ?? null
    };

    localStorage.setItem(this.TOKEN_KEY, res.token || res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    }
    localStorage.setItem(this.USER_ID_KEY, user.id);
    localStorage.setItem(this.ROLE_KEY, user.role);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(res.profile ?? user));
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): User | null {
    const profile = localStorage.getItem(this.PROFILE_KEY);
    const user = localStorage.getItem(this.USER_KEY);
    return JSON.parse(profile ?? user ?? 'null');
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

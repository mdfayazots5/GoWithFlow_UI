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
    localStorage.setItem(this.TOKEN_KEY, res.token || res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    }
    localStorage.setItem(this.USER_ID_KEY, String(res.userId ?? res.user?.id ?? ''));
    localStorage.setItem(this.ROLE_KEY, res.role ?? res.user?.role ?? '');

    if (res.profile) {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(res.profile));
    }
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';

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
    localStorage.setItem('gwf_token', res.accessToken);
    localStorage.setItem('gwf_refreshToken', res.refreshToken);
    localStorage.setItem('gwf_userId', String(res.userId ?? res.user?.id ?? ''));
    localStorage.setItem('gwf_role', res.role ?? res.user?.role ?? '');
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('gwf_refreshToken');
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/refresh-token`, { refreshToken }).pipe(
      map(res => res.data),
      tap(res => this.setSession(res))
    );
  }

  getRole(): string | null {
    return localStorage.getItem('gwf_role');
  }

  get currentUser(): User | null {
    const user = localStorage.getItem('gwf_user');
    return user ? JSON.parse(user) : null;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('gwf_token');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}

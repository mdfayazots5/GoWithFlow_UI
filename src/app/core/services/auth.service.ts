import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, delay } from 'rxjs';
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
    if (environment.isDemo) return of({ message: 'OTP Sent' }).pipe(delay(500));
    return this.http.post(`${environment.apiBaseUrl}/auth/request-otp`, { mobileNumber });
  }

  verifyOtp(mobileNumber: string, code: string): Observable<any> {
    if (environment.isDemo) {
      // Simulate existing USER for demo mode
      const res = {
        accessToken: 'dummy-jwt',
        refreshToken: 'dummy-refresh',
        user: { id: 'U001', fullName: 'Ravi Kumar', role: 'USER', mobileNumber: '+919876543210' }
      };
      this.setSession(res);
      return of(res).pipe(delay(500));
    }
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/verify-otp`, { mobileNumber, code }).pipe(
      tap(res => {
        if (!res.isRegistrationRequired) {
          this.setSession(res);
        }
      })
    );
  }

  private setSession(res: any) {
    localStorage.setItem('gwf_token', res.accessToken);
    localStorage.setItem('accessToken', res.accessToken); // Added for SignalR compatibility
    localStorage.setItem('gwf_refresh_token', res.refreshToken);
    localStorage.setItem('gwf_user', JSON.stringify(res.user));
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('gwf_refresh_token');
    return this.http.post(`${environment.apiBaseUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(res => this.setSession(res))
    );
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

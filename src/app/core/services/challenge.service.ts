import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/challenge`;

  getActiveChallenge(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/active`).pipe(map(r => r.data));
  }

  submitAttempt(challengeId: number, score: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/attempt`, { challengeId, score });
  }

  setWeeklyChallenge(scriptId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/set-weekly`, { scriptId });
  }
}

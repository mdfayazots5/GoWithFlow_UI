import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'ADMIN' | 'USER';
  streak: number;
  sessionsCount: number;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  updateProfile(payload: any): Observable<UserProfile> {
    if (environment.isDemo) return of({ ...payload, id: 'U001', streak: 7, sessionsCount: 23 }).pipe(delay(800));
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, payload);
  }

  uploadAvatar(file: File): Observable<any> {
    if (environment.isDemo) return of({ url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo' }).pipe(delay(1000));
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/profile/avatar`, formData);
  }

  getImprovementData(): Observable<any> {
    if (environment.isDemo) {
      return of({
        weeklyProgress: [
          { day: 'Mon', score: 65 },
          { day: 'Tue', score: 72 },
          { day: 'Wed', score: 68 },
          { day: 'Thu', score: 85 },
          { day: 'Fri', score: 90 },
          { day: 'Sat', score: 88 },
          { day: 'Sun', score: 94 }
        ],
        totalImprovement: '+28%'
      }).pipe(delay(600));
    }
    return this.http.get(`${this.baseUrl}/progress`);
  }

  getStreak(): Observable<any> {
    if (environment.isDemo) return of({ streak: 7, lastActivity: '2024-03-15' }).pipe(delay(300));
    return this.http.get(`${this.baseUrl}/streak`);
  }

  getBadges(): Observable<any[]> {
    if (environment.isDemo) {
      return of([
        { id: 'B1', name: 'Early Bird', icon: 'Sun', description: 'Practice before 8 AM' },
        { id: 'B2', name: 'Streak Master', icon: 'Flame', description: '7-day streak achieved' },
        { id: 'B3', name: 'Polite Speaker', icon: 'Smile', description: 'Used "Please" and "Thank you" 50 times' }
      ]).pipe(delay(500));
    }
    return this.http.get<any[]>(`${this.baseUrl}/badges`);
  }

  getGrammarProgress(): Observable<any[]> {
    if (environment.isDemo) {
      return of([
        { label: 'Have Been', progress: 75 },
        { label: 'Was/Were', progress: 90 },
        { label: 'Did/Didn\'t', progress: 60 }
      ]).pipe(delay(500));
    }
    return this.http.get<any[]>(`${this.baseUrl}/grammar-progress`);
  }

  getRepracticeHistory(): Observable<any[]> {
    if (environment.isDemo) {
      return of([
        { id: 'R1', title: 'Office Basics', date: '2024-03-15', score: 85 },
        { id: 'R2', title: 'Kitchen Talk', date: '2024-03-14', score: 92 }
      ]).pipe(delay(500));
    }
    return this.http.get<any[]>(`${this.baseUrl}/repractice-history`);
  }

  getSessionDetail(sessionId: string): Observable<any> {
    if (environment.isDemo) {
      return of({
        id: sessionId,
        title: 'Family Grammar Practice',
        date: '2024-03-15',
        duration: '15:20',
        score: 88,
        fluencyScore: 88,
        confidenceScore: 92,
        speakingSpeedWpm: 120,
        pauseCount: 4,
        mistakesCount: 3,
        members: ['Ravi', 'Priya', 'Arjun']
      }).pipe(delay(500));
    }
    return this.http.get(`${this.baseUrl}/sessions/${sessionId}/detail`);
  }

  getDashboard(): Observable<any> {
    if (environment.isDemo) {
      return of({
        activeSession: { id: 'S001', title: 'Ongoing Room', joinCode: '482931' },
        pendingRepracticeCount: 12,
        pendingMistakesCount: 5,
        recentSessions: [
          { id: 'S002', title: 'Office Talk', date: '2024-03-14', score: 92 },
          { id: 'S003', title: 'Kitchen Help', date: '2024-03-13', score: 85 }
        ]
      }).pipe(delay(700));
    }
    return this.http.get(`${environment.apiBaseUrl}/dashboard`);
  }
}

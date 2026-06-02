import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

const CONSENT_KEY = 'gwf_audio_archive_consent';

@Injectable({
  providedIn: 'root'
})
export class AudioArchiveService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/users`;

  // ── Consent preference (per-user in localStorage) ──────────────
  getConsent(): boolean {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  }

  setConsent(value: boolean): void {
    localStorage.setItem(CONSENT_KEY, value ? 'true' : 'false');
  }

  // ── API calls ───────────────────────────────────────────────────
  uploadClip(audioBlob: Blob, sessionId: number, turnIndex: number): Observable<any> {
    const formData = new FormData();
    formData.append('file',      audioBlob, `turn_${turnIndex}.webm`);
    formData.append('sessionId', String(sessionId));
    formData.append('turnIndex', String(turnIndex));
    return this.http.post<any>(`${this.baseUrl}/audio-archive`, formData);
  }

  getSessionClips(sessionId: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/sessions/${sessionId}/audio-archive`)
      .pipe(map(r => r.data ?? []));
  }

  deleteClip(archiveId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/audio-archive/${archiveId}`);
  }
}

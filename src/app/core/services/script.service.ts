import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '@env/environment';

export interface Script {
  id: string;
  title: string;
  category: string;
  grammarFocusTag: string;
  targetAgeGroup: string;
  isActive: boolean;
  version: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private baseUrl = `${environment.apiBaseUrl}/scripts`;

  constructor(private http: HttpClient) {}

  getScripts(filters: any): Observable<{ items: Script[], total: number }> {
    if (environment.isDemo) {
      return of({
        items: [
          { id: 'SC001', title: 'Office Prep — Have Been', category: 'Grammar Drill', grammarFocusTag: 'Have Been', targetAgeGroup: 'Adult', isActive: true, version: 1 },
          { id: 'SC002', title: 'Family Kitchen', category: 'Roleplay', grammarFocusTag: 'None', targetAgeGroup: 'All', isActive: true, version: 2 },
          { id: 'SC003', title: 'Coding Interview', category: 'Mock Interview', grammarFocusTag: 'Present Perfect', targetAgeGroup: 'Adult', isActive: false, version: 1 }
        ],
        total: 3
      }).pipe(delay(500));
    }

    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<{ items: Script[], total: number }>(this.baseUrl, { params });
  }

  updateScriptStatus(scriptId: string, isActive: boolean): Observable<any> {
    if (environment.isDemo) return of({ success: true }).pipe(delay(300));
    return this.http.patch(`${this.baseUrl}/status`, { scriptId, isActive });
  }

  getVersionHistory(scriptId: string): Observable<any[]> {
    if (environment.isDemo) {
      return of([
        { version: 2, updatedAt: '2024-03-15', updatedBy: 'Admin' },
        { version: 1, updatedAt: '2024-03-01', updatedBy: 'Admin' }
      ]).pipe(delay(400));
    }
    return this.http.get<any[]>(`${this.baseUrl}/${scriptId}/versions`);
  }

  validateExcel(file: File): Observable<{ isValid: boolean, rows: any[], errors: any[] }> {
    if (environment.isDemo) {
      return of({
        isValid: true,
        rows: [
          { sequenceId: 1, speakerLabel: 'A', englishText: 'Hello', hintText: 'నమస్కారం' },
          { sequenceId: 2, speakerLabel: 'B', englishText: 'How are you?', hintText: 'ఎలా ఉన్నారు?' }
        ],
        errors: []
      }).pipe(delay(1000));
    }
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/validate`, formData);
  }

  uploadScript(file: File, metadata: any): Observable<any> {
    if (environment.isDemo) return of({ success: true, scriptId: 'SC' + Math.floor(Math.random() * 1000) }).pipe(delay(1500));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    return this.http.post<any>(`${this.baseUrl}/upload`, formData);
  }

  getSampleTemplate(): Observable<any> {
    if (environment.isDemo) return of({ url: '#' }).pipe(delay(200));
    return this.http.get(`${this.baseUrl}/sample-template`);
  }
}

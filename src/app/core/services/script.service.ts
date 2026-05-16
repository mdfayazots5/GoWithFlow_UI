// File: src/app/core/services/script.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '@env/environment';
import { 
  Script, 
  PagedResult, 
  ValidationResult, 
  ScriptUploadResponse, 
  ScriptVersion 
} from '@core/models/script.model';
import { DUMMY_SCRIPTS } from '@data/dummy/script.dummy';

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/scripts`;

  getScripts(filters?: any): Observable<PagedResult<Script>> {
    if (environment.isDemo) {
      let filtered = [...DUMMY_SCRIPTS];
      if (filters) {
        if (filters.category) {
          filtered = filtered.filter((s: Script) => s.category === filters.category);
        }
        if (filters.grammarFocusTag) {
          filtered = filtered.filter((s: Script) => s.grammarFocusTag === filters.grammarFocusTag);
        }
        if (filters.targetAgeGroup) {
          filtered = filtered.filter((s: Script) => s.targetAgeGroup === filters.targetAgeGroup);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter((s: Script) => s.scriptTitle.toLowerCase().includes(search));
        }
      }
      return of({
        items: filtered,
        total: filtered.length
      }).pipe(delay(500));
    }

    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(map(res => res.data as PagedResult<Script>));
  }

  getScriptById(id: string): Observable<Script> {
    if (environment.isDemo) {
      const script = DUMMY_SCRIPTS.find((s: Script) => s.id === id) || DUMMY_SCRIPTS[0];
      return of(script).pipe(delay(300));
    }
    return this.http.get<Script>(`${this.baseUrl}/${id}`);
  }

  validateExcel(file: File): Observable<ValidationResult> {
    if (environment.isDemo) {
      return of({
        isValid: true,
        rows: [
          { sequenceId: 1, speakerLabel: 'A', englishText: 'Hello', hintText: 'నమస్కారం', grammarTag: 'Greeting', contextTag: 'General' },
          { sequenceId: 2, speakerLabel: 'B', englishText: 'How are you?', hintText: 'ఎలా ఉన్నారు?', grammarTag: 'Question', contextTag: 'General' }
        ],
        errors: []
      }).pipe(delay(1000));
    }
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/validate`, formData).pipe(
      map(res => ({
        isValid: res.data.isValid,
        rows: res.data.validRows,
        errors: (res.data.errorRows ?? []).map((e: any) => `Row ${e.rowNumber} — ${e.columnName}: ${e.errorMessage}`)
      } as ValidationResult))
    );
  }

  uploadScript(file: File, metadata: any): Observable<ScriptUploadResponse> {
    if (environment.isDemo) {
      return of({
        success: true,
        scriptId: 'SC' + Math.floor(Math.random() * 1000),
        version: 1
      }).pipe(delay(1500));
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scriptTitle', metadata.scriptTitle);
    formData.append('category', metadata.category);
    formData.append('grammarFocusTag', metadata.grammarFocusTag);
    formData.append('contextTag', metadata.contextTag);
    formData.append('complexityLevel', String(metadata.complexityLevel));
    formData.append('targetAgeGroup', metadata.targetAgeGroup);
    formData.append('hintLanguage', metadata.hintLanguage);
    return this.http.post<any>(`${this.baseUrl}/upload`, formData).pipe(map(res => res.data as ScriptUploadResponse));
  }

  getSampleTemplate(): Observable<Blob> {
    if (environment.isDemo) {
      // In a real app, this would be an actual file in assets
      return of(new Blob(['dummy excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).pipe(delay(500));
    }
    return this.http.get(`${this.baseUrl}/sample-template`, { responseType: 'blob' });
  }

  updateScriptStatus(payload: { scriptId: number, isActive: boolean }): Observable<any> {
    if (environment.isDemo) {
      return of(true).pipe(delay(300));
    }
    return this.http.patch<any>(`${this.baseUrl}/status`, payload);
  }

  getVersionHistory(scriptId: string): Observable<ScriptVersion[]> {
    if (environment.isDemo) {
      return of([
        { version: 2, updatedAt: '2024-05-15T10:00:00Z', updatedBy: 'Admin' },
        { version: 1, updatedAt: '2024-05-01T09:00:00Z', updatedBy: 'Admin' }
      ]).pipe(delay(400));
    }
    return this.http.get<ScriptVersion[]>(`${this.baseUrl}/${scriptId}/versions`);
  }
}

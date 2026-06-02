import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Script,
  PagedResult,
  ValidationResult,
  ScriptUploadResponse,
  ScriptVersion
} from '@core/models/script.model';

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/scripts`;

  getScripts(filters?: any): Observable<PagedResult<Script>> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        const data = res.data;
        return {
          ...data,
          total:      data.totalCount,
          totalCount: data.totalCount,
          items: (data.items ?? []).map((item: any) => ({
            ...item,
            id:     String(item.scriptId),
            active: item.isActive,
          }))
        } as PagedResult<Script>;
      })
    );
  }

  getScriptById(id: string): Observable<Script> {
    return this.http.get<Script>(`${this.baseUrl}/${id}`);
  }

  validateExcel(file: File): Observable<ValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/validate`, formData).pipe(
      map(res => ({
        isValid: res.data.isValid,
        totalRows: res.data.totalRows,
        validCount: res.data.validCount,
        errorCount: res.data.errorCount,
        rows: res.data.validRows,
        errors: (res.data.errorRows ?? []).map((e: any) => `Row ${e.rowNumber} — ${e.columnName}: ${e.errorMessage}`)
      } as ValidationResult))
    );
  }

  uploadScript(file: File, metadata: any): Observable<ScriptUploadResponse> {
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

  getSampleTemplate(category?: string): Observable<Blob> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get(`${this.baseUrl}/sample-template${params}`, { responseType: 'blob' });
  }

  downloadScript(scriptId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${scriptId}/download`, { responseType: 'blob' });
  }

  updateScriptStatus(payload: { scriptId: number, isActive: boolean }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/status`, payload);
  }

  getVersionHistory(scriptId: string): Observable<ScriptVersion[]> {
    return this.http.get<ScriptVersion[]>(`${this.baseUrl}/${scriptId}/versions`);
  }

  getScriptDetail(scriptId: number | string): Observable<any> {
    return this.http.get<{ data: any }>(`${this.baseUrl}/${scriptId}`).pipe(map(r => r.data));
  }

  getScriptAnalytics(category?: string): Observable<any[]> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/analytics${params}`).pipe(map(r => r.data));
  }

  getPromptData(category: string): Observable<any> {
    return this.http.get<{ data: any }>(`${this.baseUrl}/prompt-data?category=${encodeURIComponent(category)}`).pipe(map(r => r.data));
  }

  rollbackScriptVersion(scriptId: number, version: number): Observable<any> {
    return this.http.post<{ data: any }>(`${this.baseUrl}/${scriptId}/rollback?version=${version}`, {}).pipe(map(r => r.data));
  }

  duplicateScript(scriptId: number): Observable<any> {
    return this.http.post<{ data: any }>(`${this.baseUrl}/${scriptId}/duplicate`, {}).pipe(map(r => r.data));
  }
}

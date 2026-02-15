import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CodeReference } from '../tickets/ticket.model';
import { ApiResponse } from '../shared/models/api-response.model';

interface ClassInfo {
  name: string;
  super: string;
}

interface MethodInfo {
  name: string;
  classMethod: boolean;
  returnType: string;
}

@Injectable({ providedIn: 'root' })
export class CodeReferenceService {
  private http = inject(HttpClient);

  listClasses(search?: string): Observable<ClassInfo[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http
      .get<ApiResponse<ClassInfo[]>>(`${environment.apiBaseUrl}/classes`, { params })
      .pipe(map((r) => r.data));
  }

  listMethods(className: string): Observable<MethodInfo[]> {
    return this.http
      .get<ApiResponse<MethodInfo[]>>(`${environment.apiBaseUrl}/classes/${className}/methods`)
      .pipe(map((r) => r.data));
  }

  addCodeReference(ticketId: string, className: string, methodName?: string): Observable<CodeReference> {
    const body: Record<string, string> = { className };
    if (methodName) {
      body['methodName'] = methodName;
    }
    return this.http
      .post<ApiResponse<CodeReference>>(`${environment.apiBaseUrl}/tickets/${ticketId}/code-references`, body)
      .pipe(map((r) => r.data));
  }

  removeCodeReference(ticketId: string, refId: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiBaseUrl}/tickets/${ticketId}/code-references/${refId}`);
  }
}

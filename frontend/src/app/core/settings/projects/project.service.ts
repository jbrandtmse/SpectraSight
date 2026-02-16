import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { Project, CreateProjectRequest, UpdateProjectRequest } from './project.model';
import { ApiResponse, ApiListResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private projectsSignal = signal<Project[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly projects = this.projectsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadProjects(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<ApiListResponse<Project>>(`${environment.apiBaseUrl}/projects`)
      .subscribe({
        next: (response) => {
          this.projectsSignal.set(response.data);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err?.error?.error?.message || 'Failed to load projects');
          this.loadingSignal.set(false);
        },
      });
  }

  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.http
      .post<ApiResponse<Project>>(`${environment.apiBaseUrl}/projects`, data)
      .pipe(
        map((response) => {
          this.loadProjects();
          this.snackBar.open('Project created', '', { duration: 3000 });
          return response.data;
        })
      );
  }

  updateProject(id: number, data: UpdateProjectRequest): Observable<Project> {
    return this.http
      .put<ApiResponse<Project>>(`${environment.apiBaseUrl}/projects/${id}`, data)
      .pipe(
        map((response) => {
          this.loadProjects();
          this.snackBar.open('Project updated', '', { duration: 3000 });
          return response.data;
        })
      );
  }

  deleteProject(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiBaseUrl}/projects/${id}`)
      .pipe(
        map(() => {
          this.loadProjects();
          this.snackBar.open('Project deleted', '', { duration: 3000 });
        })
      );
  }
}

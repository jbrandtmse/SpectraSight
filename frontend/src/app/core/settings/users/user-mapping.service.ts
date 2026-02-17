import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { UserMapping, CreateUserRequest, UpdateUserRequest } from './user-mapping.model';
import { ApiResponse, ApiListResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UserMappingService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private usersSignal = signal<UserMapping[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private loaded = false;

  readonly users = this.usersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly activeUsers = computed(() => this.users().filter((u) => u.isActive));
  readonly activeUserNames = computed(() => this.activeUsers().map((u) => u.displayName));

  loadUsers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<ApiListResponse<UserMapping>>(`${environment.apiBaseUrl}/users`)
      .subscribe({
        next: (response) => {
          this.usersSignal.set(response.data);
          this.loadingSignal.set(false);
          this.loaded = true;
        },
        error: (err) => {
          this.errorSignal.set(err?.error?.error?.message || 'Failed to load users');
          this.loadingSignal.set(false);
        },
      });
  }

  ensureLoaded(): void {
    if (!this.loaded && !this.loading()) {
      this.loadUsers();
    }
  }

  findByIrisUsername(irisUsername: string): UserMapping | undefined {
    return this.users().find(
      (u) => u.irisUsername.toLowerCase() === irisUsername.toLowerCase()
    );
  }

  createUser(data: CreateUserRequest): Observable<UserMapping> {
    return this.http
      .post<ApiResponse<UserMapping>>(`${environment.apiBaseUrl}/users`, data)
      .pipe(
        map((response) => {
          this.loadUsers();
          this.snackBar.open('User created', '', { duration: 3000 });
          return response.data;
        })
      );
  }

  updateUser(id: number, data: UpdateUserRequest): Observable<UserMapping> {
    return this.http
      .put<ApiResponse<UserMapping>>(`${environment.apiBaseUrl}/users/${id}`, data)
      .pipe(
        map((response) => {
          this.loadUsers();
          this.snackBar.open('User updated', '', { duration: 3000 });
          return response.data;
        })
      );
  }

  deleteUser(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiBaseUrl}/users/${id}`)
      .pipe(
        map(() => {
          this.loadUsers();
          this.snackBar.open('User deleted', '', { duration: 3000 });
        })
      );
  }
}

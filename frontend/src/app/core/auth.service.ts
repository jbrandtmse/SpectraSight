import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private username = '';
  private password = '';

  isLoggedIn = signal(false);

  login(username: string, password: string): Observable<boolean> {
    this.username = username;
    this.password = password;

    return this.http
      .get(`${environment.apiBaseUrl}/tickets`, {
        params: { pageSize: '1' },
        headers: { Authorization: this.getAuthHeader() },
      })
      .pipe(
        map(() => {
          this.isLoggedIn.set(true);
          return true;
        }),
        catchError(() => {
          this.clearCredentials();
          return of(false);
        })
      );
  }

  logout(): void {
    this.clearCredentials();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getAuthHeader(): string {
    return 'Basic ' + btoa(this.username + ':' + this.password);
  }

  getUsername(): string {
    return this.username;
  }

  private clearCredentials(): void {
    this.username = '';
    this.password = '';
    this.isLoggedIn.set(false);
  }
}

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

  constructor() {
    this.restoreSession();
  }

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
          sessionStorage.setItem('ss_user', username);
          sessionStorage.setItem('ss_pass', password);
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

  private restoreSession(): void {
    const user = sessionStorage.getItem('ss_user');
    const pass = sessionStorage.getItem('ss_pass');
    if (user && pass) {
      this.username = user;
      this.password = pass;
      this.isLoggedIn.set(true);
    }
  }

  private clearCredentials(): void {
    this.username = '';
    this.password = '';
    sessionStorage.removeItem('ss_user');
    sessionStorage.removeItem('ss_pass');
    this.isLoggedIn.set(false);
  }
}

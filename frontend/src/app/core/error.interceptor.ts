import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiError } from '../shared/models/api-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      // Skip error handling for login validation requests -- login component handles its own errors
      if (!authService.isAuthenticated() && error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        authService.logout();
        snackBar.open('Session expired. Please log in again.', 'Dismiss', {
          duration: 5000,
          panelClass: ['ss-error-snackbar'],
        });
      } else {
        const apiError = error.error as ApiError | undefined;
        const message =
          apiError?.error?.message || 'An unexpected error occurred';
        snackBar.open(message, 'Dismiss', {
          duration: 5000,
          panelClass: ['ss-error-snackbar'],
        });
      }

      return throwError(() => error);
    })
  );
};

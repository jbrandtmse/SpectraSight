import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated() && req.url.startsWith(environment.apiBaseUrl)) {
    const authReq = req.clone({
      setHeaders: { Authorization: authService.getAuthHeader() },
    });
    return next(authReq);
  }

  return next(req);
};

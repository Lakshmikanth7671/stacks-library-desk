import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService); const router = inject(Router);
  const t = auth.token;
  return next(t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req).pipe(
    catchError(e => {
      if (e.status === 401 && !req.url.endsWith('/login')) { auth.logout(); router.navigate(['/login']); }
      return throwError(() => new Error(e.error?.message ?? 'Cannot reach the server. Is the API running?'));
    }));
};
export const authGuard: CanActivateFn = () => inject(AuthService).user() ? true : inject(Router).parseUrl('/login');
export const adminGuard: CanActivateFn = () => inject(AuthService).isAdmin() ? true : inject(Router).parseUrl('/dashboard');

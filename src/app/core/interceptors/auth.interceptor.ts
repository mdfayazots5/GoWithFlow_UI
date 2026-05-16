import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@env/environment';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  
  if (environment.isDemo) return next(req);

  const token = localStorage.getItem('gwf_token');
  let authReq = req;

  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 - Unauthorized (Token expired)
      if (error.status === 401 && !authReq.url.includes('/auth/refresh-token')) {
        return authService.refreshToken().pipe(
          switchMap((res: any) => {
            const newAuthReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(newAuthReq);
          }),
          catchError((err) => {
            authService.logout();
            return throwError(() => err);
          })
        );
      }

      // Handle other error codes
      let errorMessage = 'An unexpected error occurred';
      if (error.error && error.error.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.join(', ');
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }

      switch (error.status) {
        case 403:
          toastService.error('Not authorized to perform this action');
          break;
        case 409:
          toastService.warning(errorMessage || 'This record already exists');
          break;
        case 422:
          toastService.error(errorMessage || 'Business rule violation');
          break;
        case 500:
          toastService.error('Server error. Please try again later.');
          break;
        case 0:
          toastService.error('Cannot connect to server. Check your internet.');
          break;
      }

      return throwError(() => error);
    })
  );
};

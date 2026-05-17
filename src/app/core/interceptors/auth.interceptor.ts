import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const token = localStorage.getItem('gwf_token');
  let authReq = req;

  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 - Unauthorized (Token expired)
      const isAuthEndpoint = authReq.url.includes('/auth/send-otp') || authReq.url.includes('/auth/verify-otp');
      if (error.status === 401 && !isAuthEndpoint && !authReq.url.includes('/auth/refresh-token') && !authReq.url.includes('/auth/login')) {
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
      } else if (error.status === 401) {
        authService.logout();
        return throwError(() => error);
      }

      // Handle other error codes
      let errorMessage = 'An unexpected error occurred';
      const wrapperResponse = error.error;
      
      if (wrapperResponse && wrapperResponse.errors && Array.isArray(wrapperResponse.errors) && wrapperResponse.errors.length > 0) {
        errorMessage = wrapperResponse.errors.join(', ');
      } else if (wrapperResponse && wrapperResponse.message) {
        errorMessage = wrapperResponse.message;
      }

      switch (error.status) {
        case 403:
          toastService.warning('Not authorized to perform this action.');
          break;
        case 409:
          toastService.warning(errorMessage || 'This record already exists');
          break;
        case 422:
          toastService.error(errorMessage || 'Validation error');
          break;
        case 500:
          toastService.error('Server error. Please try again later.');
          break;
        case 0:
          toastService.error('Cannot connect to server.');
          break;
        default:
          if (error.status >= 400) {
            toastService.error(errorMessage);
          }
      }

      return throwError(() => error);
    })
  );
};

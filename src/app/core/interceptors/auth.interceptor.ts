import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const token = localStorage.getItem('gwf_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthUrl =
        req.url.includes('/auth/refresh-token') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/send-otp') ||
        req.url.includes('/auth/verify-otp');

      if (error.status === 401 && !isAuthUrl) {
        return handle401(req, next, authService, toastService);
      }

      // Surface meaningful error messages for non-401 errors
      if (error.status !== 401) {
        const body = error.error;
        const msg =
          (body?.errors && Array.isArray(body.errors) && body.errors.length > 0)
            ? body.errors.join(', ')
            : body?.message ?? 'An unexpected error occurred';

        switch (error.status) {
          case 403: toastService.warning('Not authorized to perform this action.'); break;
          case 409: toastService.warning(msg || 'This record already exists'); break;
          case 422: toastService.error(msg || 'Validation error'); break;
          case 500: toastService.error('Server error. Please try again later.'); break;
          case 0:   toastService.error('Cannot connect to server.'); break;
          default:
            if (error.status >= 400) toastService.error(msg);
        }
      }

      return throwError(() => error);
    })
  );
};

function handle401(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService, toastService: ToastService): Observable<any> {
  if (isRefreshing) {
    // Queue behind the in-flight refresh
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(newToken =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
      )
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap((res: any) => {
      isRefreshing = false;
      const newToken: string = res.accessToken;
      refreshTokenSubject.next(newToken);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshTokenSubject.next(null);
      authService.logout();
      return throwError(() => err);
    })
  );
}

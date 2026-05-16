import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  if (environment.isDemo) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) {
    const user = auth.currentUser;
    // Basic role check for admin routes
    if (state.url.startsWith('/admin') && user?.role !== 'ADMIN') {
      router.navigate(['/user/dashboard']);
      return false;
    }
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

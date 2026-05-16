import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@env/environment';

export const sessionGuard: CanActivateFn = (route) => {
  if (environment.isDemo) return true;

  const router = inject(Router);
  const token = localStorage.getItem('gwf_token');
  const sessionId = route.paramMap.get('sessionId');

  if (token && sessionId) return true;

  router.navigate(['/session/join']);
  return false;
};

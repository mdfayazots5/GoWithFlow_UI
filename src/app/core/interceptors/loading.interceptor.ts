// File: src/app/core/interceptors/loading.interceptor.ts
// Counts foreground HTTP requests into HttpActivityService so the top progress bar can
// reflect ambient network activity. Background/streaming/polling calls are skipped so they
// never trigger the bar (which would flicker).
//
// To opt a request OUT, add the header `X-Background: true` (stripped before it leaves).
import { HttpInterceptorFn, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpActivityService } from '@core/services/http-activity.service';

/** Per-request opt-out usable from services: `http.get(url, { context: withBackground() })`. */
export const BACKGROUND_REQUEST = new HttpContextToken<boolean>(() => false);
export function withBackground(): HttpContext {
  return new HttpContext().set(BACKGROUND_REQUEST, true);
}

// URL fragments that are inherently background/streaming and must not drive the bar.
const BACKGROUND_URL_PATTERNS = [
  '/hubs/',          // SignalR
  'negotiate',       // SignalR negotiate
  '/voice',          // voice streaming / analysis
  '/audio',          // audio clip upload
];

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const activity = inject(HttpActivityService);

  const isBackground =
    req.context.get(BACKGROUND_REQUEST) ||
    req.headers.has('X-Background') ||
    BACKGROUND_URL_PATTERNS.some(p => req.url.includes(p));

  if (isBackground) {
    // Strip the marker header so it doesn't reach the server / CORS preflight.
    const cleaned = req.headers.has('X-Background')
      ? req.clone({ headers: req.headers.delete('X-Background') })
      : req;
    return next(cleaned);
  }

  activity.increment();
  return next(req).pipe(finalize(() => activity.decrement()));
};

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';

// Routes where back navigation is intentionally blocked.
// These are active-session screens where an accidental back press must not exit.
const BLOCKED_ROUTES = ['/live-session/room', '/repractice/'];

// Routes treated as app roots — back press here exits the app.
const ROOT_ROUTES = ['/auth/login', '/user/dashboard', '/admin/dashboard'];

@Injectable({ providedIn: 'root' })
export class BackButtonService {
  private router   = inject(Router);
  private location = inject(Location);

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const { App } = await import('@capacitor/app');

    App.addListener('backButton', ({ canGoBack }) => {
      const url = this.router.url;

      // Active session screens: swallow the back press entirely.
      if (BLOCKED_ROUTES.some(r => url.startsWith(r))) return;

      // Root screens or no history left: exit the app.
      if (!canGoBack || ROOT_ROUTES.some(r => url === r || url.startsWith(r + '?'))) {
        App.exitApp();
        return;
      }

      // All other screens: navigate to the previous entry in browser history.
      this.location.back();
    });
  }
}

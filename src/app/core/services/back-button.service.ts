import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { filter } from 'rxjs';

// Screens where a back press must be swallowed — accidental exit during active use.
const BLOCKED_ROUTES = ['/live-session/room', '/repractice/'];

// Screens treated as app roots — back press here exits the app.
const ROOT_ROUTES = ['/auth/login', '/user/dashboard', '/admin/dashboard'];

/**
 * Centralised Android hardware-back-button handler.
 *
 * Design:
 *  - Maintains its own Angular-level navigation history via NavigationEnd events.
 *    This is intentionally independent of the browser's native history stack, which
 *    is unreliable in Capacitor SPAs (auth-guard replaceUrl redirects collapse
 *    entries; window.location.href resets it entirely).
 *  - On back press, pops the current URL and navigates explicitly to the previous
 *    one via router.navigateByUrl() — no reliance on location.back().
 *  - Guarded by `initialized` flag so that Vite HMR (which re-creates AppComponent
 *    on every file save) cannot register duplicate listeners on the same singleton.
 *    Duplicate listeners were the primary cause of double location.back() calls that
 *    skipped past /user/dashboard and closed the app unexpectedly.
 */
@Injectable({ providedIn: 'root' })
export class BackButtonService {
  private router = inject(Router);

  // Self-managed Angular navigation history. Populated by NavigationEnd events.
  private navHistory: string[] = [];

  // Prevents duplicate App.addListener calls on the same service instance.
  private initialized = false;

  constructor() {
    // Track every completed Angular navigation. Deduplicate consecutive identical
    // URLs (e.g. router.navigate to the same route you're already on).
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
      if (this.navHistory[this.navHistory.length - 1] !== url) {
        this.navHistory.push(url);
      }
      if (Capacitor.isNativePlatform()) {
        console.log(`[BackNav] navigated → ${url} | stack (${this.navHistory.length}): [${this.navHistory.join(' → ')}]`);
      }
    });
  }

  async init(): Promise<void> {
    if (this.initialized || !Capacitor.isNativePlatform()) return;
    this.initialized = true;

    const { App } = await import('@capacitor/app');

    App.addListener('backButton', () => {
      const url = this.router.url;
      console.log(`[BackNav] back pressed | current: ${url} | stack (${this.navHistory.length}): [${this.navHistory.join(' → ')}]`);

      // ── Blocked screens: swallow back entirely ─────────────────────────
      if (BLOCKED_ROUTES.some(r => url.startsWith(r))) {
        console.log('[BackNav] blocked route — back suppressed');
        return;
      }

      // ── Root screens: exit the app ─────────────────────────────────────
      if (ROOT_ROUTES.some(r => url === r || url.startsWith(r + '?'))) {
        console.log('[BackNav] root route — exiting app');
        App.exitApp();
        return;
      }

      // ── All other screens: navigate to previous tracked route ──────────
      this.navigateBack(url, App);
    });

    console.log('[BackNav] initialised (listener registered once)');
  }

  private navigateBack(currentUrl: string, App: any): void {
    // Remove trailing entries that match the current URL (handles edge cases where
    // the same URL was pushed more than once before back was pressed).
    while (
      this.navHistory.length > 0 &&
      this.navHistory[this.navHistory.length - 1] === currentUrl
    ) {
      this.navHistory.pop();
    }

    const destination = this.navHistory[this.navHistory.length - 1];
    console.log(`[BackNav] navigating back to: ${destination ?? '(fallback)'}`);

    if (destination) {
      this.router.navigateByUrl(destination);
    } else {
      // History exhausted — safest fallback for a USER role. Admin would not reach
      // this path because /admin/dashboard is in ROOT_ROUTES and exits first.
      console.log('[BackNav] history empty — falling back to /user/dashboard');
      this.router.navigate(['/user/dashboard']);
    }
  }
}

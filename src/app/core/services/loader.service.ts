import { Injectable, signal } from '@angular/core';

/**
 * Drives the full-screen branded loader (`app-loader`). Use ONLY for blocking, full-page
 * operations where the user should not interact until it completes — initial app bootstrap,
 * login/redirect, and route data that must finish before a screen is usable.
 *
 * For in-page data sections use skeletons (`@shared/ui/skeleton`) + `app-loading-state`.
 * For ambient background request activity the top progress bar handles it automatically —
 * do NOT call show()/hide() for ordinary list/detail fetches (that causes full-screen flicker).
 *
 * Reference-counted so overlapping blocking operations don't hide the loader prematurely.
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly isLoading = signal<boolean>(false);
  readonly message = signal<string>('Syncing your flow…');

  private _count = 0;

  show(message?: string): void {
    if (message) this.message.set(message);
    this._count++;
    this.isLoading.set(true);
  }

  hide(): void {
    this._count = Math.max(0, this._count - 1);
    if (this._count === 0) this.isLoading.set(false);
  }

  /** Force-clear regardless of ref count (e.g. on hard navigation/route error). */
  reset(): void {
    this._count = 0;
    this.isLoading.set(false);
  }
}

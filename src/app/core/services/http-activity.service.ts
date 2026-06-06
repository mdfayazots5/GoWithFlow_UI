import { Injectable, signal, computed } from '@angular/core';

/**
 * Tracks in-flight HTTP requests (foreground only) so ambient UI — the top progress bar —
 * can reflect network activity WITHOUT blocking the page. This is the non-intrusive layer
 * that keeps slow networks from feeling frozen, separate from the full-screen LoaderService.
 */
@Injectable({ providedIn: 'root' })
export class HttpActivityService {
  private readonly _pending = signal(0);

  readonly pending = this._pending.asReadonly();
  readonly isActive = computed(() => this._pending() > 0);

  increment(): void {
    this._pending.update(n => n + 1);
  }

  decrement(): void {
    this._pending.update(n => Math.max(0, n - 1));
  }
}

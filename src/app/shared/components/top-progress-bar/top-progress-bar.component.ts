// File: src/app/shared/components/top-progress-bar/top-progress-bar.component.ts
//
// Slim top progress bar — the always-on, NON-blocking ambient loading indicator.
// Shows during route navigation and while foreground HTTP requests are in flight, then
// fades out. Anti-flicker: a request must be active for >120ms before the bar appears, and
// once shown it stays visible for >=400ms so very fast requests don't strobe. Fixed-position
// and 3px tall so it never shifts page layout (Rule 4).
import { Component, inject, signal, effect, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event as RouterEvent } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpActivityService } from '@core/services/http-activity.service';

@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="gwf-topbar" role="progressbar" aria-label="Loading">
        <div class="gwf-topbar__fill"></div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .gwf-topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 3px;
      z-index: 9999;
      background: transparent;
      overflow: hidden;
      pointer-events: none;
    }
    .gwf-topbar__fill {
      height: 100%;
      width: 40%;
      border-radius: 0 3px 3px 0;
      background: linear-gradient(90deg, var(--gwf-primary, #5C35A8), var(--gwf-accent, #E07B39));
      box-shadow: 0 0 8px rgba(92, 53, 168, 0.5);
      animation: gwf-topbar-slide 1.1s ease-in-out infinite;
    }
    @keyframes gwf-topbar-slide {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(120%); }
      100% { transform: translateX(250%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .gwf-topbar__fill { animation-duration: 2.2s; }
    }
  `],
})
export class TopProgressBarComponent implements OnDestroy {
  private router = inject(Router);
  private activity = inject(HttpActivityService);

  readonly visible = signal(false);

  private navigating = signal(false);
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;
  private routerSub: Subscription;

  private static readonly SHOW_DELAY = 120;   // ms a load must persist before the bar shows
  private static readonly MIN_VISIBLE = 400;   // ms the bar stays once shown

  constructor() {
    this.routerSub = this.router.events.subscribe((e: RouterEvent) => {
      if (e instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.navigating.set(false);
      }
    });

    // React to either source of activity.
    effect(() => {
      const active = this.navigating() || this.activity.isActive();
      active ? this.requestShow() : this.requestHide();
    });
  }

  private requestShow(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    if (this.visible() || this.showTimer) return;
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.shownAt = Date.now();
      this.visible.set(true);
    }, TopProgressBarComponent.SHOW_DELAY);
  }

  private requestHide(): void {
    if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
    if (!this.visible() || this.hideTimer) return;
    const elapsed = Date.now() - this.shownAt;
    const wait = Math.max(0, TopProgressBarComponent.MIN_VISIBLE - elapsed);
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.visible.set(false);
    }, wait);
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }
}

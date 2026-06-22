// File: src/app/app.component.ts
import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { TopProgressBarComponent } from '@shared/components/top-progress-bar/top-progress-bar.component';
import { filter } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { BackButtonService } from '@core/services/back-button.service';
import { TabReuseStrategy } from '@core/strategies/tab-reuse.strategy';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    HeaderComponent,
    BottomNavComponent,
    ToastComponent,
    LoaderComponent,
    TopProgressBarComponent
  ],
  template: `
    <app-top-progress-bar></app-top-progress-bar>
    <div class="app-shell">

      <!-- Admin routes: full-screen, no shell chrome -->
      @if (isAdminRoute()) {
        <router-outlet></router-outlet>
      }

      <!-- User / auth routes: header + scrollable content + bottom nav -->
      @if (!isAdminRoute()) {
        @if (showHeader()) {
          <app-header></app-header>
        }

        <div #contentArea class="user-content-area"
             [class.no-bottom-pad]="!showBottomNav()"
             [class.flush]="isFullBleed()">
          <router-outlet></router-outlet>
        </div>

        @if (showBottomNav()) {
          <app-bottom-nav></app-bottom-nav>
        }
      }

      <app-toast></app-toast>
      <app-loader></app-loader>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .app-shell {
      display: flex;
      flex-direction: column;
      /* dvh accounts for mobile browser chrome (address bar) correctly */
      height: 100dvh;
      overflow: hidden;
      background: var(--gwf-bg);
    }

    .user-content-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      /* Single source of the page frame: pages add no px-4/pt-2 and no bottom padding.
         Bottom value clears the fixed bottom nav (68px + safe area) plus a 16px gap. */
      padding: 16px 16px calc(68px + env(safe-area-inset-bottom, 0px) + 16px);
    }

    /* Tablet+ : a wider, more comfortable gutter (UIStandards device matrix). */
    @media (min-width: 768px) {
      .user-content-area {
        padding: 20px 24px calc(68px + env(safe-area-inset-bottom, 0px) + 16px);
      }
    }

    /* Pages inside the user shell must NOT force 100vh — the scroll container already fills the
       space, so a page-level min-h-screen pushes even empty pages past the viewport and scrolls.
       Full-bleed routes (.flush) keep their own full-height layout. */
    .user-content-area:not(.flush) .min-h-screen {
      min-height: 0;
    }

    .user-content-area.no-bottom-pad {
      padding-bottom: 16px;
    }

    /* Full-bleed routes (auth / live-session / repractice) own their entire
       layout and background. Zero shell padding so no light frame shows around
       their full-screen surface and no extra height is added (prevents the
       100dvh page from overflowing into an unwanted scroll). */
    .user-content-area.flush {
      padding: 0;
    }
  `]
})
export class AppComponent {
  private router       = inject(Router);
  private auth         = inject(AuthService);
  private userState    = inject(UserStateService);
  private backButton   = inject(BackButtonService);
  private reuseStrategy = inject(TabReuseStrategy);

  @ViewChild('contentArea') private contentArea?: ElementRef<HTMLDivElement>;

  currentUrl = signal(this.router.url);

  /* Self-contained full-screen routes: no header, no bottom nav, no shell padding. */
  private readonly fullBleedRoutes = ['/auth', '/live-session', '/repractice'];
  // Routes that are full-bleed only in a deeper form. The Listen PLAYER (/scripts/listen/:scriptId)
  // is an immersive music screen with no app header/tab bar — but the Listen PICKER tab
  // (/scripts/listen) must keep the bottom nav, so it is matched by segment depth, not includes().
  private readonly fullBleedPatterns = [/\/scripts\/listen\/[^/?#]+/];

  constructor() {
    this.backButton.init();
    // "Stay logged in": silently refresh an expired access token on app launch so reopening the app
    // the next day lands in the session instead of the login screen (Item 5).
    this.auth.ensureFreshSessionOnStartup();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.url);

      // Scroll the content area to top on every navigation.
      // Uses 'instant' so there's no scroll animation — feels like a native page change.
      this.contentArea?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });

      // Bootstrap common user data once per session (idempotent).
      if (this.auth.isLoggedIn) {
        this.userState.bootstrap();
      }
    });
  }

  isAdminRoute(): boolean {
    return this.currentUrl().includes('/admin');
  }

  isFullBleed(): boolean {
    const url = this.currentUrl();
    return this.fullBleedRoutes.some(path => url.includes(path))
      || this.fullBleedPatterns.some(re => re.test(url));
  }

  showHeader(): boolean {
    const url = this.currentUrl();
    if (!url || url === '/') return false;
    return !this.isFullBleed();
  }

  showBottomNav(): boolean {
    return !this.isFullBleed();
  }
}

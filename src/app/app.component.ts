// File: src/app/app.component.ts
import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
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
    LoaderComponent
  ],
  template: `
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

        <div #contentArea class="user-content-area" [class.no-bottom-pad]="!showBottomNav()">
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
      padding: 16px;
      /* 64px nav + safe area so content never hides behind the bar */
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    .user-content-area.no-bottom-pad {
      padding-bottom: 16px;
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

  constructor() {
    this.backButton.init();
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

  showHeader(): boolean {
    const url = this.currentUrl();
    if (!url || url === '/') return false;
    const hideOn = ['/auth', '/live-session', '/repractice'];
    return !hideOn.some(path => url.includes(path));
  }

  showBottomNav(): boolean {
    const url = this.currentUrl();
    const hideOn = ['/auth', '/live-session', '/repractice'];
    return !hideOn.some(path => url.includes(path));
  }
}

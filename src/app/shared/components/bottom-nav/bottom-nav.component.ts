// File: src/app/shared/components/bottom-nav/bottom-nav.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Home, History, TrendingUp, RefreshCw, Headphones } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

/**
 * A single footer-tab item. `icon` is a Lucide icon object (e.g. `Home`).
 * `exact` controls router-link active matching (true only for index routes).
 */
export interface BottomNavItem {
  label: string;
  path: string;
  icon: any;
  exact?: boolean;
}

/**
 * Shared bottom navigation used by BOTH the User and Admin shells.
 *
 * - User shell: mounted globally with no inputs → uses the default user tabs and
 *   internal role/route gating to decide visibility.
 * - Admin shell: mounted inside the admin layout with `[items]="adminNavItems"`.
 *   When `items` is supplied the host owns placement, so the bar always renders.
 *
 * Both consume the same light design system (white bar, purple active state,
 * Lucide icons) and the same responsive behaviour — there is no second pattern.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, RouterLinkActive],
  template: `
    @if (showNav()) {
      <nav class="bottom-nav" [style.grid-template-columns]="gridTemplate">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            [attr.aria-label]="item.label"
            class="nav-tab"
          >
            <div class="nav-icon-wrap">
              <i-lucide [img]="item.icon" size="22"></i-lucide>
            </div>
            <!-- Label hidden visually (icons-only bar); kept for screen readers. -->
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>
    }
  `,
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  /** Optional explicit tab set (e.g. the admin shell). When omitted, the default
   *  user tabs + role-based visibility are used. */
  @Input() items?: BottomNavItem[];

  private readonly defaultItems: BottomNavItem[] = [
    { label: 'Home',     path: '/user/dashboard',   icon: Home,       exact: true  },
    { label: 'Listen',   path: '/scripts/listen',    icon: Headphones, exact: false },
    { label: 'Review',   path: '/user/my-mistakes',  icon: RefreshCw,  exact: false },
    { label: 'Progress', path: '/user/progress',     icon: TrendingUp, exact: false },
    { label: 'History',  path: '/session/history',   icon: History,    exact: false }
  ];

  get navItems(): BottomNavItem[] {
    return this.items ?? this.defaultItems;
  }

  /** Drives the responsive equal-width grid for any tab count (4 user / 5 admin). */
  get gridTemplate(): string {
    return `repeat(${this.navItems.length}, 1fr)`;
  }

  showNav(): boolean {
    // Host-supplied items (admin shell) → host controls mounting/visibility.
    if (this.items) {
      return true;
    }

    const url    = this.router.url;
    const hideOn = ['/auth', '/live-session', '/repractice', '/admin'];
    const role   = this.auth.getRole();
    return role === 'USER' && !hideOn.some(path => url.includes(path));
  }
}

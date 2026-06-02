// File: src/app/shared/components/bottom-nav/bottom-nav.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Home, History, TrendingUp, AlertCircle } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, RouterLinkActive],
  template: `
    @if (showNav()) {
      <nav class="bottom-nav">
        @for (item of navItems; track item.label) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="nav-tab"
          >
            <div class="nav-icon-wrap">
              <i-lucide [img]="item.icon" size="20"></i-lucide>
            </div>
            <span>{{ item.label }}</span>
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

  navItems = [
    { label: 'Home',     path: '/user/dashboard',  icon: Home,         exact: true  },
    { label: 'History',  path: '/session/history',  icon: History,      exact: false },
    { label: 'Progress', path: '/user/progress',    icon: TrendingUp,   exact: false },
    { label: 'Mistakes', path: '/user/my-mistakes', icon: AlertCircle,  exact: false }
  ];

  showNav(): boolean {
    const url    = this.router.url;
    const hideOn = ['/auth', '/live-session', '/repractice', '/admin'];
    const role   = this.auth.getRole();
    return role === 'USER' && !hideOn.some(path => url.includes(path));
  }
}

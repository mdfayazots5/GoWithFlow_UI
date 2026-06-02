// File: src/app/shared/components/header/header.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Flame } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <header class="app-header">
      <!-- Left: Logo -->
      <div class="header-left">
        <a routerLink="/user/dashboard" class="header-logo italic tracking-tighter no-underline">Go With Flow</a>
      </div>
      <!-- Right: Avatar & Streak -->
      <div class="header-right">
        <a routerLink="/user/profile" class="header-avatar-wrap group no-underline">
          <div class="header-avatar flex items-center justify-center select-none
                      transition-all group-hover:opacity-85 group-hover:shadow-lg">
            <span class="text-[11px] font-black text-white leading-none tracking-tight">
              {{ initials() }}
            </span>
          </div>
          @if (user()?.dailyStreakCount) {
            <div class="streak-badge flex items-center gap-0.5 shadow-lg">
              <i-lucide [img]="StreakIcon" size="8"></i-lucide>
              {{ user()?.dailyStreakCount }}
            </div>
          }
        </a>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private auth = inject(AuthService);

  readonly StreakIcon = Flame;

  user = signal<any>(this.auth.currentUser);

  initials = computed(() => {
    const name = this.user()?.fullName?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  });
}

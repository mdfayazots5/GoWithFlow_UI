import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Flame } from 'lucide-angular';
import { UserStateService } from '@core/services/user-state.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, UserAvatarComponent],
  template: `
    <header class="app-header">
      <div class="header-left">
        <a routerLink="/user/dashboard" class="header-logo italic tracking-tighter no-underline">Go With Flow</a>
      </div>
      <div class="header-right">
        <a routerLink="/user/profile" class="header-avatar-wrap group no-underline">
          <app-user-avatar
            [name]="name()"
            [avatarUrl]="avatarUrl()"
            size="sm"
            class="transition-all group-hover:opacity-85">
          </app-user-avatar>
          @if (streak()) {
            <div class="streak-badge flex items-center gap-0.5 shadow-lg">
              <i-lucide [img]="StreakIcon" size="8"></i-lucide>
              {{ streak() }}
            </div>
          }
        </a>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private userState = inject(UserStateService);

  readonly StreakIcon = Flame;

  readonly name      = computed(() => this.userState.profile()?.fullName ?? '');
  readonly avatarUrl = computed(() => this.userState.avatarUrl());
  readonly streak    = computed(() => this.userState.profile()?.dailyStreakCount ?? 0);
}

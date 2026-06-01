// File: src/app/shared/components/header/header.component.ts
import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LucideAngularModule, ChevronLeft, Flame } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { filter, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <header class="app-header">
       <!-- Left: Logo or Back -->
       <div class="header-left">
          @if (showBack()) {
            <!-- Hidden on mobile; logo takes its place -->
            <button (click)="goBack()" class="back-btn hide-mobile w-10 h-10 rounded-xl bg-gw-bg flex items-center justify-center hover:text-gw-primary transition-all border-0 cursor-pointer">
               <i-lucide [img]="BackIcon" size="20"></i-lucide>
            </button>
            <!-- Logo shown only on mobile when back button is suppressed -->
            <a routerLink="/user/dashboard" class="header-logo show-mobile italic tracking-tighter no-underline">Go With Flow</a>
          } @else {
            <a routerLink="/user/dashboard" class="header-logo italic tracking-tighter no-underline">Go With Flow</a>
          }
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
  @Input() title: string = '';
  
  private location = inject(Location);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly BackIcon = ChevronLeft;
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

  showBack = signal(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
    ).subscribe(() => {
      const url = this.router.url;
      this.showBack.set(!url.includes('/dashboard') && !url.includes('/login'));
    });
  }

  goBack() {
    this.location.back();
  }
}

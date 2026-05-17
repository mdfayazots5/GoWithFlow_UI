// File: src/app/shared/components/header/header.component.ts
import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LucideAngularModule, ChevronLeft, Flame } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <header class="h-20 bg-white border-b border-gw-card-border flex items-center justify-between px-6 sticky top-0 z-50">
       <!-- Left: Logo or Back -->
       <div class="flex items-center gap-4">
          @if (showBack()) {
            <button (click)="goBack()" class="w-10 h-10 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
               <i-lucide [img]="BackIcon" size="20"></i-lucide>
            </button>
          } @else {
            <a routerLink="/user/dashboard" class="text-2xl font-black text-gw-primary italic tracking-tighter">GoWithFlow</a>
          }
       </div>

       <!-- Center: Title -->
       <div class="flex-1 flex justify-center px-4">
          <h1 class="text-xs font-black uppercase tracking-widest italic text-gw-text-muted truncate max-w-[150px] md:max-w-none">
             {{ title || pageTitle() }}
          </h1>
       </div>

       <!-- Right: Avatar & Streak -->
       <div class="flex items-center">
          <a routerLink="/user/profile" class="relative group">
             <div class="w-10 h-10 rounded-xl overflow-hidden border-2 border-gw-bg group-hover:border-gw-primary transition-all p-0.5">
                <img [src]="user()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user()?.fullName" class="w-full h-full object-cover rounded-lg">
             </div>
             @if (user()?.dailyStreakCount) {
               <div class="absolute -bottom-1 -right-1 bg-[#F59E0B] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-lg">
                  <i-lucide [img]="StreakIcon" size="8"></i-lucide>
                  {{ user()?.dailyStreakCount }}
               </div>
             }
          </a>
       </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class HeaderComponent {
  @Input() title: string = '';
  
  private location = inject(Location);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly BackIcon = ChevronLeft;
  readonly StreakIcon = Flame;

  user = signal<any>(this.auth.currentUser);

  showBack = signal(false);
  pageTitle = signal('');

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url)
    ).subscribe(url => {
      this.showBack.set(!url.includes('/dashboard') && !url.includes('/login'));
      this.updateTitleByUrl(url);
    });
  }

  goBack() {
    this.location.back();
  }

  private updateTitleByUrl(url: string) {
    if (url.includes('/profile')) this.pageTitle.set('My Profile');
    else if (url.includes('/scripts')) this.pageTitle.set('Script Library');
    else if (url.includes('/progress')) this.pageTitle.set('Improvement Tracker');
    else if (url.includes('/my-mistakes')) this.pageTitle.set('Mistake Review');
    else if (url.includes('/session/history')) this.pageTitle.set('Session History');
    else if (url.includes('/session/join')) this.pageTitle.set('Join Session');
    else if (url.includes('/session/create')) this.pageTitle.set('Create Session');
    else if (url.includes('/lobby')) this.pageTitle.set('Session Lobby');
    else if (url.includes('/admin/dashboard')) this.pageTitle.set('Admin Dashboard');
    else if (url.includes('/admin/users')) this.pageTitle.set('User Management');
    else if (url.includes('/admin/scripts')) this.pageTitle.set('Script Management');
    else this.pageTitle.set('');
  }
}

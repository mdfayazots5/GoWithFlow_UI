// File: src/app/app.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { filter } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule,
    HeaderComponent, 
    BottomNavComponent, 
    DemoBannerComponent, 
    ToastComponent, 
    LoaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gw-bg flex flex-col font-sans">
      <app-demo-banner></app-demo-banner>
      
      @if (showHeader()) {
        <app-header></app-header>
      }

      <div class="flex flex-1 overflow-hidden">
        @if (isAdminLayout()) {
          <aside class="hidden md:flex w-64 bg-white border-r border-gw-card-border flex-col shrink-0">
             <div class="p-8 border-b border-gw-bg">
                <span class="text-2xl font-black text-gw-primary italic">GoWithFlow</span>
                <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted mt-1 italic">Admin Console</p>
             </div>
             <nav class="p-6 space-y-2 flex-1">
                <a routerLink="/admin/dashboard" routerLinkActive="bg-gw-bg text-gw-primary font-bold" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gw-text-muted hover:bg-gw-bg transition-all">Dashboard</a>
                <a routerLink="/admin/users" routerLinkActive="bg-gw-bg text-gw-primary font-bold" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gw-text-muted hover:bg-gw-bg transition-all">Users</a>
                <a routerLink="/admin/scripts" routerLinkActive="bg-gw-bg text-gw-primary font-bold" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gw-text-muted hover:bg-gw-bg transition-all">Scripts</a>
                <a routerLink="/admin/reports" routerLinkActive="bg-gw-bg text-gw-primary font-bold" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gw-text-muted hover:bg-gw-bg transition-all">Reports</a>
             </nav>
             <div class="p-6 border-t border-gw-bg">
                <button (click)="logout()" class="w-full h-12 border-2 border-gw-error text-gw-error rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gw-error hover:text-white transition-all">Logout</button>
             </div>
          </aside>
        }

        <main class="flex-1 overflow-y-auto">
          <div [ngClass]="{ 'max-w-[480px]': isMobileView() }" class="mx-auto min-h-full p-4 md:p-6 lg:p-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <app-bottom-nav></app-bottom-nav>
      
      <app-toast></app-toast>
      <app-loader></app-loader>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  
  currentUrl = signal('');

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.url);
      window.scrollTo(0, 0);
    });
  }

  showHeader(): boolean {
    const hideOn = ['/auth', '/live-session', '/repractice'];
    return !hideOn.some(path => this.currentUrl().includes(path)) && !this.currentUrl().includes('/admin');
  }

  isAdminLayout(): boolean {
    return this.auth.getRole() === 'ADMIN' && this.currentUrl().includes('/admin');
  }

  isMobileView(): boolean {
    const mobileRoutes = ['/join', '/lobby', '/speaker-screen', '/listener-screen', '/room', '/report'];
    return mobileRoutes.some(path => this.currentUrl().includes(path));
  }

  logout() {
    this.auth.logout();
  }
}

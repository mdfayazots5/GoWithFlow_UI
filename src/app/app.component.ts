// File: src/app/app.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
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
    ToastComponent,
    LoaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gw-bg flex flex-col font-sans">
      @if (showHeader()) {
        <app-header></app-header>
      }

      <div class="flex flex-1 overflow-hidden">
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

  isMobileView(): boolean {
    const mobileRoutes = ['/join', '/lobby', '/speaker-screen', '/listener-screen', '/room', '/report'];
    return mobileRoutes.some(path => this.currentUrl().includes(path));
  }
}

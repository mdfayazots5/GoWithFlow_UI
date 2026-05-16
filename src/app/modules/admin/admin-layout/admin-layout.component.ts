import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, FileText, BarChart3, LogOut, Menu, X } from 'lucide-angular';
import { AuthService } from '@modules/auth/auth.service';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  template: `
    <div class="flex h-screen bg-gw-bg overflow-hidden font-sans">
      <!-- Sidebar Desktop -->
      <aside 
        class="hidden lg:flex flex-col w-[240px] bg-white border-r border-gw-card-border shrink-0 z-30"
      >
        <div class="h-16 flex items-center px-6 border-b border-gw-card-border">
          <span class="text-xl font-black text-gw-primary italic tracking-tight">GoWithFlow</span>
        </div>

        <nav class="flex-1 py-6">
          <ul class="space-y-1">
            <li *ngFor="let item of menuItems">
              <a 
                [routerLink]="item.path" 
                routerLinkActive="active-link"
                class="flex items-center gap-3 px-6 py-3 text-gw-text-muted hover:text-gw-primary hover:bg-gw-primary/5 transition-all group border-l-[3px] border-transparent"
              >
                <i-lucide [img]="item.icon" size="20" class="group-hover:scale-110 transition-transform"></i-lucide>
                <span class="text-sm font-bold tracking-tight">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="p-4 border-t border-gw-card-border">
          <button 
            (click)="logout()"
            class="flex items-center gap-3 w-full px-4 py-3 text-gw-text-muted hover:text-gw-error hover:bg-gw-error/5 rounded-xl transition-all group"
          >
            <i-lucide [img]="LogoutIcon" size="20"></i-lucide>
            <span class="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      <div 
        *ngIf="isMobileMenuOpen()" 
        class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
        (click)="closeMobileMenu()"
      ></div>

      <!-- Mobile Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 w-[240px] bg-white z-50 lg:hidden transform transition-transform duration-300 shadow-2xl"
        [class.translate-x-0]="isMobileMenuOpen()"
        [class.-translate-x-full]="!isMobileMenuOpen()"
      >
        <div class="h-16 flex items-center justify-between px-6 border-b border-gw-card-border">
          <span class="text-xl font-black text-gw-primary italic tracking-tight">GoWithFlow</span>
          <button (click)="closeMobileMenu()" class="text-gw-text-muted">
            <i-lucide [img]="CloseIcon" size="24"></i-lucide>
          </button>
        </div>
        <nav class="py-6">
          <ul class="space-y-1">
            <li *ngFor="let item of menuItems">
              <a 
                [routerLink]="item.path" 
                routerLinkActive="active-link"
                (click)="closeMobileMenu()"
                class="flex items-center gap-3 px-6 py-3 text-gw-text-muted hover:text-gw-primary hover:bg-gw-primary/5 transition-all group border-l-[3px] border-transparent"
              >
                <i-lucide [img]="item.icon" size="20"></i-lucide>
                <span class="text-sm font-bold">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="h-16 bg-white border-b border-gw-card-border flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0">
          <div class="flex items-center gap-4">
            <button 
              (click)="isMobileMenuOpen.set(true)" 
              class="lg:hidden p-2 text-gw-text-muted hover:bg-gw-bg rounded-lg"
            >
              <i-lucide [img]="MenuIcon" size="24"></i-lucide>
            </button>
            <h1 class="text-lg font-black text-gw-text uppercase italic tracking-tighter">{{ pageTitle() }}</h1>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden sm:flex flex-col items-end">
              <span class="text-xs font-black uppercase text-gw-text tracking-widest">{{ adminName }}</span>
              <span class="text-[10px] font-bold text-gw-text-muted uppercase">Administrator</span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-gw-bg border border-gw-card-border overflow-hidden flex items-center justify-center">
               <img [src]="adminAvatar" class="w-full h-full object-cover">
            </div>
            <button (click)="logout()" class="p-2 text-gw-text-muted hover:text-gw-error transition-colors">
              <i-lucide [img]="LogoutIcon" size="20"></i-lucide>
            </button>
          </div>
        </header>

        <!-- Page Area -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .active-link {
      @apply bg-gw-primary/5 text-gw-primary border-gw-primary;
    }
  `]
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isMobileMenuOpen = signal(false);
  pageTitle = signal('Dashboard');

  adminName = 'GoWithFlow Admin';
  adminAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';

  readonly menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Scripts', path: '/admin/scripts', icon: FileText },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  readonly LogoutIcon = LogOut;
  readonly MenuIcon = Menu;
  readonly CloseIcon = X;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let currentRoute = this.route.root;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }
        return currentRoute.snapshot.data['title'] || 'Admin';
      })
    ).subscribe(title => this.pageTitle.set(title));
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
  }
}

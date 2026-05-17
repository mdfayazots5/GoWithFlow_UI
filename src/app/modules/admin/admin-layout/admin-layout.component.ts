import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, FileText, BarChart3, LogOut, Menu, X, ChevronRight } from 'lucide-angular';
import { AuthService } from '@modules/auth/auth.service';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: var(--gw-bg);">

      <!-- ═══ DESKTOP SIDEBAR ═══ -->
      <aside class="hidden lg:flex flex-col w-[252px] shrink-0 z-30" style="background: #1A1A2E;">

        <!-- Brand -->
        <div class="flex items-center gap-3 px-5 h-[68px]" style="border-bottom: 1px solid rgba(255,255,255,0.07);">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0"
            style="background: var(--gw-primary);"
          >G</div>
          <div class="flex-1 min-w-0">
            <div class="text-white font-bold text-sm leading-none tracking-tight">GoWithFlow</div>
            <div class="text-[10px] font-medium tracking-widest uppercase mt-0.5" style="color: rgba(255,255,255,0.32);">Admin Console</div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-5 overflow-y-auto">
          <p class="text-[9px] font-bold uppercase tracking-[0.14em] px-3 mb-2.5" style="color: rgba(255,255,255,0.22);">Main Menu</p>
          <ul class="space-y-0.5">
            <li *ngFor="let item of menuItems">
              <a
                [routerLink]="item.path"
                routerLinkActive="nav-active"
                class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              >
                <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150">
                  <i-lucide [img]="item.icon" size="16"></i-lucide>
                </div>
                <span class="text-[13px] font-semibold nav-label flex-1">{{ item.label }}</span>
                <i-lucide
                  [img]="ChevronIcon"
                  size="11"
                  class="opacity-0 group-hover:opacity-30 transition-opacity flex-shrink-0"
                  style="color: rgba(255,255,255,0.6);"
                ></i-lucide>
              </a>
            </li>
          </ul>
        </nav>

        <!-- User + Logout -->
        <div class="p-3" style="border-top: 1px solid rgba(255,255,255,0.07);">
          <div class="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div
              class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
              style="box-shadow: 0 0 0 1.5px rgba(255,255,255,0.18);"
            >
              <img [src]="adminAvatar" class="w-full h-full object-cover" alt="avatar">
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-semibold truncate leading-none">{{ adminName }}</p>
              <p class="text-[10px] mt-0.5" style="color: rgba(255,255,255,0.32);">Administrator</p>
            </div>
            <button
              (click)="logout()"
              class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 logout-btn"
              title="Logout"
            >
              <i-lucide [img]="LogoutIcon" size="14"></i-lucide>
            </button>
          </div>
        </div>
      </aside>

      <!-- ═══ MOBILE OVERLAY ═══ -->
      <div
        *ngIf="isMobileMenuOpen()"
        class="fixed inset-0 z-40 lg:hidden"
        style="background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);"
        (click)="closeMobileMenu()"
      ></div>

      <!-- ═══ MOBILE SIDEBAR ═══ -->
      <aside
        class="fixed inset-y-0 left-0 w-[252px] z-50 lg:hidden transform transition-transform duration-300 flex flex-col"
        style="background: #1A1A2E;"
        [class.translate-x-0]="isMobileMenuOpen()"
        [class.-translate-x-full]="!isMobileMenuOpen()"
      >
        <div class="flex items-center justify-between px-5 h-[68px]" style="border-bottom: 1px solid rgba(255,255,255,0.07);">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style="background: var(--gw-primary);">G</div>
            <span class="text-white font-bold text-sm tracking-tight">GoWithFlow</span>
          </div>
          <button (click)="closeMobileMenu()" style="color: rgba(255,255,255,0.4);">
            <i-lucide [img]="CloseIcon" size="20"></i-lucide>
          </button>
        </div>
        <nav class="flex-1 px-3 py-5">
          <ul class="space-y-0.5">
            <li *ngFor="let item of menuItems">
              <a
                [routerLink]="item.path"
                routerLinkActive="nav-active"
                (click)="closeMobileMenu()"
                class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              >
                <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i-lucide [img]="item.icon" size="16"></i-lucide>
                </div>
                <span class="text-[13px] font-semibold nav-label">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- ═══ MAIN CONTENT ═══ -->
      <div class="flex-1 flex flex-col min-w-0">

        <!-- Top Header -->
        <header
          class="h-[68px] flex items-center justify-between px-6 lg:px-8 z-20 sticky top-0"
          style="background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--gw-card-border);"
        >
          <div class="flex items-center gap-3">
            <button
              (click)="isMobileMenuOpen.set(true)"
              class="lg:hidden p-2 rounded-lg"
              style="color: var(--gw-text-muted);"
            >
              <i-lucide [img]="MenuIcon" size="20"></i-lucide>
            </button>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5" style="color: var(--gw-text-muted);">Admin Console</p>
              <h1 class="text-[15px] font-bold leading-none" style="color: var(--gw-text);">{{ pageTitle() }}</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden sm:block text-right">
              <p class="text-[13px] font-semibold leading-none" style="color: var(--gw-text);">{{ adminName }}</p>
              <p class="text-[10px] mt-0.5" style="color: var(--gw-text-muted);">Administrator</p>
            </div>
            <div
              class="w-9 h-9 rounded-xl overflow-hidden"
              style="box-shadow: 0 0 0 2px var(--gw-card-border);"
            >
              <img [src]="adminAvatar" class="w-full h-full object-cover" alt="avatar">
            </div>
          </div>
        </header>

        <!-- Router Content -->
        <main class="flex-1 overflow-y-auto p-6 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nav-item {
      color: rgba(255,255,255,0.42);
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.82);
    }
    .nav-item:hover .nav-icon-wrap {
      background: rgba(255,255,255,0.1);
    }
    .nav-active {
      background: rgba(61,90,153,0.2) !important;
      color: white !important;
      border: 1px solid rgba(61,90,153,0.3);
    }
    .nav-active .nav-icon-wrap {
      background: rgba(61,90,153,0.35) !important;
    }
    .logout-btn {
      color: rgba(255,255,255,0.3);
    }
    .logout-btn:hover {
      background: rgba(211,47,47,0.12);
      color: var(--gw-error);
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
    { label: 'Users',     path: '/admin/users',     icon: Users },
    { label: 'Scripts',   path: '/admin/scripts',   icon: FileText },
    { label: 'Reports',   path: '/admin/reports',   icon: BarChart3 },
  ];

  readonly LogoutIcon = LogOut;
  readonly MenuIcon   = Menu;
  readonly CloseIcon  = X;
  readonly ChevronIcon = ChevronRight;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let r = this.route.root;
        while (r.firstChild) r = r.firstChild;
        return r.snapshot.data['title'] || 'Admin';
      })
    ).subscribe(title => this.pageTitle.set(title));
  }

  closeMobileMenu() { this.isMobileMenuOpen.set(false); }
  logout()          { this.auth.logout(); }
}

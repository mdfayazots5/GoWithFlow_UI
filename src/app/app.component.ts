import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { environment } from '@env/environment';
import { LucideAngularModule, LayoutDashboard, Users, FileBarChart, LogOut, Settings, BookOpen, Play } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, LucideAngularModule, ToastComponent],
  template: `
    <div class="min-h-screen flex text-ls-text bg-ls-bg">
      <app-toast></app-toast>
      <!-- Admin Sidebar -->
      <aside *ngIf="isAdmin" class="admin-sidebar shadow-2xl shadow-black/5 z-50">
        <div class="h-20 flex items-center px-8 border-b border-ls-card-border gap-3">
          <div class="w-8 h-8 bg-ls-primary rounded-lg flex items-center justify-center">
            <span class="text-white font-black italic text-xl">F</span>
          </div>
          <span class="font-black italic text-xl tracking-tighter uppercase">GoWithFlow</span>
        </div>

        <nav class="p-6 space-y-2">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-ls-bg text-ls-primary" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="DashIcon" size="18"></i-lucide>
            Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="bg-ls-bg text-ls-primary" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="UsersIcon" size="18"></i-lucide>
            Members
          </a>
          <a routerLink="/admin/reports" routerLinkActive="bg-ls-bg text-ls-primary" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="ReportIcon" size="18"></i-lucide>
            Reports
          </a>
          <a routerLink="/scripts/manage" routerLinkActive="bg-ls-bg text-ls-primary" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="BookIcon" size="18"></i-lucide>
            Scripts
          </a>
          <a routerLink="/session/join" routerLinkActive="bg-ls-bg text-ls-primary" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="PlayIcon" size="18"></i-lucide>
            Play Session
          </a>
          <div class="pt-8 pb-4">
             <span class="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-ls-text-muted/50">Maintenance</span>
          </div>
          <a routerLink="/admin/settings" class="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
            <i-lucide [img]="SettingsIcon" size="18"></i-lucide>
            Settings
          </a>
        </nav>

        <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-ls-card-border">
          <button (click)="logout()" class="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ls-error hover:bg-red-50 transition-all">
            <i-lucide [img]="LogoutIcon" size="18"></i-lucide>
            Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto" [class.md:pl-[240px]]="isAdmin">
        <router-outlet></router-outlet>
      </main>

      <!-- Demo Banner -->
      <div *ngIf="isDemo" class="fixed top-0 left-0 right-0 h-[3px] bg-ls-accent z-[100] shadow-[0_0_10px_#E07B39]"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AppComponent {
  readonly DashIcon = LayoutDashboard;
  readonly UsersIcon = Users;
  readonly ReportIcon = FileBarChart;
  readonly BookIcon = BookOpen;
  readonly LogoutIcon = LogOut;
  readonly SettingsIcon = Settings;

  get isDemo() { return environment.isDemo; }
  get isAdmin() { 
    return this.auth.currentUser?.role === 'ADMIN'; 
  }

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }
}

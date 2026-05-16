import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight, Activity, TrendingUp } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { AuthService } from '@core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Profile" subtitle="Manage your account & progress"></app-header>

      <main class="p-6 space-y-8 animate-in slide-in-from-right-4">
        <!-- User Info -->
        <div class="flex flex-col items-center gap-4 py-4">
           <div class="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl relative">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi" alt="avatar" class="w-full h-full object-cover rounded-[36px]">
              <a routerLink="/user/settings" class="absolute -bottom-2 -right-2 bg-ls-primary text-white p-2 rounded-xl shadow-lg border-2 border-white hover:scale-110 transition-all">
                 <i-lucide [img]="SettingsIcon" size="16"></i-lucide>
              </a>
           </div>
           
           <div class="text-center">
              <h2 class="text-2xl font-black italic uppercase tracking-tighter text-ls-text">Ravi Kumar</h2>
              <p class="text-xs font-black uppercase tracking-widest text-ls-text-muted mt-1 italic">Active Explorer • Rank 1,243</p>
           </div>
        </div>

        <!-- Menu Section -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Engagement</h3>
           <div class="card p-0 overflow-hidden divide-y divide-ls-card-border">
              <a routerLink="/user/progress" class="p-5 flex items-center justify-between hover:bg-ls-bg transition-all cursor-pointer group">
                 <div class="flex items-center gap-4">
                    <i-lucide [img]="TrendIcon" size="20" class="text-ls-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase tracking-tight">Improvement Tracker</span>
                 </div>
                 <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
              </a>

              <a routerLink="/session/history" class="p-5 flex items-center justify-between hover:bg-ls-bg transition-all cursor-pointer group">
                 <div class="flex items-center gap-4">
                    <i-lucide [img]="HistoryIcon" size="20" class="text-ls-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase tracking-tight">Session History</span>
                 </div>
                 <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
              </a>

              <div class="p-5 flex items-center justify-between hover:bg-ls-bg transition-all cursor-pointer group">
                 <div class="flex items-center gap-4">
                    <i-lucide [img]="BellIcon" size="20" class="text-ls-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase tracking-tight">Notifications</span>
                 </div>
                 <div class="flex items-center gap-3">
                    <span class="px-2 py-0.5 bg-ls-accent text-white text-[8px] font-black rounded-full">3 NEW</span>
                    <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
                 </div>
              </div>

              <div class="p-5 flex items-center justify-between hover:bg-ls-bg transition-all cursor-pointer group">
                 <div class="flex items-center gap-4">
                    <i-lucide [img]="ShieldIcon" size="20" class="text-ls-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase tracking-tight">Privacy & Safety</span>
                 </div>
                 <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
              </div>
           </div>
        </div>

        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Support</h3>
           <div class="card p-0 overflow-hidden divide-y divide-ls-card-border">
              <div class="p-5 flex items-center justify-between hover:bg-ls-bg transition-all cursor-pointer group">
                 <div class="flex items-center gap-4">
                    <i-lucide [img]="HelpIcon" size="20" class="text-ls-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase tracking-tight">Help Center</span>
                 </div>
                 <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
              </div>
           </div>
        </div>

        <button 
          (click)="logout()"
          class="w-full h-16 bg-white border border-ls-error/10 text-ls-error font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-red-50"
        >
           <i-lucide [img]="LogoutIcon" size="18"></i-lucide>
           Sign Out
        </button>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  readonly SettingsIcon = Settings;
  readonly BellIcon = Bell;
  readonly ShieldIcon = Shield;
  readonly HelpIcon = HelpCircle;
  readonly ChevronIcon = ChevronRight;
  readonly LogoutIcon = LogOut;
  readonly HistoryIcon = Activity;
  readonly TrendIcon = TrendingUp;

  constructor(private auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}

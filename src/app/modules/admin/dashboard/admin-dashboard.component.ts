import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, Play, AlertCircle, TrendingUp, ChevronRight } from 'lucide-angular';
import { AdminService, DashboardSummary } from '@core/services/admin.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-8 space-y-8 animate-in fade-in duration-500">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Command Center</h1>
        <div class="bg-blue-50 text-ls-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
          Real-time Sync Active
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6" *ngIf="summary$ | async as s">
        <div class="card flex flex-col gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-ls-primary">
            <i-lucide [img]="UsersIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Total Active Users</p>
            <p class="text-3xl font-black italic text-ls-text">{{ s.totalUsers }}</p>
          </div>
        </div>

        <div class="card flex flex-col gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-ls-success">
            <i-lucide [img]="PlayIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Live Sessions</p>
            <p class="text-3xl font-black italic text-ls-text">{{ s.activeSessions }}</p>
          </div>
        </div>

        <div class="card flex flex-col gap-4">
          <div class="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-ls-accent">
            <i-lucide [img]="TrendIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Avg. Fluency Score</p>
            <p class="text-3xl font-black italic text-ls-text">84%</p>
          </div>
        </div>

        <div class="card flex flex-col gap-4">
          <div class="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-ls-error">
            <i-lucide [img]="AlertIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Total Mistakes Recorded</p>
            <p class="text-3xl font-black italic text-ls-text">{{ s.totalMistakesRecorded ?? 0 }}</p>
            <p class="text-[8px] font-bold text-ls-text-muted mt-1 italic animate-pulse">Updates after Phase 6 is enabled</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Activity -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-2">Live Activity Stream</h3>
          <div class="card p-0 overflow-hidden">
             <div class="divide-y divide-ls-card-border" *ngIf="summary$ | async as s">
                <div *ngFor="let item of s.recentActivity" class="p-5 flex items-center justify-between hover:bg-ls-bg transition-colors group cursor-pointer">
                   <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-ls-bg rounded-xl border border-ls-card-border overflow-hidden">
                         <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.user" alt="avatar">
                      </div>
                      <div>
                        <p class="text-sm font-bold text-ls-text">{{ item.user }}</p>
                        <p class="text-xs text-ls-text-muted">{{ item.action }}</p>
                      </div>
                   </div>
                   <div class="flex items-center gap-4">
                      <span class="text-[10px] font-black text-ls-text-muted uppercase italic">{{ item.time }}</span>
                      <i-lucide [img]="ChevronIcon" size="16" class="text-ls-card-border group-hover:text-ls-primary group-hover:translate-x-1 transition-all"></i-lucide>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- Top Mistakes -->
        <div class="space-y-4">
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-2">Top Learning Gaps</h3>
          <div class="card space-y-6" *ngIf="summary$ | async as s">
             <div *ngFor="let m of s.topMistakes" class="space-y-2">
                <div class="flex items-center justify-between">
                   <span class="text-[10px] font-black uppercase tracking-widest text-ls-text">{{ m.type }}</span>
                   <span class="text-[10px] font-bold text-ls-accent italic">{{ m.count }} occurrences</span>
                </div>
                <div class="h-2 bg-ls-bg rounded-full overflow-hidden">
                   <div class="h-full bg-ls-primary rounded-full transition-all duration-1000" [style.width.%]="m.count * 2"></div>
                </div>
             </div>
             
             <button class="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-ls-primary hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
               Generate detailed report
             </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit {
  readonly UsersIcon = Users;
  readonly PlayIcon = Play;
  readonly AlertIcon = AlertCircle;
  readonly TrendIcon = TrendingUp;
  readonly ChevronIcon = ChevronRight;

  summary$!: Observable<DashboardSummary>;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.summary$ = this.adminService.getDashboardSummary();
  }
}

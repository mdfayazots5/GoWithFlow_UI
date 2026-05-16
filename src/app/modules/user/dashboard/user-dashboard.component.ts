import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Flame, Zap, Trophy, TrendingUp, Play, ChevronRight, Book, AlertCircle } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Ready to Flow?" subtitle="Daily Practice Streak: 7 Days"></app-header>

      <main *ngIf="dashboard" class="p-6 space-y-8 animate-in slide-in-from-bottom-4">
        <!-- Dashboard Banner (Active Session) -->
        <div *ngIf="dashboard.activeSession" class="card bg-ls-primary border-none p-6 text-white flex items-center justify-between">
           <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Ongoing Session</p>
              <h3 class="text-xl font-black italic">{{ dashboard.activeSession.title }}</h3>
              <p class="text-[10px] font-bold mt-1">Code: {{ dashboard.activeSession.joinCode }}</p>
           </div>
           <a [routerLink]="['/session/lobby', dashboard.activeSession.id]" class="px-5 py-2 bg-white text-ls-primary rounded-xl font-black uppercase tracking-widest text-[10px]">Rejoin</a>
        </div>

        <!-- Streak & Rapid Stats -->
        <div class="grid grid-cols-2 gap-4">
           <div class="card bg-ls-primary border-none text-white p-6 relative overflow-hidden">
              <i-lucide [img]="FlameIcon" size="48" class="absolute -right-4 -bottom-4 opacity-10"></i-lucide>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Current Streak</p>
              <h3 class="text-4xl font-black italic mt-1">7 DAYS</h3>
           </div>
           <div class="card bg-ls-accent border-none text-white p-6 relative overflow-hidden">
              <i-lucide [img]="ZapIcon" size="48" class="absolute -right-4 -bottom-4 opacity-10"></i-lucide>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Fluency Rank</p>
              <h3 class="text-4xl font-black italic mt-1">TOP 12%</h3>
           </div>
        </div>

        <!-- Quick Start -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Jump Back In</h3>
           <a routerLink="/session/join" class="card bg-white border border-ls-card-border p-6 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div class="flex items-center gap-4">
                 <div class="w-14 h-14 bg-ls-primary/10 rounded-2xl flex items-center justify-center text-ls-primary">
                    <i-lucide [img]="PlayIcon" size="28"></i-lucide>
                 </div>
                 <div>
                    <h4 class="font-black italic text-ls-text text-lg uppercase tracking-tight">Practice Session</h4>
                    <p class="text-xs text-ls-text-muted">Start a voice-based drill now</p>
                 </div>
              </div>
              <i-lucide [img]="ChevronIcon" size="20" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
           </a>

           <a routerLink="/user/mistakes" class="card bg-white border border-ls-card-border p-6 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div class="flex items-center gap-4">
                 <div class="w-14 h-14 bg-ls-error/10 rounded-2xl flex items-center justify-center text-ls-error">
                    <i-lucide [img]="AlertIcon" size="28"></i-lucide>
                 </div>
                 <div>
                    <h4 class="font-black italic text-ls-text text-lg uppercase tracking-tight">My Mistakes</h4>
                    <p class="text-xs text-ls-text-muted">Review {{ dashboard.pendingMistakesCount }} unresolved errors</p>
                 </div>
              </div>
              <i-lucide [img]="ChevronIcon" size="20" class="text-ls-card-border group-hover:text-ls-error transition-all"></i-lucide>
           </a>
        </div>

        <!-- Progress Overview -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">My Progress</h3>
           <div class="card space-y-6">
              <div class="flex items-center justify-between">
                 <div class="flex items-center gap-3">
                    <i-lucide [img]="TrophyIcon" size="18" class="text-ls-accent"></i-lucide>
                    <span class="text-xs font-bold text-ls-text uppercase italic">Mastery Score</span>
                 </div>
                 <span class="text-lg font-black italic text-ls-primary">842 XP</span>
              </div>
              
              <div class="space-y-3">
                 <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-ls-text-muted">
                    <span>Pronunciation</span>
                    <span>92%</span>
                 </div>
                 <div class="h-2 bg-ls-bg rounded-full overflow-hidden">
                    <div class="h-full bg-ls-primary rounded-full" style="width: 92%"></div>
                 </div>
                 
                 <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-ls-text-muted mt-4">
                    <span>Grammar Precision</span>
                    <span>78%</span>
                 </div>
                 <div class="h-2 bg-ls-bg rounded-full overflow-hidden">
                    <div class="h-full bg-ls-accent rounded-full" style="width: 78%"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- Recent Scripts -->
        <div class="space-y-4">
           <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted">Recommended Scripts</h3>
              <a routerLink="/scripts" class="text-[10px] font-black uppercase tracking-widest text-ls-primary italic">View All</a>
           </div>
           <div class="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
              <div *ngFor="let s of recommended" class="min-w-[200px] card bg-white p-4 space-y-3 shrink-0">
                 <div class="w-10 h-10 bg-ls-bg rounded-xl flex items-center justify-center text-ls-text-muted">
                    <i-lucide [img]="BookIcon" size="18"></i-lucide>
                 </div>
                 <div>
                    <p class="text-xs font-black italic text-ls-text leading-tight uppercase">{{ s.title }}</p>
                    <p class="text-[8px] font-bold text-ls-accent mt-1 uppercase tracking-widest">{{ s.tag }}</p>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class UserDashboardComponent implements OnInit {
  readonly FlameIcon = Flame;
  readonly ZapIcon = Zap;
  readonly TrophyIcon = Trophy;
  readonly TrendIcon = TrendingUp;
  readonly PlayIcon = Play;
  readonly ChevronIcon = ChevronRight;
  readonly BookIcon = Book;
  readonly AlertIcon = AlertCircle;

  recommended = [
    { title: 'Office Gossip Skills', tag: 'Social Eng' },
    { title: 'Kitchen Recipe Talk', tag: 'Grammar' },
    { title: 'Market Haggling', tag: 'Fluency' }
  ];

  dashboard: any;

  constructor(private auth: AuthService, private userService: UserService) {}

  ngOnInit() {
    this.userService.getDashboard().subscribe(res => {
      this.dashboard = res;
    });
  }
}

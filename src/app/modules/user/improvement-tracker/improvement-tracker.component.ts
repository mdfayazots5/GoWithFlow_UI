import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Flame, Trophy, Award, Target, ChevronRight } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-improvement-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Progress Analytics" subtitle="Track your fluency evolution"></app-header>

      <main class="p-6 space-y-8 animate-in slide-in-from-bottom-8">
        <!-- Improvement Summary -->
        <div class="card bg-ls-primary border-none text-white p-8 overflow-hidden relative">
           <div class="relative z-10">
              <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">Fluency Gain</p>
              <h3 class="text-6xl font-black italic tracking-tighter">{{ improvementData?.totalImprovement }}</h3>
              <p class="text-xs font-bold mt-4 opacity-70">Compared to last month's performance baseline</p>
           </div>
           <i-lucide [img]="TrendingUpIcon" size="160" class="absolute -right-12 -bottom-12 opacity-10"></i-lucide>
        </div>

        <!-- Weekly Chart (Pure CSS) -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Daily Mastery %</h3>
           <div class="card p-6 flex items-end justify-between h-48 gap-2">
              <div *ngFor="let d of improvementData?.weeklyProgress" class="flex-1 flex flex-col items-center gap-2">
                 <div class="w-full bg-ls-bg rounded-t-lg relative" [style.height.%]="d.score">
                    <div class="absolute inset-0 bg-ls-primary/20 animate-pulse"></div>
                    <div class="absolute bottom-0 left-0 right-0 bg-ls-primary rounded-t-lg" [style.height.%]="100"></div>
                 </div>
                 <span class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">{{ d.day }}</span>
              </div>
           </div>
        </div>

        <!-- Streak & Badges -->
        <div class="space-y-4">
           <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted">Collected Badges</h3>
              <span class="text-[10px] font-black uppercase italic text-ls-primary">{{ badges.length }} Earned</span>
           </div>
           
           <div class="grid grid-cols-1 gap-4">
              <div *ngFor="let b of badges" class="card bg-white p-5 flex items-center justify-between group active:scale-[0.98] transition-all">
                 <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-ls-bg rounded-2xl flex items-center justify-center text-ls-accent border border-ls-card-border overflow-hidden p-3 group-hover:scale-110 transition-all">
                       <i-lucide [img]="getBadgeIcon(b.icon)" size="24"></i-lucide>
                    </div>
                    <div>
                       <h4 class="font-black italic text-ls-text uppercase tracking-tight">{{ b.name }}</h4>
                       <p class="text-[10px] text-ls-text-muted font-bold">{{ b.description }}</p>
                    </div>
                 </div>
                 <i-lucide [img]="CheckIcon" size="16" class="text-ls-success"></i-lucide>
              </div>
           </div>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: []
})
export class ImprovementTrackerComponent implements OnInit {
  readonly TrendingUpIcon = TrendingUp;
  readonly FlameIcon = Flame;
  readonly TrophyIcon = Trophy;
  readonly AwardIcon = Award;
  readonly TargetIcon = Target;
  readonly CheckIcon = ChevronRight;

  improvementData: any;
  badges: any[] = [];
  streak: any;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getImprovementData().subscribe(res => this.improvementData = res);
    this.userService.getBadges().subscribe(res => this.badges = res);
    this.userService.getStreak().subscribe(res => this.streak = res);
  }

  getBadgeIcon(name: string) {
    switch (name) {
      case 'Sun': return Award;
      case 'Flame': return Flame;
      case 'Smile': return Trophy;
      default: return Target;
    }
  }
}

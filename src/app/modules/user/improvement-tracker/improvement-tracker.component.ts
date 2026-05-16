// File: src/app/modules/user/improvement-tracker/improvement-tracker.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { ImprovementData } from '@core/models/user.model';
import { LucideAngularModule, TrendingUp, Award, Clock, Target, Flame, ChevronRight, Zap, Info, Calendar, BookOpen, Star } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-improvement-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-10 animate-in fade-in duration-500 pb-32">
      <!-- Header -->
      <div class="space-y-1">
        <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tighter">PROGRESS JOURNEY</h2>
        <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Your path to English fluency</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of trackerStats; track stat.label) {
          <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-2 relative overflow-hidden group">
             <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <i-lucide [img]="stat.icon" size="80"></i-lucide>
             </div>
             <div class="flex items-center gap-2">
                <i-lucide [img]="stat.icon" size="14" class="text-gw-primary"></i-lucide>
                <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ stat.label }}</span>
             </div>
             <p class="text-3xl font-black text-gw-text italic tracking-tight">{{ stat.value }}</p>
          </div>
        }
      </div>

      <!-- Score Trend (Table) -->
      <div class="space-y-6">
         <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-accent pl-4">Score Trend</h3>
            <span class="text-[8px] font-black text-gw-text-muted uppercase italic">LAST 10 SESSIONS</span>
         </div>
         <div class="bg-white rounded-[40px] border border-gw-card-border overflow-hidden shadow-sm">
            <table class="w-full text-left">
               <thead>
                  <tr class="bg-gw-bg/50">
                     <th class="px-8 py-4 text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Date</th>
                     <th class="px-8 py-4 text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Session</th>
                     <th class="px-8 py-4 text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic text-center">Fluency</th>
                     <th class="px-8 py-4 text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic text-center">Confidence</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gw-bg">
                  @for (point of data()?.recentSessions; track point.date) {
                    <tr class="hover:bg-gw-bg/20 transition-all">
                       <td class="px-8 py-5 text-[10px] font-bold text-gw-text-muted italic">{{ point.date | date:'MMM d' }}</td>
                       <td class="px-8 py-5 text-sm font-black text-gw-text italic">{{ point.sessionName }}</td>
                       <td class="px-8 py-5 text-center">
                          <span class="px-3 py-1 bg-gw-success/10 text-gw-success rounded-lg text-[10px] font-black italic">{{ point.fluency }}%</span>
                       </td>
                       <td class="px-8 py-5 text-center">
                          <span class="text-xs font-bold text-gw-text italic">{{ point.confidence }}%</span>
                       </td>
                    </tr>
                  }
               </tbody>
            </table>
         </div>
      </div>

      <!-- Grammar Progress bars -->
      <div class="space-y-6">
         <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-primary pl-4">Grammar Focus</h3>
         <div class="grid gap-4">
            @for (grammar of data()?.grammarProgress; track grammar.grammarTag) {
               <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-4">
                  <div class="flex justify-between items-center">
                     <span class="text-[10px] font-black uppercase tracking-widest text-gw-text italic">{{ grammar.grammarTag }}</span>
                     <span class="text-[10px] font-bold text-gw-text-muted italic">{{ grammar.resolvedMistakes }}/{{ grammar.totalMistakes }} Resolved</span>
                  </div>
                  <div class="h-2 w-full bg-gw-bg rounded-full overflow-hidden">
                     <div
                        class="h-full bg-gw-primary transition-all duration-1000"
                        [style.width.%]="grammar.progressBarValue"
                     ></div>
                  </div>
               </div>
            }
         </div>
      </div>

      <!-- Badge Showcase -->
      <div class="space-y-6">
         <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-[#F59E0B] pl-4">Badges Earned</h3>
         <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (badge of badges(); track badge.id) {
               <div 
                 class="p-6 rounded-[40px] border flex flex-col items-center text-center gap-4 transition-all"
                 [class.bg-white]="badge.isEarned"
                 [class.border-gw-card-border]="badge.isEarned"
                 [class.shadow-sm]="badge.isEarned"
                 [class.opacity-40]="!badge.isEarned"
                 [class.bg-gw-bg]="!badge.isEarned"
                 [class.border-transparent]="!badge.isEarned"
               >
                  <div 
                    class="w-16 h-16 rounded-3xl flex items-center justify-center text-[#F59E0B] shadow-lg"
                    [class.bg-[#F59E0B]/10]="badge.isEarned"
                    [class.bg-white/50]="!badge.isEarned"
                  >
                     <i-lucide [img]="StarIcon" size="32"></i-lucide>
                  </div>
                  <div class="space-y-1">
                     <p class="text-[10px] font-black uppercase tracking-widest text-gw-text italic">{{ badge.name }}</p>
                     <p class="text-[8px] font-bold text-gw-text-muted italic leading-tight">{{ badge.description }}</p>
                  </div>
                  @if (badge.isEarned) {
                    <span class="text-[8px] font-black text-[#F59E0B] uppercase italic">EARNED {{ badge.earnedDate | date:'MMM yyyy' }}</span>
                  } @else {
                    <span class="text-[8px] font-black text-gw-text-muted uppercase italic">LOCKED</span>
                  }
               </div>
            }
         </div>
      </div>

      <!-- Repractice History -->
      <div class="space-y-6">
         <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-text pl-4">Repractice History</h3>
         <div class="grid gap-4">
            @for (item of data()?.repracticeHistory; track item.date) {
               <div class="bg-white p-6 rounded-[32px] border border-gw-card-border flex items-center justify-between group hover:border-gw-primary transition-all">
                  <div class="flex items-center gap-4">
                     <div class="w-10 h-10 bg-gw-bg rounded-xl flex items-center justify-center text-gw-text-muted group-hover:bg-gw-primary/10 group-hover:text-gw-primary transition-all">
                        <i-lucide [img]="ZapIcon" size="18"></i-lucide>
                     </div>
                     <div>
                        <p class="text-sm font-black text-gw-text italic uppercase tracking-tight">{{ item.sourceSession }}</p>
                        <p class="text-[8px] font-black text-gw-text-muted uppercase italic">{{ item.date | date:'mediumDate' }} • {{ item.mistakesPracticed }} Mistakes</p>
                     </div>
                  </div>
                  <div class="text-center">
                     <p class="text-xl font-black text-gw-success italic">+{{ item.improvementPercent }}%</p>
                     <p class="text-[8px] font-black text-gw-text-muted uppercase italic">IMPROVED</p>
                  </div>
               </div>
            }
         </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ImprovementTrackerComponent implements OnInit {
  private userService = inject(UserService);

  readonly TrendingIcon = TrendingUp;
  readonly AwardIcon = Award;
  readonly ClockIcon = Clock;
  readonly TargetIcon = Target;
  readonly FlameIcon = Flame;
  readonly ZapIcon = Zap;
  readonly StarIcon = Star;

  data = signal<ImprovementData | null>(null);
  badges = signal<any[]>([]);
  trackerStats: any[] = [];

  ngOnInit() {
    this.loadData();
    this.loadBadges();
  }

  loadData() {
    this.userService.getImprovementData().subscribe(res => {
      this.data.set(res);
      this.trackerStats = [
        { label: 'Completed', value: res.statsHeader.sessionsCompleted, icon: Award },
        { label: 'Avg score', value: res.statsHeader.avgScoreThisWeek + '%', icon: TrendingUp },
        { label: 'Resolved', value: res.statsHeader.mistakesResolved, icon: Target },
        { label: 'Streak', value: res.statsHeader.currentStreak, icon: Flame }
      ];
      this.badges.set(res.badgesEarned);
    });
  }

  loadBadges() {
    // badges now loaded from getImprovementData() → badgesEarned
  }
}

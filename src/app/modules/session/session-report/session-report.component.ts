// File: src/app/modules/session/session-report/session-report.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LiveSessionService } from '../../live-session/live-session.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { LucideAngularModule, CheckCircle2, Trophy, Clock, Target, Zap, ChevronRight, Home, Layout, History, MessageSquare, TrendingUp } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-session-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-12 animate-in zoom-in duration-700 pb-32">
      <!-- Success Header -->
      <div class="flex flex-col items-center gap-6 py-10 text-center">
         <div class="w-24 h-24 bg-gw-success/10 rounded-[40px] flex items-center justify-center text-gw-success shadow-xl shadow-gw-success/5 animate-bounce">
            <i-lucide [img]="SuccessIcon" size="48"></i-lucide>
         </div>
         <div class="space-y-2">
            <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tight">SESSION COMPLETE!</h2>
            <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">Great progress today, flow forward!</p>
         </div>
      </div>

      <!-- Quick Summary Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-1">
            <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Session Mode</span>
            <p class="text-lg font-black text-gw-text italic uppercase">{{ summary()?.mode || 'Grammar Drill' }}</p>
         </div>
         <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-1 text-center bg-[#E07B39]/5 border-[#E07B39]/20">
            <span class="text-[8px] font-black uppercase tracking-widest text-[#E07B39] italic">Top Score</span>
            <p class="text-2xl font-black text-[#E07B39] italic">{{ summary()?.topScore || 95 }}%</p>
         </div>
         <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-1">
            <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Total Mistakes</span>
            <p class="text-2xl font-black text-gw-error italic">{{ summary()?.totalMistakes || 8 }}</p>
         </div>
         <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-1">
            <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Duration</span>
            <p class="text-2xl font-black text-gw-text italic">12:45</p>
         </div>
      </div>

      <!-- Scoreboard -->
      <div class="space-y-6">
         <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-primary pl-4">Leaderboard</h3>
         <div class="bg-white rounded-[40px] border border-gw-card-border overflow-hidden">
            <table class="w-full">
               <thead>
                  <tr class="bg-gw-bg/50">
                     <th class="px-8 py-4 text-left text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Member</th>
                     <th class="px-8 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</th>
                     <th class="px-8 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Rating</th>
                     <th class="px-8 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gw-bg">
                  @for (score of scoreboard; track score.name; let i = $index) {
                    <tr class="hover:bg-gw-bg/20 transition-colors" [class.bg-gw-primary/5]="i === 0">
                       <td class="px-8 py-6">
                          <div class="flex items-center gap-3">
                             @if (i === 0) { <i-lucide [img]="TrophyIcon" size="16" class="text-[#F59E0B]"></i-lucide> }
                             <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + score.name" class="w-8 h-8 rounded-lg">
                             <span class="font-bold italic text-gw-text text-sm">{{ score.name }}</span>
                          </div>
                       </td>
                       <td class="px-8 py-6 text-center">
                          <span class="text-sm font-black italic" [class.text-gw-success]="score.fluency >= 80">{{ score.fluency }}%</span>
                       </td>
                       <td class="px-8 py-6 text-center">
                          <span class="text-xs font-bold italic text-gw-primary">{{ score.rating }}</span>
                       </td>
                       <td class="px-8 py-6 text-center">
                          <span class="text-xs font-black italic" [class.text-gw-error]="score.mistakes > 0">{{ score.mistakes }}</span>
                       </td>
                    </tr>
                  }
               </tbody>
            </table>
         </div>
      </div>

      <!-- Improvement Note -->
      <div class="p-8 bg-[#1A1A2E] rounded-[48px] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         <div class="absolute top-0 right-0 p-8 opacity-10">
            <i-lucide [img]="TrendingIcon" size="120"></i-lucide>
         </div>
         <div class="w-20 h-20 bg-gw-accent rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-gw-accent/40 rotate-3 shrink-0">
            <i-lucide [img]="TrendingIcon" size="32"></i-lucide>
         </div>
         <div class="space-y-2 relative z-10 text-center md:text-left">
            <h4 class="text-2xl font-black text-gw-accent italic uppercase tracking-tight">PROGRESS DETECTED!</h4>
            <p class="text-base font-bold text-white/80 italic leading-relaxed">
               "Your group improved 12% desde last session on this script! Fixed 3 common grammar mistakes together."
            </p>
         </div>
      </div>

      <!-- Actions -->
      <div class="space-y-4">
         <button (click)="startCorrection()" class="w-full h-20 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-3xl shadow-2xl shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center group">
            <div class="flex items-center gap-3">
               <i-lucide [img]="ZapIcon" size="24" class="text-gw-accent group-hover:animate-pulse"></i-lucide>
               <span class="text-xl">START CORRECTION ROUND</span>
            </div>
            <span class="text-[8px] opacity-60">PRACTICE YOUR 3 PERSONAL MISTAKES</span>
         </button>

         <div class="grid grid-cols-2 gap-4">
            <button [routerLink]="['/session', summary()?.id, 'detail']" class="h-16 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-2 hover:bg-gw-bg transition-all">
               <i-lucide [img]="LayoutIcon" size="18"></i-lucide>
               DETAILED REPORT
            </button>
            <button routerLink="/user/dashboard" class="h-16 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-2 hover:bg-gw-bg transition-all">
               <i-lucide [img]="HomeIcon" size="18"></i-lucide>
               GO HOME
            </button>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SessionReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private liveSessionService = inject(LiveSessionService);
  private repracticeService = inject(RepracticeService);
  private toast = inject(ToastService);

  readonly SuccessIcon = CheckCircle2;
  readonly TrophyIcon = Trophy;
  readonly ZapIcon = Zap;
  readonly LayoutIcon = Layout;
  readonly HomeIcon = Home;
  readonly TrendingIcon = TrendingUp;

  summary = signal<any>(null);
  scoreboard = [
    { name: 'Arjun Kumar', fluency: 95, rating: 'Excellent', mistakes: 0 },
    { name: 'Ravi Kumar', fluency: 88, rating: 'Great', mistakes: 1 },
    { name: 'Priya Kumar', fluency: 82, rating: 'Good', mistakes: 2 },
    { name: 'Sneha Kumar', fluency: 75, rating: 'Improving', mistakes: 3 }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['sessionId'];
      if (id) {
        // Normally calling complete session to get results
        this.liveSessionService.completeSession(id).subscribe(res => {
          this.summary.set({ id, ...res });
        });
      }
    });
  }

  startCorrection() {
    this.repracticeService.generateRepracticeSession(Number(this.summary()?.id) || 0).subscribe(res => {
      this.router.navigate(['/repractice', res.repracticeSessionId]);
    });
  }
}

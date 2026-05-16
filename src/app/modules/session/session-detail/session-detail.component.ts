// File: src/app/modules/session/session-detail/session-detail.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { SessionDetail } from '@core/models/session.model';
import { LucideAngularModule, ChevronLeft, Calendar, Clock, Award, Target, Zap, RotateCcw, BookOpen, User, ArrowRight, Info } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in slide-in-from-bottom-10 duration-700 pb-32">
      <!-- Header -->
      <div class="flex items-center gap-4">
         <button routerLink="/user/dashboard" class="w-10 h-10 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
            <i-lucide [img]="BackIcon" size="20"></i-lucide>
         </button>
         <div>
            <h2 class="text-2xl font-black text-gw-text italic uppercase tracking-tighter">{{ detail()?.sessionName }}</h2>
            <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-widest italic">{{ detail()?.createdDate | date:'fullDate' }}</p>
         </div>
      </div>

      <!-- Performance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <!-- Circular Progress + Main Stats -->
         <div class="bg-white p-8 rounded-[40px] border border-gw-card-border shadow-sm flex flex-col items-center gap-8">
            <div class="relative w-48 h-48 flex items-center justify-center">
               <svg class="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" stroke-width="12" class="text-gw-bg"></circle>
                  <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" stroke-width="12" 
                    [style.stroke-dasharray]="553" 
                    [style.stroke-dashoffset]="553 - (553 * (detail()?.myPerformance?.fluency || 0) / 100)"
                    class="transition-all duration-1000 ease-out"
                    [class.text-gw-success]="(detail()?.myPerformance?.fluency || 0) >= 80"
                    [class.text-[#F59E0B]]="(detail()?.myPerformance?.fluency || 0) < 80 && (detail()?.myPerformance?.fluency || 0) >= 60"
                    [class.text-gw-error]="(detail()?.myPerformance?.fluency || 0) < 60"
                  ></circle>
               </svg>
               <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency Score</span>
                  <p class="text-4xl font-black italic">{{ detail()?.myPerformance?.fluency }}%</p>
               </div>
            </div>

            <div class="grid grid-cols-3 w-full gap-4 border-t border-gw-bg pt-8">
               <div class="text-center space-y-1">
                  <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Confidence</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.confidence }}%</p>
               </div>
               <div class="text-center space-y-1 border-x border-gw-bg">
                  <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Speed</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.speedWpm }}<span class="text-[10px] ml-0.5">wpm</span></p>
               </div>
               <div class="text-center space-y-1">
                  <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Pauses</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.pauses }}</p>
               </div>
            </div>
         </div>

         <!-- Listener Feedback + Session Info -->
         <div class="space-y-6">
            <div class="bg-white p-8 rounded-[40px] border border-gw-card-border shadow-sm space-y-6">
               <h3 class="text-xs font-black uppercase tracking-widest text-gw-text-muted italic flex items-center gap-2">
                  <i-lucide [img]="AwardIcon" size="14"></i-lucide>
                  LISTENER FEEDBACK
               </h3>
               <div class="grid grid-cols-2 gap-4">
                  @for (fb of detail()?.listenerFeedback; track fb.tag) {
                    <div class="p-4 bg-gw-bg rounded-2xl border border-gw-bg flex items-center justify-between">
                       <span class="text-[10px] font-bold text-gw-text italic">{{ fb.tag }}</span>
                       <span class="px-2 py-0.5 bg-white rounded-lg text-[10px] font-black text-gw-primary">{{ fb.count }}</span>
                    </div>
                  }
               </div>
            </div>

            <div class="bg-[#1A1A2E] p-8 rounded-[40px] shadow-sm space-y-6 text-white">
               <h3 class="text-xs font-black uppercase tracking-widest text-white/40 italic flex items-center gap-2">
                  <i-lucide [img]="InfoIcon" size="14"></i-lucide>
                  SESSION CONTEXT
               </h3>
               <div class="space-y-4">
                  <div class="flex justify-between items-center text-[10px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Script</span>
                     <span class="font-black italic text-gw-accent">{{ detail()?.scriptTitle }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Mode</span>
                     <span class="font-black italic">{{ detail()?.sessionMode }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Duration</span>
                     <span class="font-black italic">{{ detail()?.sessionDuration }} min</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- My Mistakes Section -->
      <div class="space-y-6">
         <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-error pl-4">Mistakes to Fix</h3>
            <span class="text-[10px] font-black bg-gw-error/10 text-gw-error px-3 py-1 rounded-full italic">{{ detail()?.myMistakes?.length }} DETECTED</span>
         </div>

         <div class="grid gap-4">
            @for (mistake of detail()?.myMistakes; track mistake.said) {
               <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-6 group">
                  <div class="flex justify-between items-center">
                     <span class="px-3 py-1 bg-gw-bg text-gw-text-muted rounded-lg text-[8px] font-black uppercase tracking-widest italic">{{ mistake.type }} — {{ mistake.tag }}</span>
                     <button (click)="practiceMistake()" class="text-gw-primary hover:scale-110 transition-transform">
                        <i-lucide [img]="NextIcon" size="20"></i-lucide>
                     </button>
                  </div>
                  <div class="grid md:grid-cols-2 gap-4">
                     <div class="space-y-1">
                        <p class="text-[8px] font-black text-gw-error/60 uppercase italic">You Said</p>
                        <p class="text-sm font-bold italic line-through decoration-gw-error/20 text-gw-text-muted">"{{ mistake.said }}"</p>
                     </div>
                     <div class="space-y-1">
                        <p class="text-[8px] font-black text-gw-success uppercase italic">Should Be</p>
                        <p class="text-base font-black italic text-gw-text">"{{ mistake.shouldBe }}"</p>
                     </div>
                  </div>
               </div>
            }
         </div>
      </div>

      <!-- Other Members -->
      <div class="space-y-6">
         <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-primary pl-4">Member Performance</h3>
         <div class="bg-white rounded-[40px] border border-gw-card-border overflow-hidden">
            <table class="w-full text-left border-collapse">
               <thead>
                  <tr class="bg-gw-bg/50">
                     <th class="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Member</th>
                     <th class="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</th>
                     <th class="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gw-bg">
                  @for (member of detail()?.memberScores; track member.name) {
                    <tr class="hover:bg-gw-bg/20 transition-colors">
                       <td class="px-8 py-6 flex items-center gap-3">
                          <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.name" class="w-8 h-8 rounded-lg bg-gw-bg">
                          <span class="font-bold italic text-gw-text">{{ member.name }}</span>
                       </td>
                       <td class="px-8 py-6">
                          <div class="flex items-center gap-2">
                             <span class="text-sm font-black italic">{{ member.fluency }}%</span>
                             <div class="w-16 h-1 rounded-full bg-gw-bg flex-shrink-0">
                                <div class="h-full bg-gw-primary rounded-full transition-all duration-1000" [style.width.%]="member.fluency"></div>
                             </div>
                          </div>
                       </td>
                       <td class="px-8 py-6">
                          <span class="text-xs font-black italic text-gw-error">{{ member.mistakes }} errors</span>
                       </td>
                    </tr>
                  }
               </tbody>
            </table>
         </div>
      </div>

      <!-- Final Actions -->
      <div class="grid md:grid-cols-3 gap-4 pt-8">
         <button (click)="practiceMistake()" class="h-16 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-gw-text/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
            <i-lucide [img]="ZapIcon" size="20" class="text-gw-accent"></i-lucide>
            START CORRECTION ROUND
         </button>
         <button routerLink="/scripts" class="h-16 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 hover:bg-gw-bg transition-all">
            <i-lucide [img]="BookIcon" size="20"></i-lucide>
            VIEW SCRIPT
         </button>
         <button (click)="practiceAgain()" class="h-16 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 hover:bg-gw-bg transition-all">
            <i-lucide [img]="RetryIcon" size="20"></i-lucide>
            PRACTICE AGAIN
         </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SessionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private repracticeService = inject(RepracticeService);
  private toast = inject(ToastService);

  readonly BackIcon = ChevronLeft;
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly AwardIcon = Award;
  readonly NextIcon = ArrowRight;
  readonly ZapIcon = Zap;
  readonly BookIcon = BookOpen;
  readonly RetryIcon = RotateCcw;
  readonly InfoIcon = Info;

  detail = signal<SessionDetail | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['sessionId'];
      if (id) {
        this.userService.getSessionDetail(id).subscribe(res => {
          this.detail.set(res);
        });
      }
    });
  }

  practiceMistake() {
    this.repracticeService.generateRepracticeSession(this.detail()?.id || '0').subscribe(res => {
      this.router.navigate(['/repractice', res.id]);
    });
  }

  practiceAgain() {
    this.router.navigate(['/session/create'], { queryParams: { scriptId: this.detail()?.scriptId } });
  }
}

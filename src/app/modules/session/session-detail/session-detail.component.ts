// File: src/app/modules/session/session-detail/session-detail.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { SessionDetail } from '@core/models/session.model';
import { LucideAngularModule, Calendar, Clock, Award, Target, Zap, RotateCcw, BookOpen, ArrowRight, Info } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { LoadingStateComponent } from '@shared/ui/loading-state/loading-state.component';
import { SkeletonCardComponent, SkeletonListComponent } from '@shared/ui/skeleton';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, UserAvatarComponent, LoadingStateComponent, SkeletonCardComponent, SkeletonListComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div>
        <h1 class="text-xl font-black text-gw-text tracking-tight truncate">
          {{ detail()?.sessionName || 'Session Detail' }}
        </h1>
        <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">
          {{ detail()?.createdDate | date:'fullDate' }}
        </p>
      </div>

      <app-loading-state [loading]="loading()" [error]="error()" (retry)="reload()">
        <ng-container skeleton>
          <div class="space-y-4">
            <app-skeleton-card [avatar]="false" [bodyLines]="4"></app-skeleton-card>
            <app-skeleton-list [rows]="3" [avatar]="false"></app-skeleton-list>
          </div>
        </ng-container>

        <div class="space-y-4">

      <!-- Performance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
         <!-- Circular Progress + Main Stats -->
         <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm flex flex-col items-center gap-5">
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
                  <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency Score</span>
                  <p class="text-4xl font-black italic">{{ detail()?.myPerformance?.fluency | number:'1.0-1' }}%</p>
               </div>
            </div>

            <div class="grid grid-cols-3 w-full gap-4 border-t border-gw-bg pt-4">
               <div class="text-center space-y-1">
                  <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Confidence</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.confidence | number:'1.0-1' }}%</p>
               </div>
               <div class="text-center space-y-1 border-x border-gw-bg">
                  <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Speed</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.speedWpm }}<span class="text-[11px] ml-0.5">wpm</span></p>
               </div>
               <div class="text-center space-y-1">
                  <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Pauses</span>
                  <p class="text-lg font-black italic">{{ detail()?.myPerformance?.pauses }}</p>
               </div>
            </div>
         </div>

         <!-- Listener Feedback + Session Info -->
         <div class="space-y-4">
            <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm space-y-4">
               <h3 class="text-xs font-black uppercase tracking-widest text-gw-text-muted italic flex items-center gap-2">
                  <i-lucide [img]="AwardIcon" size="14"></i-lucide>
                  LISTENER FEEDBACK
               </h3>
               <div class="grid grid-cols-2 gap-4">
                  @for (fb of detail()?.listenerFeedbackReceived; track fb.tag) {
                    <div class="p-4 bg-gw-bg rounded-2xl border border-gw-bg flex items-center justify-between">
                       <span class="text-[11px] font-bold text-gw-text italic">{{ fb.tag }}</span>
                       <span class="px-2 py-0.5 bg-white rounded-lg text-[11px] font-black text-gw-primary">{{ fb.count }}</span>
                    </div>
                  }
               </div>
            </div>

            <div class="bg-[#1A1A2E] p-5 rounded-2xl shadow-sm space-y-4 text-white">
               <h3 class="text-xs font-black uppercase tracking-widest text-white/40 italic flex items-center gap-2">
                  <i-lucide [img]="InfoIcon" size="14"></i-lucide>
                  SESSION CONTEXT
               </h3>
               <div class="space-y-4">
                  <div class="flex justify-between items-center text-[11px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Script</span>
                     <span class="font-black italic text-gw-accent">{{ detail()?.scriptTitle }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[11px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Mode</span>
                     <span class="font-black italic">{{ detail()?.sessionMode }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[11px]">
                     <span class="font-bold text-white/40 uppercase tracking-widest italic">Duration</span>
                     <span class="font-black italic">{{ detail()?.sessionDuration }} min</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- My Mistakes Section -->
      <div class="space-y-3">
         <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-error pl-3">Mistakes to Fix</h3>
            <span class="text-[11px] font-black bg-gw-error/10 text-gw-error px-3 py-1 rounded-full italic">{{ detail()?.myMistakes?.length }} DETECTED</span>
         </div>

         <div class="grid gap-4">
            @for (mistake of detail()?.myMistakes; track mistake.said) {
               <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm space-y-3 group">
                  <div class="flex justify-between items-center">
                     <span class="px-3 py-1 bg-gw-bg text-gw-text-muted rounded-lg text-[11px] font-black uppercase tracking-widest italic">{{ mistake.type }} — {{ mistake.tag }}</span>
                     <button (click)="practiceMistake()" class="text-gw-primary hover:scale-110 transition-transform">
                        <i-lucide [img]="NextIcon" size="20"></i-lucide>
                     </button>
                  </div>
                  <div class="grid md:grid-cols-2 gap-4">
                     <div class="space-y-1">
                        <p class="text-[11px] font-black text-gw-error/60 uppercase italic">You Said</p>
                        <p class="text-sm font-bold italic line-through decoration-gw-error/20 text-gw-text-muted">"{{ mistake.said }}"</p>
                     </div>
                     <div class="space-y-1">
                        <p class="text-[11px] font-black text-gw-success uppercase italic">Should Be</p>
                        <p class="text-base font-black italic text-gw-text">"{{ mistake.shouldBe }}"</p>
                     </div>
                  </div>
               </div>
            }
         </div>
      </div>

      <!-- Other Members -->
      <div class="space-y-3">
         <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-primary pl-3">Member Performance</h3>
         <div class="bg-white rounded-2xl border border-gw-card-border overflow-hidden shadow-sm">
            <table class="w-full text-left border-collapse">
               <thead>
                  <tr class="bg-gw-bg/50">
                     <th class="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Member</th>
                     <th class="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</th>
                     <th class="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gw-bg">
                  @for (member of detail()?.allMemberScores; track member.name) {
                    <tr class="hover:bg-gw-bg/20 transition-colors">
                       <td class="px-8 py-6 flex items-center gap-3">
                          <app-user-avatar [name]="member.name" [avatarUrl]="member.avatar" size="xs"></app-user-avatar>
                          <span class="font-bold italic text-gw-text">{{ member.name }}</span>
                       </td>
                       <td class="px-8 py-6">
                          <div class="flex items-center gap-2">
                             <span class="text-sm font-black italic">{{ member.fluency | number:'1.0-1' }}%</span>
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

        </div>
      </app-loading-state>

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

  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly AwardIcon = Award;
  readonly NextIcon = ArrowRight;
  readonly ZapIcon = Zap;
  readonly BookIcon = BookOpen;
  readonly RetryIcon = RotateCcw;
  readonly InfoIcon = Info;

  detail = signal<SessionDetail | null>(null);
  loading = signal(true);
  error = signal(false);
  private currentId: string | null = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['sessionId'];
      if (id) {
        this.currentId = id;
        this.load(id);
      }
    });
  }

  private load(id: string) {
    this.loading.set(true);
    this.error.set(false);
    this.userService.getSessionDetail(id).subscribe({
      next: res => {
        this.detail.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  reload() {
    if (this.currentId) this.load(this.currentId);
  }

  practiceMistake() {
    this.repracticeService.generateRepracticeSession(Number(this.detail()?.id) || 0).subscribe(res => {
      this.router.navigate(['/repractice', res.repracticeSessionId]);
    });
  }

  practiceAgain() {
    this.router.navigate(['/session/create'], { queryParams: { scriptId: this.detail()?.scriptId } });
  }

}

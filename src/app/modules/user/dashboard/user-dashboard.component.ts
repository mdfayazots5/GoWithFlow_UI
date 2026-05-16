// File: src/app/modules/user/dashboard/user-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Flame, Zap, Trophy, TrendingUp, Play, ChevronRight, Book, AlertCircle, Gamepad2, PlusCircle } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <!-- Greeting Header -->
      <div class="flex items-center justify-between">
         <div>
            <h1 class="text-2xl font-black text-gw-text italic tracking-tighter">
               {{ greeting }}, {{ user()?.fullName?.split(' ')[0] }}!
            </h1>
            <div class="flex items-center gap-2 mt-1">
               <span class="bg-gw-accent/10 text-gw-accent text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                  <i-lucide [img]="FlameIcon" size="10"></i-lucide>
                  {{ user()?.dailyStreakCount || 0 }} Day Streak
               </span>
            </div>
         </div>
         <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ today | date:'EEEE, MMM d' }}</p>
      </div>

      <!-- Active Session Banner -->
      @if (dashboard()?.activeSession) {
        <div class="bg-gw-accent rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-gw-accent/20">
           <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/70 italic">You have an active session</p>
              <h3 class="text-xl font-black italic tracking-tight">{{ dashboard()?.activeSession.title }}</h3>
           </div>
           <a [routerLink]="['/session/lobby', dashboard()?.activeSession.id]" class="h-10 px-6 bg-white text-gw-accent rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:scale-105 transition-transform">
              Rejoin →
           </a>
        </div>
      }

      <!-- Pending Repractice Banner -->
      @if (dashboard()?.pendingRepracticeCount > 0) {
        <div class="bg-gw-primary rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-gw-primary/20">
           <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/70 italic">Practice needed</p>
              <h3 class="text-xl font-black italic tracking-tight">{{ dashboard()?.pendingRepracticeCount }} correction rounds waiting</h3>
           </div>
           <a routerLink="/user/progress" class="h-10 px-6 bg-white text-gw-primary rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:scale-105 transition-transform">
              Practice Now →
           </a>
        </div>
      }

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
         <a routerLink="/session/join" class="gw-card flex items-center gap-5 hover:border-gw-primary transition-all group active:scale-[0.98]">
            <div class="w-14 h-14 bg-gw-primary/10 text-gw-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <i-lucide [img]="PlayIcon" size="32"></i-lucide>
            </div>
            <div>
               <h4 class="text-lg font-black italic text-gw-text uppercase tracking-tight">Join Session</h4>
               <p class="text-[13px] text-gw-text-muted">Enter a code to play</p>
            </div>
         </a>

         <a routerLink="/session/create" class="gw-card flex items-center gap-5 hover:border-gw-primary transition-all group active:scale-[0.98]">
            <div class="w-14 h-14 bg-gw-accent/10 text-gw-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <i-lucide [img]="AddIcon" size="32"></i-lucide>
            </div>
            <div>
               <h4 class="text-lg font-black italic text-gw-text uppercase tracking-tight">Create Session</h4>
               <p class="text-[13px] text-gw-text-muted">Host your own room</p>
            </div>
         </a>

         <a routerLink="/scripts" class="gw-card flex items-center gap-5 hover:border-gw-primary transition-all group active:scale-[0.98]">
            <div class="w-14 h-14 bg-gw-primary/10 text-gw-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <i-lucide [img]="BookIcon" size="32"></i-lucide>
            </div>
            <div>
               <h4 class="text-lg font-black italic text-gw-text uppercase tracking-tight">Scripts</h4>
               <p class="text-[13px] text-gw-text-muted">Browse conversations</p>
            </div>
         </a>

         <a routerLink="/user/progress" class="gw-card flex items-center gap-5 hover:border-gw-primary transition-all group active:scale-[0.98]">
            <div class="w-14 h-14 bg-gw-accent/10 text-gw-accent rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <i-lucide [img]="TrendIcon" size="32"></i-lucide>
            </div>
            <div>
               <h4 class="text-lg font-black italic text-gw-text uppercase tracking-tight">My Progress</h4>
               <p class="text-[13px] text-gw-text-muted">View scores & badges</p>
            </div>
         </a>
      </div>

      <!-- Recent Sessions -->
      <div class="space-y-4">
         <div class="flex items-center justify-between px-1">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-gw-text-muted italic">Recent Sessions</h3>
            <a routerLink="/session/history" class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic underline underline-offset-4">View All →</a>
         </div>
         
         <div class="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            @for (session of dashboard()?.recentSessions; track session.id) {
               <div class="min-w-[240px] gw-card p-4 space-y-4 shrink-0 hover:shadow-lg transition-all border-b-4 border-b-gw-primary/20">
                  <div class="flex items-center justify-between">
                     <span class="text-[10px] font-black text-gw-primary uppercase tracking-widest italic bg-gw-primary/10 px-2 py-0.5 rounded-full">Grammar Drill</span>
                     <span class="text-[10px] font-bold text-gw-text-muted">{{ session.date | date:'MMM d' }}</span>
                  </div>
                  <h4 class="text-sm font-black italic text-gw-text leading-tight uppercase">{{ session.title }}</h4>
                  <div class="flex items-center justify-between pt-2 border-t border-gw-bg">
                     <div class="flex flex-col">
                        <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</span>
                        <span class="text-sm font-black italic text-gw-primary">{{ session.score }}%</span>
                     </div>
                     <div class="flex flex-col items-end">
                        <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</span>
                        <span class="text-sm font-black italic text-gw-error">3</span>
                     </div>
                  </div>
               </div>
            }
         </div>
      </div>

      <!-- Pending Mistakes -->
      <div class="space-y-4 pb-24">
         <div class="flex items-center justify-between px-1">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-gw-text-muted italic">My Pending Mistakes</h3>
            <a routerLink="/user/my-mistakes" class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic underline underline-offset-4">View All →</a>
         </div>

         <div class="space-y-3">
            @for (mistake of dashboard()?.recentMistakes || []; track $index) {
               <div class="gw-card p-4 flex items-center justify-between gap-4">
                  <div class="flex-1 min-w-0">
                     <p class="text-sm italic font-bold text-gw-text truncate">"{{ mistake.text }}"</p>
                     <p class="text-[10px] font-black uppercase tracking-widest text-gw-error mt-1 italic">{{ mistake.type }}</p>
                  </div>
                  <button class="shrink-0 h-9 px-4 border-2 border-gw-primary text-gw-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-gw-primary hover:text-white transition-all">
                     Practice
                  </button>
               </div>
            } @empty {
               <div class="gw-card p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed bg-ls-bg/50">
                  <p class="text-xs font-black uppercase tracking-widest text-gw-text-muted italic">No pending mistakes. Great job!</p>
               </div>
            }
         </div>
      </div>

      <!-- Motivational Footer -->
      <div class="mt-8 p-6 bg-gw-primary/5 rounded-2xl border-l-[6px] border-gw-primary relative overflow-hidden">
         <i-lucide [img]="InfoIcon" size="64" class="absolute -right-4 -bottom-4 opacity-[0.03] text-gw-primary"></i-lucide>
         <p class="text-xs font-bold text-gw-text italic leading-relaxed">
            <span class="font-black uppercase tracking-widest text-gw-primary block mb-1">Fluency Tip:</span>
            Try to speak without pausing or using filler words like "um" or "uh". Even if you make a mistake, keeping the flow high improves your dynamic fluency score!
         </p>
      </div>
    </div>
  `,
  styles: [``]
})
export class UserDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);

  user = signal(this.auth.currentUser);
  dashboard = signal<any>(null);
  today = new Date();

  readonly FlameIcon = Flame;
  readonly ZapIcon = Zap;
  readonly TrophyIcon = Trophy;
  readonly TrendIcon = TrendingUp;
  readonly PlayIcon = Gamepad2;
  readonly AddIcon = PlusCircle;
  readonly BookIcon = Book;
  readonly ChevronIcon = ChevronRight;
  readonly InfoIcon = AlertCircle;

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  ngOnInit() {
    this.userService.getDashboard().subscribe(res => {
      // Mock some mistakes if none returned
      if (!res.recentMistakes) {
        res.recentMistakes = [
          { text: 'I have been to there yesterday', type: 'GRAMMAR' },
          { text: 'He did not went to school', type: 'GRAMMAR' },
          { text: 'Un-clear pronun-ciation', type: 'PRONUNCIATION' }
        ];
      }
      this.dashboard.set(res);
    });
  }
}

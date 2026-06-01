// File: src/app/modules/user/dashboard/user-dashboard.component.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Flame, Zap, Trophy, TrendingUp, Gamepad2, PlusCircle,
  Book, ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

        <!-- ── Greeting Header ──────────────────────────────────────── -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight leading-tight">
              {{ greeting }}, {{ firstName() }}
            </h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">
              {{ today | date:'EEEE, MMMM d' }}
            </p>
          </div>
          <!-- Streak chip — from cached state, no API call -->
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
               style="background: rgba(245,158,11,0.1);">
            <i-lucide [img]="FlameIcon" size="14" style="color:#F59E0B;"></i-lucide>
            <span class="text-xs font-black" style="color:#F59E0B;">
              {{ dashboard()?.currentStreak || 0 }} Day Streak
            </span>
          </div>
        </div>

        <!-- ── Pending Repractice Alert ─────────────────────────────── -->
        @if ((dashboard()?.pendingRepracticeCount || 0) > 0) {
          <a routerLink="/user/progress"
             class="flex items-center justify-between gap-3 px-4 py-3.5
                    bg-white rounded-2xl border border-gw-card-border shadow-sm
                    hover:border-gw-primary transition-colors group no-underline">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                   style="background: rgba(61,90,153,0.08);">
                <i-lucide [img]="AlertIcon" size="15" style="color:#3D5A99;"></i-lucide>
              </div>
              <div>
                <p class="text-sm font-bold text-gw-text">Correction rounds waiting</p>
                <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5">
                  {{ dashboard()?.pendingRepracticeCount }} rounds ready to practice
                </p>
              </div>
            </div>
            <div class="w-7 h-7 rounded-lg flex items-center justify-center
                        bg-gw-primary text-white shrink-0 group-hover:opacity-90 transition-opacity">
              <i-lucide [img]="ChevronIcon" size="14"></i-lucide>
            </div>
          </a>
        }

        <!-- ── Quick Actions ─────────────────────────────────────────── -->
        <div class="grid grid-cols-4 gap-2.5">

          <a routerLink="/session/join"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(61,90,153,0.08);">
              <i-lucide [img]="PlayIcon" size="20" style="color:#3D5A99;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Join
            </span>
          </a>

          <a routerLink="/session/create"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(224,123,57,0.08);">
              <i-lucide [img]="AddIcon" size="20" style="color:#E07B39;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Create
            </span>
          </a>

          <a routerLink="/scripts"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(46,125,50,0.08);">
              <i-lucide [img]="BookIcon" size="20" style="color:#2E7D32;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Scripts
            </span>
          </a>

          <a routerLink="/user/progress"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(245,158,11,0.08);">
              <i-lucide [img]="TrendIcon" size="20" style="color:#F59E0B;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Progress
            </span>
          </a>

        </div>

        <!-- ── Recent Sessions ───────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">
              Recent Sessions
            </p>
            <a routerLink="/session/history"
               class="text-[10px] font-bold text-gw-primary hover:underline no-underline">
              View All
            </a>
          </div>

          @if ((dashboard()?.recentSessions?.length || 0) === 0) {
            <div class="flex flex-col items-center justify-center py-8 gap-2">
              <div class="w-10 h-10 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="TrophyIcon" size="18" class="text-gw-text-muted"></i-lucide>
              </div>
              <p class="text-xs font-semibold text-gw-text-muted">No sessions yet</p>
            </div>
          } @else {
            <div class="divide-y divide-gw-bg">
              @for (session of dashboard()?.recentSessions?.slice(0, 3); track session.sessionId) {
                <div class="flex items-center gap-3 px-5 py-3.5">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gw-text truncate">{{ session.sessionName }}</p>
                    <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5">
                      {{ session.createdDate | date:'MMM d, yyyy' }}
                    </p>
                  </div>
                  <span class="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                        [style.background]="getScoreBg(session.myScore)"
                        [style.color]="getScoreColor(session.myScore)">
                    {{ session.myScore || 0 }}%
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- ── Pending Mistakes ──────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">
              Pending Mistakes
            </p>
            <a routerLink="/user/my-mistakes"
               class="text-[10px] font-bold text-gw-primary hover:underline no-underline">
              View All
            </a>
          </div>

          @if ((dashboard()?.pendingMistakes?.length || 0) === 0) {
            <div class="flex flex-col items-center justify-center py-8 gap-2">
              <div class="w-10 h-10 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="CheckIcon" size="18" class="text-gw-text-muted"></i-lucide>
              </div>
              <p class="text-xs font-semibold text-gw-text-muted">No pending mistakes</p>
            </div>
          } @else {
            <div class="divide-y divide-gw-bg">
              @for (mistake of dashboard()?.pendingMistakes?.slice(0, 3); track $index) {
                <div class="flex items-center gap-3 px-5 py-3.5">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gw-text truncate">"{{ mistake.text }}"</p>
                    <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5 uppercase tracking-wide">
                      {{ mistake.type }}
                    </p>
                  </div>
                  <a routerLink="/user/my-mistakes"
                     class="shrink-0 h-8 px-3 rounded-xl text-[10px] font-bold
                            bg-gw-primary text-white flex items-center
                            hover:opacity-90 transition-opacity no-underline">
                    Practice
                  </a>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class UserDashboardComponent {
  private auth      = inject(AuthService);
  private userState = inject(UserStateService);

  today = new Date();

  // ── Read directly from state service — no API calls here ──────
  dashboard = this.userState.dashboard;

  firstName = computed(() => {
    const name = this.auth.currentUser?.fullName?.trim();
    return name ? name.split(/\s+/)[0] : 'there';
  });

  readonly FlameIcon  = Flame;
  readonly ZapIcon    = Zap;
  readonly TrophyIcon = Trophy;
  readonly TrendIcon  = TrendingUp;
  readonly PlayIcon   = Gamepad2;
  readonly AddIcon    = PlusCircle;
  readonly BookIcon   = Book;
  readonly ChevronIcon = ChevronRight;
  readonly AlertIcon  = AlertCircle;
  readonly CheckIcon  = CheckCircle2;

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getScoreBg(score: number): string {
    if (score >= 80) return '#DCFCE7';
    if (score >= 60) return '#FEF3C7';
    return '#FEE2E2';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#166534';
    if (score >= 60) return '#92400E';
    return '#991B1B';
  }
}

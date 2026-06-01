// File: src/app/modules/session/session-report/session-report.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LiveSessionService } from '../../live-session/live-session.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { SessionSummary, MemberScore } from '@core/models/voice.model';
import { LucideAngularModule, CheckCircle2, Trophy, Clock, Target, Zap, ChevronRight, Home, Layout, TrendingUp, RefreshCw, AlertCircle } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';

interface ScoreboardRow {
  name: string;
  fluency: number;
  confidence: number;
  rating: string;
  ratingColor: string;
  mistakes: number;
  listenerRating: number;
}

@Component({
  selector: 'app-session-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg pb-32">

      <!-- ── Loading ── -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center gap-4 py-32">
          <div class="w-12 h-12 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading results...</p>
        </div>
      }

      <!-- ── Error ── -->
      @else if (loadError()) {
        <div class="flex flex-col items-center justify-center gap-6 py-32 text-center px-6">
          <div class="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <i-lucide [img]="ErrorIcon" size="28" class="text-red-500"></i-lucide>
          </div>
          <div>
            <p class="text-lg font-black uppercase tracking-widest italic text-gw-text mb-2">Could not load results</p>
            <p class="text-sm text-gw-text-muted italic">The session may still be processing. Try again shortly.</p>
          </div>
          <button (click)="retryLoad()"
            class="flex items-center gap-2 px-6 py-3 bg-gw-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest italic hover:opacity-90 transition-all">
            <i-lucide [img]="RetryIcon" size="14"></i-lucide>
            Retry
          </button>
        </div>
      }

      <!-- ── Report ── -->
      @else if (summary()) {
        <div class="space-y-10 animate-in zoom-in-95 duration-500 px-4 max-w-3xl mx-auto pt-10">

          <!-- Success Header -->
          <div class="flex flex-col items-center gap-5 py-6 text-center">
            <div class="w-20 h-20 bg-gw-success/10 rounded-[36px] flex items-center justify-center shadow-xl shadow-gw-success/5 animate-bounce">
              <i-lucide [img]="SuccessIcon" size="40" class="text-gw-success"></i-lucide>
            </div>
            <div class="space-y-1.5">
              <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tight">SESSION COMPLETE!</h2>
              <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">Great progress today — flow forward!</p>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div class="bg-white p-5 rounded-[28px] border border-gw-card-border shadow-sm space-y-1">
              <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Script</span>
              <p class="text-sm font-black text-gw-text italic uppercase leading-tight truncate" [title]="summary()!.scriptTitle">
                {{ summary()!.scriptTitle || '—' }}
              </p>
            </div>

            <div class="bg-[#E07B39]/5 border border-[#E07B39]/20 p-5 rounded-[28px] shadow-sm space-y-1 text-center">
              <span class="text-[8px] font-black uppercase tracking-widest text-[#E07B39] italic">Top Score</span>
              <p class="text-2xl font-black text-[#E07B39] italic">{{ topScore() }}%</p>
            </div>

            <div class="bg-white p-5 rounded-[28px] border border-gw-card-border shadow-sm space-y-1 text-center">
              <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Total Mistakes</span>
              <p class="text-2xl font-black italic"
                 [class.text-gw-error]="summary()!.totalMistakesAllMembers > 0"
                 [class.text-gw-success]="summary()!.totalMistakesAllMembers === 0">
                {{ summary()!.totalMistakesAllMembers }}
              </p>
            </div>

            <div class="bg-white p-5 rounded-[28px] border border-gw-card-border shadow-sm space-y-1 text-center">
              <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Duration</span>
              <p class="text-2xl font-black text-gw-text italic">{{ sessionDuration() }}</p>
            </div>

          </div>

          <!-- Grammar Focus Tag -->
          @if (summary()!.grammarFocusTag) {
            <div class="flex items-center gap-3 px-5 py-4 bg-gw-primary/5 border border-gw-primary/15 rounded-2xl">
              <div class="w-8 h-8 rounded-xl bg-gw-primary/15 flex items-center justify-center flex-shrink-0">
                <i-lucide [img]="TargetIcon" size="15" class="text-gw-primary"></i-lucide>
              </div>
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Grammar Focus</p>
                <p class="text-sm font-black text-gw-primary italic">{{ summary()!.grammarFocusTag }}</p>
              </div>
            </div>
          }

          <!-- Leaderboard -->
          <div class="space-y-4">
            <h3 class="text-base font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-primary pl-4">
              Leaderboard
            </h3>

            @if (scoreboard().length === 0) {
              <div class="py-12 text-center text-gw-text-muted italic text-sm font-bold">
                No member scores recorded for this session.
              </div>
            } @else {
              <div class="bg-white rounded-[32px] border border-gw-card-border overflow-hidden shadow-sm">
                <table class="w-full">
                  <thead>
                    <tr class="bg-gw-bg/60">
                      <th class="px-6 py-4 text-left text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">#</th>
                      <th class="px-6 py-4 text-left text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Member</th>
                      <th class="px-6 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</th>
                      <th class="px-6 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Rating</th>
                      <th class="px-6 py-4 text-center text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gw-bg">
                    @for (row of scoreboard(); track row.name; let i = $index) {
                      <tr class="hover:bg-gw-bg/20 transition-colors" [class.bg-gw-primary/5]="i === 0">
                        <td class="px-6 py-5">
                          @if (i === 0) {
                            <i-lucide [img]="TrophyIcon" size="16" class="text-[#F59E0B]"></i-lucide>
                          } @else {
                            <span class="text-sm font-black italic text-gw-text-muted">{{ i + 1 }}</span>
                          }
                        </td>
                        <td class="px-6 py-5">
                          <div class="flex items-center gap-3">
                            <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + row.name"
                                 class="w-8 h-8 rounded-lg flex-shrink-0"
                                 [alt]="row.name">
                            <span class="font-bold italic text-gw-text text-sm">{{ row.name }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 text-center">
                          <span class="text-sm font-black italic"
                                [class.text-gw-success]="row.fluency >= 80"
                                [class.text-gw-text]="row.fluency < 80">
                            {{ row.fluency }}%
                          </span>
                        </td>
                        <td class="px-6 py-5 text-center">
                          <span class="px-2.5 py-1 rounded-lg text-[9px] font-black italic uppercase tracking-wider"
                                [ngClass]="row.ratingColor">
                            {{ row.rating }}
                          </span>
                        </td>
                        <td class="px-6 py-5 text-center">
                          <span class="text-sm font-black italic"
                                [class.text-gw-error]="row.mistakes > 0"
                                [class.text-gw-success]="row.mistakes === 0">
                            {{ row.mistakes }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Turns Completed Banner -->
          <div class="flex items-center gap-4 px-6 py-5 bg-[#1A1A2E] rounded-[32px] text-white">
            <div class="w-14 h-14 bg-gw-accent/20 rounded-[20px] flex items-center justify-center flex-shrink-0">
              <i-lucide [img]="TrendingIcon" size="26" class="text-gw-accent"></i-lucide>
            </div>
            <div>
              <h4 class="text-base font-black text-gw-accent italic uppercase tracking-tight">SESSION WRAPPED</h4>
              <p class="text-sm font-bold text-white/70 italic leading-snug mt-0.5">
                {{ summary()!.totalTurns }} turn{{ summary()!.totalTurns !== 1 ? 's' : '' }} completed ·
                {{ summary()!.grammarFocusTag || summary()!.scriptTitle || 'Grammar drill' }} ·
                {{ summary()!.memberScores.length }} participant{{ summary()!.memberScores.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <button (click)="startCorrection()"
              [disabled]="isStartingCorrection()"
              class="w-full h-20 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-3xl shadow-2xl shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 group disabled:opacity-60 disabled:pointer-events-none">
              <div class="flex items-center gap-3">
                <i-lucide [img]="ZapIcon" size="22" class="text-gw-accent group-hover:animate-pulse"></i-lucide>
                <span class="text-lg">{{ isStartingCorrection() ? 'STARTING...' : 'START CORRECTION ROUND' }}</span>
              </div>
              <span class="text-[8px] opacity-60 tracking-wider">PRACTICE YOUR PERSONAL MISTAKES</span>
            </button>

            <div class="grid grid-cols-2 gap-3">
              <button [routerLink]="['/session', sessionId(), 'detail']"
                class="h-14 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-2 hover:bg-gw-bg transition-all text-xs">
                <i-lucide [img]="LayoutIcon" size="16"></i-lucide>
                Detailed Report
              </button>
              <button routerLink="/user/dashboard"
                class="h-14 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-2 hover:bg-gw-bg transition-all text-xs">
                <i-lucide [img]="HomeIcon" size="16"></i-lucide>
                Go Home
              </button>
            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
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
  readonly TargetIcon = Target;
  readonly RetryIcon = RefreshCw;
  readonly ErrorIcon = AlertCircle;

  summary = signal<SessionSummary | null>(null);
  isLoading = signal(true);
  loadError = signal(false);
  isStartingCorrection = signal(false);

  private _sessionId = '';
  private _durationSeconds = 0;

  sessionId = signal('');
  sessionDuration = signal('--:--');

  // ── Computed scoreboard — sorted by fluency descending, fully from API data ──
  scoreboard = computed<ScoreboardRow[]>(() => {
    const scores = this.summary()?.memberScores ?? [];
    return [...scores]
      .sort((a, b) => b.fluencyScore - a.fluencyScore)
      .map(m => ({
        name: m.fullName,
        fluency: Math.round(m.fluencyScore),
        confidence: Math.round(m.confidenceScore),
        rating: this.resolveRating(m.fluencyScore),
        ratingColor: this.resolveRatingColor(m.fluencyScore),
        mistakes: m.mistakeCount,
        listenerRating: m.listenerRating
      }));
  });

  // Top score = highest fluency among all members
  topScore = computed<number>(() => {
    const scores = this.summary()?.memberScores ?? [];
    if (scores.length === 0) return 0;
    return Math.round(Math.max(...scores.map(m => m.fluencyScore)));
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['sessionId'];
      if (!id) return;

      this._sessionId = id;
      this.sessionId.set(id);

      // ── Restore real session duration saved by session-room on SESSION_ENDED ──
      const durationKey = `gwf_session_duration_${id}`;
      const savedSecs = Number(sessionStorage.getItem(durationKey) ?? '0');
      if (savedSecs > 0) {
        this._durationSeconds = savedSecs;
        this.sessionDuration.set(this.formatDuration(savedSecs));
        // Clean up — no longer needed
        sessionStorage.removeItem(durationKey);
      }

      // ── Try navigation state first (no extra network call) ──
      const navSummary = history.state?.summary as SessionSummary | undefined;
      if (navSummary?.memberScores) {
        this.summary.set(navSummary);
        this.isLoading.set(false);
        return;
      }

      // ── Fallback: fetch via API (handles page refresh, direct URL) ──
      this.fetchSummary(id);
    });
  }

  retryLoad() {
    this.loadError.set(false);
    this.isLoading.set(true);
    this.fetchSummary(this._sessionId);
  }

  private fetchSummary(sessionId: string) {
    this.liveSessionService.completeSession(sessionId).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  startCorrection() {
    const id = Number(this._sessionId) || 0;
    if (!id) return;

    this.isStartingCorrection.set(true);
    this.repracticeService.generateRepracticeSession(id).subscribe({
      next: (res) => {
        this.router.navigate(['/repractice', res.repracticeSessionId]);
      },
      error: () => {
        this.isStartingCorrection.set(false);
        this.toast.show('Could not start correction round. Please try again.', 'error');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private resolveRating(fluencyScore: number): string {
    if (fluencyScore >= 90) return 'Excellent';
    if (fluencyScore >= 75) return 'Great';
    if (fluencyScore >= 60) return 'Good';
    return 'Improving';
  }

  private resolveRatingColor(fluencyScore: number): string {
    if (fluencyScore >= 90) return 'bg-emerald-100 text-emerald-700';
    if (fluencyScore >= 75) return 'bg-blue-100 text-blue-700';
    if (fluencyScore >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  private formatDuration(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

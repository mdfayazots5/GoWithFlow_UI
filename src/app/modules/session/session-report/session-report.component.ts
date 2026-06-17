// File: src/app/modules/session/session-report/session-report.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LiveSessionService } from '../../live-session/live-session.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { SessionSummary, MemberScore } from '@core/models/voice.model';
import { LucideAngularModule, CheckCircle2, Trophy, Clock, Target, Zap, ChevronRight, Home, Layout, TrendingUp, RefreshCw, AlertCircle, BookOpen, Bot } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

interface ScoreboardRow {
  name: string;
  avatarUrl: string | null;
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
  imports: [CommonModule, LucideAngularModule, RouterLink, UserAvatarComponent],
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
        <div class="space-y-6 animate-in zoom-in-95 duration-500 px-4 max-w-3xl mx-auto pt-6">

          <!-- Success Header -->
          <div class="flex flex-col items-center gap-3 py-2 text-center">
            <div class="w-16 h-16 bg-gw-success/10 rounded-[28px] flex items-center justify-center shadow-lg shadow-gw-success/5 animate-bounce">
              <i-lucide [img]="SuccessIcon" size="32" class="text-gw-success"></i-lucide>
            </div>
            <div class="space-y-1">
              <h2 class="text-[26px] leading-none font-black text-gw-text italic uppercase tracking-tight">SESSION COMPLETE!</h2>
              <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest italic">Great progress today — flow forward!</p>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

            <div class="bg-white p-4 rounded-2xl border border-gw-card-border shadow-sm space-y-1">
              <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Script</span>
              <p class="text-[13px] font-black text-gw-text italic uppercase leading-tight truncate" [title]="summary()!.scriptTitle">
                {{ summary()!.scriptTitle || '—' }}
              </p>
            </div>

            <div class="bg-[#E07B39]/5 border border-[#E07B39]/20 p-4 rounded-2xl shadow-sm space-y-1 text-center">
              <span class="text-[10px] font-black uppercase tracking-widest text-[#E07B39] italic">Top Score</span>
              <p class="text-[22px] leading-none font-black text-[#E07B39] italic">{{ topScore() }}%</p>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-gw-card-border shadow-sm space-y-1 text-center">
              <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Total Mistakes</span>
              <p class="text-[22px] leading-none font-black italic"
                 [class.text-gw-error]="summary()!.totalMistakesAllMembers > 0"
                 [class.text-gw-success]="summary()!.totalMistakesAllMembers === 0">
                {{ summary()!.totalMistakesAllMembers }}
              </p>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-gw-card-border shadow-sm space-y-1 text-center">
              <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Duration</span>
              <p class="text-[22px] leading-none font-black text-gw-text italic">{{ sessionDuration() }}</p>
            </div>

          </div>

          <!-- Grammar Focus Tag -->
          @if (summary()!.grammarFocusTag) {
            <div class="flex items-center gap-3 px-5 py-4 bg-gw-primary/5 border border-gw-primary/15 rounded-2xl">
              <div class="w-8 h-8 rounded-xl bg-gw-primary/15 flex items-center justify-center flex-shrink-0">
                <i-lucide [img]="TargetIcon" size="15" class="text-gw-primary"></i-lucide>
              </div>
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Grammar Focus</p>
                <p class="text-sm font-black text-gw-primary italic">{{ summary()!.grammarFocusTag }}</p>
              </div>
            </div>
          }

          <!-- Leaderboard -->
          <div class="space-y-3">
            <h3 class="text-sm font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-primary pl-3">
              Leaderboard
            </h3>

            @if (scoreboard().length === 0) {
              <div class="py-10 text-center text-gw-text-muted italic text-[13px] font-bold">
                No member scores recorded for this session.
              </div>
            } @else {
              <!-- Mobile: stacked cards (no horizontal scroll) -->
              <div class="space-y-2 md:hidden">
                @for (row of scoreboard(); track row.name; let i = $index) {
                  <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm px-3.5 py-3 flex items-center gap-3"
                       [ngClass]="{'ring-2 ring-gw-primary/25': i === 0}">
                    <div class="w-6 flex items-center justify-center shrink-0">
                      @if (i === 0) {
                        <i-lucide [img]="TrophyIcon" size="16" class="text-[#F59E0B]"></i-lucide>
                      } @else {
                        <span class="text-[13px] font-black italic text-gw-text-muted">{{ i + 1 }}</span>
                      }
                    </div>
                    <app-user-avatar [name]="row.name" [avatarUrl]="row.avatarUrl" size="xs"></app-user-avatar>
                    <div class="flex-1 min-w-0">
                      <p class="text-[13px] font-bold italic text-gw-text truncate">{{ row.name }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black italic uppercase tracking-wider" [ngClass]="row.ratingColor">{{ row.rating }}</span>
                        <span class="text-[11px] font-bold italic"
                              [class.text-gw-error]="row.mistakes > 0"
                              [class.text-gw-text-muted]="row.mistakes === 0">
                          {{ row.mistakes }} mistake{{ row.mistakes === 1 ? '' : 's' }}
                        </span>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-[20px] leading-none font-black italic"
                         [class.text-gw-success]="row.fluency >= 80"
                         [class.text-gw-text]="row.fluency < 80">{{ row.fluency }}%</p>
                      <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic mt-0.5">Fluency</p>
                    </div>
                  </div>
                }
              </div>

              <!-- Desktop: full table -->
              <div class="hidden md:block bg-white rounded-[32px] border border-gw-card-border overflow-hidden shadow-sm">
                <table class="w-full">
                  <thead>
                    <tr class="bg-gw-bg/60">
                      <th class="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">#</th>
                      <th class="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Member</th>
                      <th class="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Fluency</th>
                      <th class="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Rating</th>
                      <th class="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Mistakes</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gw-bg">
                    @for (row of scoreboard(); track row.name; let i = $index) {
                      <tr class="hover:bg-gw-bg/20 transition-colors" [ngClass]="{'bg-gw-primary/5': i === 0}">
                        <td class="px-6 py-5">
                          @if (i === 0) {
                            <i-lucide [img]="TrophyIcon" size="16" class="text-[#F59E0B]"></i-lucide>
                          } @else {
                            <span class="text-sm font-black italic text-gw-text-muted">{{ i + 1 }}</span>
                          }
                        </td>
                        <td class="px-6 py-5">
                          <div class="flex items-center gap-3">
                            <app-user-avatar [name]="row.name" [avatarUrl]="row.avatarUrl" size="xs"></app-user-avatar>
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
                          <span class="px-2.5 py-1 rounded-lg text-[11px] font-black italic uppercase tracking-wider"
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

          <!-- Vocabulary Summary (Vocabulary Sprint sessions only) -->
          @if (summary()?.vocabularySummary) {
            <div class="flex items-start gap-4 px-5 py-4 bg-gw-primary/5 border border-gw-primary/15 rounded-2xl">
              <div class="w-9 h-9 rounded-xl bg-gw-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i-lucide [img]="VocabIcon" size="18" class="text-gw-primary"></i-lucide>
              </div>
              <div class="space-y-1.5 min-w-0">
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-primary italic">Vocabulary Tracker</p>
                <p class="text-sm font-bold text-gw-text italic leading-snug">
                  You practiced
                  <span class="font-black text-gw-primary">{{ summary()!.vocabularySummary!.wordsPracticedThisSession }} word{{ summary()!.vocabularySummary!.wordsPracticedThisSession !== 1 ? 's' : '' }}</span>
                  today. Your vocabulary bank has
                  <span class="font-black text-gw-text">{{ summary()!.vocabularySummary!.totalWordsInBank }}</span> words total.
                  @if (summary()!.vocabularySummary!.wordsDueForReview > 0) {
                    <span class="text-gw-accent font-black">{{ summary()!.vocabularySummary!.wordsDueForReview }} are due for review.</span>
                  }
                </p>
                @if (summary()!.vocabularySummary!.wordsPracticed.length > 0) {
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    @for (word of summary()!.vocabularySummary!.wordsPracticed; track word) {
                      <span class="px-2.5 py-1 bg-gw-primary/10 border border-gw-primary/20 rounded-full text-[11px] font-black text-gw-primary uppercase tracking-wider">
                        {{ word }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Facilitator Section (only shown when session had facilitator roles) -->
          @if (facilitators().length > 0) {
            <div class="flex items-center gap-3 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl">
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic mb-1">Facilitator</p>
                <div class="flex flex-wrap gap-2">
                  @for (name of facilitators(); track name) {
                    <span class="px-3 py-1 rounded-lg text-[11px] font-black italic uppercase tracking-wider bg-gw-bg border border-gw-card-border text-gw-text-muted">
                      {{ name }} — Facilitator
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          <!-- AI Voice Participant (Phase 17 — narrated, not scored) -->
          @if (aiPartners().length > 0) {
            <div class="flex items-center gap-3 px-4 py-3.5 bg-gw-primary/5 border border-gw-primary/15 rounded-2xl">
              <div class="w-9 h-9 rounded-xl bg-gw-primary/15 flex items-center justify-center flex-shrink-0">
                <i-lucide [img]="BotIcon" size="18" class="text-gw-primary"></i-lucide>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">AI Partner</p>
                <p class="text-[13px] font-black text-gw-primary italic truncate">
                  {{ aiPartners().join(', ') }}
                </p>
                <p class="text-[11px] font-bold text-gw-text-muted italic leading-snug">Read the script aloud — not scored</p>
              </div>
            </div>
          }

          <!-- Turns Completed Banner -->
          <div class="flex items-center gap-4 px-5 py-4 bg-[#1A1A2E] rounded-[28px] text-white">
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
              <span class="text-[11px] opacity-60 tracking-wider">PRACTICE YOUR PERSONAL MISTAKES</span>
            </button>

            <div class="grid grid-cols-2 gap-3">
              <button [routerLink]="['/session/detail', sessionId()]"
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
  readonly VocabIcon = BookOpen;
  readonly BotIcon = Bot;

  summary = signal<SessionSummary | null>(null);
  isLoading = signal(true);
  loadError = signal(false);
  isStartingCorrection = signal(false);

  private _sessionId = '';
  private _durationSeconds = 0;

  sessionId = signal('');
  sessionDuration = signal('--:--');

  // ── Computed scoreboard — performance members only, sorted by fluency descending ──
  scoreboard = computed<ScoreboardRow[]>(() => {
    const scores = this.summary()?.memberScores ?? [];
    return [...scores]
      .filter(m => !m.isFacilitator && !m.isAi)
      .sort((a, b) => b.fluencyScore - a.fluencyScore)
      .map(m => ({
        name: m.fullName,
        avatarUrl: m.avatarUrl ?? null,
        fluency: Math.round(m.fluencyScore),
        confidence: Math.round(m.confidenceScore),
        rating: this.resolveRating(m.fluencyScore),
        ratingColor: this.resolveRatingColor(m.fluencyScore),
        mistakes: m.mistakeCount,
        listenerRating: m.listenerRating
      }));
  });

  // Facilitator members listed separately (they facilitated but were not scored)
  facilitators = computed<string[]>(() => {
    const scores = this.summary()?.memberScores ?? [];
    return scores.filter(m => m.isFacilitator && !m.isAi).map(m => m.fullName);
  });

  // AI Voice Participant(s) — narrated, not scored (Phase 17). Shown as an AI partner chip.
  aiPartners = computed<string[]>(() => {
    const scores = this.summary()?.memberScores ?? [];
    return scores.filter(m => m.isAi).map(m => m.fullName);
  });

  // Top score = highest fluency among scored (human) performers only
  topScore = computed<number>(() => {
    const scores = this.summary()?.memberScores ?? [];
    const performers = scores.filter(m => !m.isFacilitator && !m.isAi);
    if (performers.length === 0) return 0;
    return Math.round(Math.max(...performers.map(m => m.fluencyScore)));
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

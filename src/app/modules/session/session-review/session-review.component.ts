// File: src/app/modules/session/session-review/session-review.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LiveSessionService } from '../../live-session/live-session.service';
import { SessionReview, SessionReviewTurn, GrammarError } from '@core/models/voice.model';
import { LucideAngularModule, CheckCircle2, AlertTriangle, Mic, MicOff, Zap, BookOpen, Play } from 'lucide-angular';
import { catchError, of } from 'rxjs';
import { AudioArchiveService } from '@core/services/audio-archive.service';

@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg pb-32">

      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gw-bg/95 backdrop-blur border-b border-gw-card-border">
        <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div class="min-w-0">
            <h2 class="text-base font-black text-gw-text italic uppercase tracking-tight truncate">
              {{ review()?.scriptTitle || 'Session Review' }}
            </h2>
            <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest">
              {{ review()?.category }} · {{ review()?.grammarFocusTag }}
            </p>
          </div>
          @if (review()) {
            <div class="ml-auto shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl"
                 [class]="avgScoreBg(review()!.averageOverallScore)">
              <i-lucide [img]="ZapIcon" size="13" [class]="avgScoreColor(review()!.averageOverallScore)"></i-lucide>
              <span class="text-xs font-black" [class]="avgScoreColor(review()!.averageOverallScore)">
                {{ review()!.averageOverallScore | number:'1.0-0' }}%
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-32 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading review...</p>
        </div>
      }

      <!-- Error -->
      @else if (loadError()) {
        <div class="flex flex-col items-center justify-center py-32 gap-4 text-center px-6">
          <p class="text-base font-black text-gw-text italic">Could not load review</p>
          <p class="text-sm text-gw-text-muted italic">{{ loadError() }}</p>
        </div>
      }

      <!-- Review Content -->
      @else if (review()) {
        <div class="max-w-3xl mx-auto px-4 pt-6 space-y-3">

          <!-- Score Summary Bar -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="bg-white border border-gw-card-border rounded-2xl p-4 text-center">
              <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Turns</p>
              <p class="text-2xl font-black text-gw-text italic">{{ review()!.totalTurns }}</p>
            </div>
            <div class="bg-white border border-gw-card-border rounded-2xl p-4 text-center">
              <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Avg Score</p>
              <p class="text-2xl font-black italic" [class]="avgScoreColor(review()!.averageOverallScore)">
                {{ review()!.averageOverallScore | number:'1.0-0' }}%
              </p>
            </div>
            <div class="bg-white border border-gw-card-border rounded-2xl p-4 text-center">
              <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Errors</p>
              <p class="text-2xl font-black italic"
                 [class.text-gw-error]="totalErrors() > 0"
                 [class.text-gw-success]="totalErrors() === 0">
                {{ totalErrors() }}
              </p>
            </div>
          </div>

          <!-- Turn-by-Turn Transcript -->
          @for (turn of review()!.turns; track turn.turnIndex) {
            <div class="bg-white border rounded-2xl overflow-hidden transition-all"
                 [class.border-gw-card-border]="!turn.isFacilitatorTurn"
                 [class.border-white]="turn.isFacilitatorTurn"
                 [class.opacity-60]="turn.isFacilitatorTurn">

              <!-- Turn header -->
              <div class="flex items-center justify-between px-4 py-2.5 border-b"
                   [class.border-gw-bg]="!turn.isFacilitatorTurn"
                   [class.border-transparent]="turn.isFacilitatorTurn"
                   [ngClass]="{'bg-gw-bg/50': !turn.isFacilitatorTurn}"
                   [class.bg-white]="turn.isFacilitatorTurn">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">
                    Turn {{ turn.turnIndex }}
                  </span>
                  <span class="px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                        [ngClass]="{'bg-gw-primary/10': !turn.isFacilitatorTurn}"
                        [class.text-gw-primary]="!turn.isFacilitatorTurn"
                        [class.bg-gw-bg]="turn.isFacilitatorTurn"
                        [class.text-gw-text-muted]="turn.isFacilitatorTurn">
                    {{ turn.speakerLabel }}
                  </span>
                  @if (turn.isFacilitatorTurn) {
                    <span class="text-[11px] font-bold text-gw-text-muted italic">Facilitator</span>
                  }
                </div>
                @if (!turn.isFacilitatorTurn && turn.wasAnalyzed) {
                  <div class="flex items-center gap-2">
                    @if (getAudioUrl(turn.turnIndex)) {
                      <button (click)="playAudio(getAudioUrl(turn.turnIndex)!)"
                              class="w-7 h-7 rounded-lg bg-gw-primary/10 flex items-center justify-center text-gw-primary hover:bg-gw-primary hover:text-white transition-all"
                              title="Play your recording">
                        <i-lucide [img]="PlayIcon" size="11"></i-lucide>
                      </button>
                    }
                    <span class="text-[11px] font-black italic" [class]="scoreColor(turn.overallScore)">
                      {{ turn.overallScore | number:'1.0-0' }}%
                    </span>
                    <span class="text-[11px] font-bold italic text-gw-text-muted">
                      {{ scoreBand(turn.overallScore) }}
                    </span>
                  </div>
                }
                @if (!turn.isFacilitatorTurn && !turn.wasAnalyzed) {
                  <span class="text-[11px] font-bold text-gw-text-muted italic">Skipped</span>
                }
              </div>

              <div class="px-4 py-3 space-y-3">

                <!-- Expected text (what they should have said) -->
                <p class="text-sm font-semibold text-gw-text italic leading-snug">
                  "{{ turn.englishText }}"
                </p>

                <!-- Transcribed text (what was spoken) — only for analyzed turns -->
                @if (!turn.isFacilitatorTurn && turn.wasAnalyzed && turn.transcribedText) {
                  <div class="space-y-1">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">What you said</p>
                    <p class="text-sm text-gw-text/75 italic leading-snug">
                      "{{ turn.transcribedText }}"
                    </p>
                  </div>
                }

                <!-- Metrics row — for analyzed performance turns -->
                @if (!turn.isFacilitatorTurn && turn.wasAnalyzed) {
                  <div class="flex flex-wrap gap-2">
                    <span class="text-[11px] font-bold text-gw-text-muted px-2 py-1 bg-gw-bg rounded-lg">
                      Fluency {{ turn.fluencyScore | number:'1.0-0' }}%
                    </span>
                    <span class="text-[11px] font-bold text-gw-text-muted px-2 py-1 bg-gw-bg rounded-lg">
                      Confidence {{ turn.confidenceScore | number:'1.0-0' }}%
                    </span>
                    @if (turn.speakingSpeedWpm > 0) {
                      <span class="text-[11px] font-bold text-gw-text-muted px-2 py-1 bg-gw-bg rounded-lg">
                        {{ turn.speakingSpeedWpm }} wpm
                      </span>
                    }
                  </div>
                }

                <!-- Grammar errors -->
                @if (turn.grammarErrors.length > 0) {
                  <div class="space-y-1.5">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-error italic">Grammar Errors</p>
                    @for (err of turn.grammarErrors; track $index) {
                      <div class="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                        <i-lucide [img]="ErrorIcon" size="12" class="text-gw-error mt-0.5 flex-shrink-0"></i-lucide>
                        <div class="min-w-0">
                          <span class="text-[11px] font-bold text-gw-error line-through">{{ err.spokenPhrase }}</span>
                          <span class="text-[11px] text-gw-text-muted mx-1.5">→</span>
                          <span class="text-[11px] font-bold text-gw-success">{{ err.expectedPhrase }}</span>
                          @if (err.errorType) {
                            <span class="ml-2 text-[11px] font-bold text-gw-text-muted uppercase tracking-wider">({{ err.errorType }})</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Hesitation words -->
                @if (turn.hesitationWords.length > 0) {
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[11px] font-black uppercase tracking-widest text-amber-600 italic">Hesitations:</span>
                    @for (word of turn.hesitationWords; track $index) {
                      <span class="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-700">
                        {{ word }}
                      </span>
                    }
                  </div>
                }

                <!-- Pronunciation issues -->
                @if (turn.pronunciationIssues.length > 0) {
                  <div class="space-y-1">
                    <p class="text-[11px] font-black uppercase tracking-widest text-purple-600 italic">Pronunciation</p>
                    @for (pi of turn.pronunciationIssues; track $index) {
                      <div class="flex items-center gap-2 text-[11px] text-gw-text-muted italic">
                        <span class="font-bold text-purple-600">{{ pi.word }}</span>
                        @if (pi.expectedPhonetic) {
                          <span class="text-gw-text-muted">→ {{ pi.expectedPhonetic }}</span>
                        }
                        @if (pi.issueNote) {
                          <span class="text-purple-600/70">{{ pi.issueNote }}</span>
                        }
                      </div>
                    }
                  </div>
                }

              </div>
            </div>
          }

        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SessionReviewComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private liveSessionService = inject(LiveSessionService);
  private audioArchiveSvc = inject(AudioArchiveService);

  readonly CheckIcon   = CheckCircle2;
  readonly ErrorIcon   = AlertTriangle;
  readonly MicIcon     = Mic;
  readonly MicOffIcon  = MicOff;
  readonly ZapIcon     = Zap;
  readonly BookIcon    = BookOpen;
  readonly PlayIcon    = Play;

  review     = signal<SessionReview | null>(null);
  isLoading  = signal(true);
  loadError  = signal<string | null>(null);

  // Map of turnIndex → audioUrl for archived clips
  audioClips = signal<Map<number, string>>(new Map());

  totalErrors = computed(() => {
    return (this.review()?.turns ?? []).reduce((sum, t) => sum + t.grammarErrors.length, 0);
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['sessionId'];
      if (id) {
        this.loadReview(id);
        this.loadAudioClips(Number(id));
      }
    });
  }

  private loadReview(sessionId: string) {
    this.liveSessionService.getSessionReview(sessionId).pipe(
      catchError(err => {
        this.loadError.set(err?.error?.message || 'Failed to load session review.');
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.review.set(data);
        this.isLoading.set(false);
      }
    });
  }

  private loadAudioClips(sessionId: number) {
    this.audioArchiveSvc.getSessionClips(sessionId).pipe(catchError(() => of([]))).subscribe(clips => {
      const map = new Map<number, string>();
      for (const clip of clips) {
        map.set(clip.turnIndex, clip.audioUrl);
      }
      this.audioClips.set(map);
    });
  }

  getAudioUrl(turnIndex: number): string | undefined {
    return this.audioClips().get(turnIndex);
  }

  playAudio(audioUrl: string) {
    const audio = new Audio(`/audio-archive/${audioUrl}`);
    audio.play().catch(() => {});
  }

  scoreBand(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Keep Going';
    return 'Try Again';
  }

  scoreColor(score: number): string {
    if (score >= 75) return 'text-gw-success';
    if (score >= 60) return 'text-amber-500';
    return 'text-gw-error';
  }

  avgScoreColor(score: number): string {
    if (score >= 75) return 'text-emerald-700';
    if (score >= 60) return 'text-amber-700';
    return 'text-red-700';
  }

  avgScoreBg(score: number): string {
    if (score >= 75) return 'bg-emerald-50 border border-emerald-200';
    if (score >= 60) return 'bg-amber-50 border border-amber-200';
    return 'bg-red-50 border border-red-200';
  }
}

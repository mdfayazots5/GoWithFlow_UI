// File: src/app/modules/repractice/correction-round/correction-round.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RepracticeService } from '../repractice.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, XCircle, History, Home, TrendingUp, CheckCircle2 } from 'lucide-angular';
import { RepracticeSession, RepracticeUtterance } from '@core/models/mistake.model';
import { RepracticeSpeakerComponent, PracticeAdvancedEvent } from '../repractice-speaker/repractice-speaker.component';

@Component({
  selector: 'app-correction-round',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, RepracticeSpeakerComponent],
  template: `
    <div class="min-h-screen bg-[#1A1A2E] text-white focus-mode animate-in fade-in duration-700 font-sans pb-32">
      <div class="max-w-[480px] mx-auto p-6 flex flex-col min-h-screen">

        <!-- Header -->
        <div class="flex items-center justify-between h-14 border-b border-white/5 mb-6 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-gw-accent/20 rounded-xl flex items-center justify-center text-gw-accent">
              <i-lucide [img]="HistoryIcon" size="18"></i-lucide>
            </div>
            <h2 class="text-base font-black text-white italic uppercase tracking-tighter">CORRECTION ROUND</h2>
          </div>
          @if (!isComplete()) {
            <a routerLink="/user/dashboard"
               class="w-11 h-11 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5">
              <i-lucide [img]="CloseIcon" size="20"></i-lucide>
            </a>
          }
        </div>

        <!-- ── ACTIVE PRACTICE ── -->
        @if (!isComplete()) {

          <!-- Progress Bar -->
          @if (session()) {
            <div class="flex-shrink-0 space-y-2 mb-6">
              <div class="flex justify-between items-center text-[11px] font-black uppercase tracking-widest italic text-white/40">
                <span>MISTAKE {{ currentIndex() + 1 }} OF {{ session()!.utterances.length }}</span>
                <span>{{ resolvedCount() }} RESOLVED</span>
              </div>
              <div class="flex gap-1 h-1">
                @for (i of range(session()!.utterances.length); track i) {
                  <div
                    class="flex-1 rounded-full transition-all duration-500"
                    [ngClass]="i < currentIndex() ? 'bg-[#3D5A99]' : i === currentIndex() ? 'bg-[#E07B39]' : 'bg-white/10'"
                  ></div>
                }
              </div>
            </div>
          }

          <!-- Loading state -->
          @if (isLoading()) {
            <div class="flex flex-col items-center gap-3 py-20">
              <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
              <p class="text-[11px] font-black uppercase tracking-widest italic text-white/40">Loading session...</p>
            </div>
          } @else if (currentUtterance()) {
            <!-- Speaker Component -->
            <app-repractice-speaker
              [utterance]="currentUtterance()!"
              [utteranceIndex]="currentIndex()"
              [totalUtterances]="session()?.utterances?.length ?? 1"
              (practiceAdvanced)="onPracticeAdvanced($event)"
            ></app-repractice-speaker>
          }

        } @else {

          <!-- ── COMPLETION DASHBOARD ── -->
          <div class="flex-1 flex flex-col justify-center gap-10 text-center animate-in zoom-in duration-700">

            <div class="space-y-4">
              <div class="w-20 h-20 bg-gw-success/10 rounded-[32px] flex items-center justify-center text-gw-success mx-auto shadow-2xl shadow-gw-success/5 animate-bounce">
                <i-lucide [img]="CheckIcon" size="40"></i-lucide>
              </div>
              <h3 class="text-3xl font-black text-white italic uppercase tracking-tight">ROUND COMPLETE!</h3>
              <p class="text-sm font-bold text-white/40 uppercase tracking-widest italic">
                You're becoming more fluent every day
              </p>
            </div>

            <div class="bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-6">
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-1">
                  <p class="text-[11px] font-black uppercase tracking-widest text-white/40 italic">Resolved</p>
                  <p class="text-4xl font-black text-gw-success italic">{{ resolvedCount() }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[11px] font-black uppercase tracking-widest text-white/40 italic">Improvement</p>
                  <div class="flex items-center justify-center gap-2 text-gw-accent">
                    <i-lucide [img]="TrendingIcon" size="18"></i-lucide>
                    <p class="text-4xl font-black italic">{{ improvement() }}%</p>
                  </div>
                </div>
              </div>
              <div class="h-px bg-white/5"></div>
              <p class="text-[11px] font-bold text-white/50 italic leading-relaxed">
                "Consistency is the key to fluency. Keep practicing your corrections."
              </p>
            </div>

            <div class="space-y-3">
              <button
                (click)="restartRound()"
                class="w-full h-14 bg-[#3D5A99] text-white font-black uppercase tracking-widest italic rounded-2xl
                       shadow-xl shadow-[#3D5A99]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                PRACTICE AGAIN
              </button>
              <a
                routerLink="/user/dashboard"
                class="w-full h-14 bg-white/5 text-white/60 font-black uppercase tracking-widest italic rounded-2xl
                       flex items-center justify-center gap-3
                       hover:bg-white/10 transition-all border border-white/10"
              >
                <i-lucide [img]="HomeIcon" size="18"></i-lucide>
                EXIT TO DASHBOARD
              </a>
            </div>

          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .focus-mode { background-color: #1A1A2E; }
  `]
})
export class CorrectionRoundComponent implements OnInit {
  private route             = inject(ActivatedRoute);
  private repracticeService = inject(RepracticeService);
  private toast             = inject(ToastService);

  readonly HistoryIcon  = History;
  readonly CloseIcon    = XCircle;
  readonly CheckIcon    = CheckCircle2;
  readonly TrendingIcon = TrendingUp;
  readonly HomeIcon     = Home;

  session         = signal<RepracticeSession | null>(null);
  currentIndex    = signal(0);
  currentUtterance = signal<RepracticeUtterance | null>(null);
  isLoading       = signal(true);
  isComplete      = signal(false);
  resolvedCount   = signal(0);
  improvement     = signal(0);

  // ─── Resolution is authoritative server-side (2 consecutive scores > 80). We track which
  //     utterance ids the backend has reported as resolved so the live counter is accurate and
  //     never double-counts across retries. No fragile local "consecutive pass" guessing. ──
  private _resolvedIds = new Set<number>();

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['repracticeSessionId'];
      if (id) this.loadSession(id);
    });
  }

  loadSession(id: string) {
    console.log('[Repractice] loading session', { repracticeSessionId: id });
    this.isLoading.set(true);
    this.repracticeService.getRepracticeSession(id).subscribe({
      next: session => {
        console.log('[Repractice] session loaded', {
          repracticeSessionId: session.id,
          utterances: session.utterances.length,
          status: session.status
        });
        this.session.set(session);
        // Seed the resolved set + counter from any already-resolved utterances (e.g. a resumed round).
        this._resolvedIds = new Set(
          session.utterances.filter(u => u.isResolved).map(u => Number(u.id))
        );
        this.resolvedCount.set(this._resolvedIds.size);
        this.currentUtterance.set(session.utterances[0] ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        console.error('[Repractice] session load failed', { repracticeSessionId: id });
        this.toast.show('Could not load practice session.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  // ─── Called by RepracticeSpeakerComponent on done or skip ────────────────────

  onPracticeAdvanced(event: PracticeAdvancedEvent): void {
    const utterance = this.currentUtterance();
    if (!utterance) return;

    const utteranceId = Number(utterance.id);
    console.log('[Repractice] practiceAdvanced', {
      index: this.currentIndex(),
      utteranceId,
      score: event.score,
      skipped: event.skipped
    });

    if (!event.skipped) {
      // Record the attempt. Progression does NOT block on this (matches the Room speaker flow,
      // which advances the turn immediately). The response is the source of truth for resolution.
      this.repracticeService.updateAttempt({
        repracticeUtteranceId: utteranceId,
        score: event.score
      }).subscribe({
        next: (res) => {
          console.log('[Repractice] attempt recorded', res);
          if (res?.isResolved && !this._resolvedIds.has(res.repracticeUtteranceId)) {
            this._resolvedIds.add(res.repracticeUtteranceId);
            this.resolvedCount.set(this._resolvedIds.size);
          }
        },
        error: (err) => {
          // Non-fatal — the user already advanced; resolution will be reconciled at completion.
          console.error('[Repractice] attempt update failed', { utteranceId, err });
        }
      });
    }

    this.advanceToNext();
  }

  private advanceToNext(): void {
    const session = this.session();
    if (!session) return;

    const nextIndex = this.currentIndex() + 1;

    if (nextIndex < session.utterances.length) {
      console.log('[Repractice] advancing', { from: this.currentIndex(), to: nextIndex, total: session.utterances.length });
      this.currentIndex.set(nextIndex);
      this.currentUtterance.set(session.utterances[nextIndex]);
    } else {
      console.log('[Repractice] last utterance reached — finishing', { total: session.utterances.length });
      this.finishSession();
    }
  }

  private finishSession(): void {
    const session = this.session();
    if (!session) return;

    this.repracticeService.completeRepracticeSession(session.id).subscribe({
      next: res => {
        console.log('[Repractice] session complete', res);
        this.improvement.set(res?.improvementPercent ?? 0);
        // Backend-resolved count is authoritative for the completion dashboard.
        if (res?.resolvedCount != null) {
          this.resolvedCount.set(res.resolvedCount);
        }
        this.isComplete.set(true);
      },
      error: (err) => {
        // Still show completion even if the API call fails
        console.error('[Repractice] completion API failed — showing dashboard anyway', err);
        this.isComplete.set(true);
      }
    });
  }

  restartRound(): void {
    const session = this.session();
    if (!session) return;
    console.log('[Repractice] restarting round', { repracticeSessionId: session.id });
    // Reload from the backend so resolved/score state reflects the previous round, then re-seed.
    this.isComplete.set(false);
    this.currentIndex.set(0);
    this.improvement.set(0);
    this.loadSession(session.id);
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}

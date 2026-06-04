import {
  Component, Input, Output, EventEmitter,
  OnChanges, AfterViewChecked, OnDestroy,
  inject, signal, ViewChild, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronRight, RotateCcw, Eye, EyeOff, FastForward, CheckCircle2 } from 'lucide-angular';
import { Capacitor } from '@capacitor/core';
import { RepracticeUtterance } from '@core/models/mistake.model';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { ToastService } from '@core/services/toast.service';
import { VoiceRecognitionEngine, VoiceSessionResult } from '@core/services/voice/voice-recognition.engine';
import { VoiceRecorderComponent } from '../../voice/voice-recorder/voice-recorder.component';
import { VoiceFeedbackComponent } from '../../voice/voice-feedback/voice-feedback.component';

export interface PracticeAdvancedEvent {
  score: number;
  skipped: boolean;
}

@Component({
  selector: 'app-repractice-speaker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, VoiceRecorderComponent, VoiceFeedbackComponent],
  template: `
    <div class="flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-500">

      <!-- Mistake Type Tag -->
      @if (utterance.mistakeType) {
        <span class="inline-flex self-start px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest italic shadow-lg"
              [ngClass]="mistakeTagClass()">
          {{ utterance.mistakeType }}
        </span>
      }

      <!-- Mistake Context Card (what went wrong / correction) -->
      @if (utterance.mistakeDetail || utterance.correctionNote) {
        <div class="bg-white/5 rounded-2xl border border-white/8 p-4 space-y-3">
          @if (utterance.mistakeDetail) {
            <div class="space-y-1">
              <span class="text-[11px] font-black uppercase tracking-widest text-red-400/80 italic">What went wrong</span>
              <p class="text-sm font-semibold text-white/40 italic line-through decoration-red-400/40 leading-snug">
                {{ utterance.mistakeDetail }}
              </p>
            </div>
          }
          @if (utterance.correctionNote) {
            <div class="space-y-1">
              <span class="text-[11px] font-black uppercase tracking-widest text-emerald-400/80 italic">Correction</span>
              <p class="text-sm font-bold text-white/80 italic leading-snug">{{ utterance.correctionNote }}</p>
            </div>
          }
        </div>
      }

      <!-- Text to Practice -->
      <div class="space-y-2">
        <span class="text-[11px] font-black uppercase tracking-widest text-[#E07B39]/80 italic">Now say this correctly</span>
        <h1
          class="font-black text-white italic leading-[1.15] tracking-tight break-words"
          [style.fontSize]="textFontSize"
        >
          {{ utterance.englishText }}
        </h1>
      </div>

      <!-- Hint Toggle -->
      @if (utterance.hintText) {
        <div class="space-y-2">
          <button
            (click)="showHint.set(!showHint())"
            class="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest italic transition-all"
            [ngClass]="showHint() ? 'text-[#E07B39]' : 'text-white/35'"
            type="button"
          >
            <i-lucide [img]="showHint() ? EyeHideIcon : EyeIcon" size="12"></i-lucide>
            {{ showHint() ? 'HIDE HINT' : 'SHOW HINT' }}
          </button>

          @if (showHint()) {
            <div class="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl animate-in slide-in-from-top-2 duration-200">
              <p class="text-base font-bold text-[#E07B39] italic leading-snug">{{ utterance.hintText }}</p>
            </div>
          }
        </div>
      }

      <!-- ── RECORDING PHASE ──────────────────────────────────────────────── -->
      @if (analysisPhase === 'recording') {
        <div class="flex flex-col gap-4 mt-2">
          <app-voice-recorder
            [expectedText]="utterance.englishText"
            [turnIndex]="utteranceIndex"
            (recordingComplete)="onRecordingComplete($event)"
            (errorOccurred)="onVoiceError($event)"
          ></app-voice-recorder>

          <button
            (click)="onSkip()"
            [disabled]="isSubmitting()"
            class="w-full h-12 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/45
                   flex items-center justify-center gap-2
                   hover:bg-white/5 hover:text-white/65 hover:border-white/20 transition-all
                   disabled:opacity-40 disabled:pointer-events-none"
            type="button"
          >
            <i-lucide [img]="SkipIcon" size="13"></i-lucide>
            SKIP THIS ONE
          </button>
        </div>
      }

      <!-- ── FEEDBACK PHASE ──────────────────────────────────────────────── -->
      @if (analysisPhase === 'feedback' && sessionResult) {
        <div class="flex flex-col gap-3 mt-2">

          <app-voice-feedback [result]="sessionResult"></app-voice-feedback>

          <div class="flex flex-col gap-2 pt-2 border-t border-white/5">

            <!-- Auto-submit countdown -->
            @if (autoSubmitSecondsLeft() > 0) {
              <div class="flex items-center justify-center gap-2 py-1.5 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                <span class="w-1.5 h-1.5 rounded-full bg-gw-primary animate-pulse flex-shrink-0"></span>
                <span class="text-[11px] font-black uppercase tracking-widest text-white/45 italic">
                  Auto-submitting in {{ autoSubmitSecondsLeft() }}s — tap below to cancel
                </span>
              </div>
            }

            <!-- Primary: Next / Finish -->
            <button
              (click)="onDone()"
              [disabled]="isSubmitting()"
              class="w-full h-14 bg-[#3D5A99] text-white font-black uppercase tracking-widest italic rounded-2xl
                     shadow-xl shadow-[#3D5A99]/20 hover:scale-[1.01] active:scale-95 transition-all
                     flex items-center justify-center gap-2.5 text-sm
                     disabled:opacity-50 disabled:pointer-events-none"
              type="button"
            >
              {{ isSubmitting() ? 'SAVING...' : isLastUtterance ? 'FINISH PRACTICE' : 'NEXT MISTAKE' }}
              <i-lucide [img]="CheckIcon" size="18"></i-lucide>
            </button>

            <!-- Secondary: Try Again + Skip -->
            <div class="flex gap-3">
              <button
                (click)="onRetryRecording()"
                class="flex-1 h-12 border border-white/15 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/55
                       flex items-center justify-center gap-2
                       hover:bg-white/5 hover:text-white/75 hover:border-white/25 active:scale-95 transition-all"
                type="button"
              >
                <i-lucide [img]="RetryIcon" size="13"></i-lucide>
                TRY AGAIN
              </button>

              <button
                (click)="onSkip()"
                [disabled]="isSubmitting()"
                class="flex-1 h-12 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/40
                       flex items-center justify-center gap-2
                       hover:bg-white/5 hover:text-white/60 active:scale-95 transition-all
                       disabled:opacity-40 disabled:pointer-events-none"
                type="button"
              >
                <i-lucide [img]="SkipIcon" size="13"></i-lucide>
                SKIP
              </button>
            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class RepracticeSpeakerComponent implements OnChanges, AfterViewChecked, OnDestroy {

  @Input({ required: true }) utterance!: RepracticeUtterance;
  @Input() utteranceIndex = 0;
  @Input() totalUtterances = 1;
  @Output() practiceAdvanced = new EventEmitter<PracticeAdvancedEvent>();

  @ViewChild(VoiceRecorderComponent) voiceRecorder?: VoiceRecorderComponent;

  private sessionPrefs = inject(SessionPreferencesService);
  private voiceEngine  = inject(VoiceRecognitionEngine);
  private toast        = inject(ToastService);

  readonly EyeIcon     = Eye;
  readonly EyeHideIcon = EyeOff;
  readonly CheckIcon   = CheckCircle2;
  readonly RetryIcon   = RotateCcw;
  readonly SkipIcon    = FastForward;

  sessionResult: VoiceSessionResult | null = null;
  analysisPhase: 'recording' | 'feedback' = 'recording';
  isSubmitting  = signal(false);
  showHint      = signal(false);
  autoSubmitSecondsLeft = signal(0);

  private _pendingAutoStart = false;
  private _autoStartTimer: ReturnType<typeof setTimeout> | null = null;
  private _autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;
  private _countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ─── COMPUTED ────────────────────────────────────────────────────────────────

  get isLastUtterance(): boolean {
    return this.utteranceIndex >= this.totalUtterances - 1;
  }

  get textFontSize(): string {
    const len = this.utterance?.englishText?.length ?? 0;
    if (len <= 25)  return 'clamp(1.15rem, 4.5vw, 1.55rem)';
    if (len <= 50)  return 'clamp(1rem, 3.8vw, 1.3rem)';
    if (len <= 80)  return 'clamp(0.9rem, 3.2vw, 1.15rem)';
    if (len <= 120) return 'clamp(0.82rem, 2.8vw, 1.05rem)';
    return 'clamp(0.75rem, 2.4vw, 0.95rem)';
  }

  mistakeTagClass(): Record<string, boolean> {
    const type = this.utterance?.mistakeType?.toUpperCase() ?? '';
    return {
      'bg-red-500/20 text-red-300 shadow-red-500/10':    type === 'GRAMMAR',
      'bg-orange-500/20 text-orange-300 shadow-orange-500/10': type === 'PRONUNCIATION',
      'bg-amber-500/20 text-amber-300 shadow-amber-500/10':    type === 'HESITATION',
      'bg-blue-500/20 text-blue-300 shadow-blue-500/10':       type === 'SPEED',
      'bg-purple-500/20 text-purple-300 shadow-purple-500/10': type === 'INCOMPLETE' || type === 'SKIP',
      'bg-white/10 text-white/50':                             !['GRAMMAR','PRONUNCIATION','HESITATION','SPEED','INCOMPLETE','SKIP'].includes(type),
    };
  }

  // ─── LIFECYCLE ────────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.utterance) return;

    const isNewUtterance = !changes['utterance']
      || changes['utterance'].firstChange
      || changes['utterance'].previousValue?.id !== this.utterance.id;

    if (!isNewUtterance) return;

    this._cancelAutoStart();
    this._cancelAutoSubmitTimer();
    this.sessionResult = null;
    this.analysisPhase = 'recording';
    this.showHint.set(false);
    this.isSubmitting.set(false);

    // Auto Start — safe on Capacitor native (no bell), blocked on mobile web.
    const isMobileWebOnly = this.voiceEngine.isMobileDevice && !Capacitor.isNativePlatform();
    if (this.sessionPrefs.prefs.defaultVoiceStarter && !isMobileWebOnly) {
      this._pendingAutoStart = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this._pendingAutoStart && this.voiceRecorder && this.analysisPhase === 'recording') {
      this._pendingAutoStart = false;
      this._autoStartTimer = setTimeout(() => {
        this._autoStartTimer = null;
        if (this.voiceRecorder && this.analysisPhase === 'recording') {
          this.voiceRecorder.startRecording();
        }
      }, 700);
    }
  }

  ngOnDestroy(): void {
    this._cancelAutoStart();
    this._cancelAutoSubmitTimer();
  }

  // ─── TIMER HELPERS ────────────────────────────────────────────────────────────

  private _cancelAutoStart(): void {
    this._pendingAutoStart = false;
    if (this._autoStartTimer !== null) {
      clearTimeout(this._autoStartTimer);
      this._autoStartTimer = null;
    }
  }

  private _scheduleAutoSubmit(seconds: number): void {
    this._cancelAutoSubmitTimer();
    this.autoSubmitSecondsLeft.set(seconds);

    this._countdownInterval = setInterval(() => {
      const next = this.autoSubmitSecondsLeft() - 1;
      this.autoSubmitSecondsLeft.set(next);
      if (next <= 0) this._cancelCountdownInterval();
    }, 1000);

    this._autoSubmitTimer = setTimeout(() => {
      this._autoSubmitTimer = null;
      if (this.analysisPhase === 'feedback' && !this.isSubmitting()) {
        this.onDone();
      }
    }, seconds * 1000);
  }

  private _cancelCountdownInterval(): void {
    if (this._countdownInterval !== null) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
  }

  private _cancelAutoSubmitTimer(): void {
    if (this._autoSubmitTimer !== null) {
      clearTimeout(this._autoSubmitTimer);
      this._autoSubmitTimer = null;
    }
    this._cancelCountdownInterval();
    this.autoSubmitSecondsLeft.set(0);
  }

  // ─── RECORDING EVENTS ─────────────────────────────────────────────────────────

  onRecordingComplete(result: VoiceSessionResult): void {
    this.sessionResult = result;
    this.analysisPhase = 'feedback';

    if (this.sessionPrefs.prefs.autoSubmitOnStop) {
      this._scheduleAutoSubmit(3);
    }
  }

  onVoiceError(message: string): void {
    this.toast.show(message, 'error');
  }

  // ─── ACTIONS ─────────────────────────────────────────────────────────────────

  onDone(): void {
    this._cancelAutoSubmitTimer();
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.practiceAdvanced.emit({
      score: this.sessionResult?.overallScore ?? 0,
      skipped: false
    });
  }

  onSkip(): void {
    this._cancelAutoSubmitTimer();
    if (this.voiceRecorder) this.voiceRecorder.stopEarly();
    this.practiceAdvanced.emit({ score: 0, skipped: true });
  }

  onRetryRecording(): void {
    this._cancelAutoSubmitTimer();
    this.sessionResult = null;
    this.analysisPhase = 'recording';
  }
}

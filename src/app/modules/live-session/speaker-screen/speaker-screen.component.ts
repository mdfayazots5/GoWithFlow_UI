// File: src/app/modules/live-session/speaker-screen/speaker-screen.component.ts
import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, AfterViewChecked, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState, VoiceAnalysis } from '@core/models/voice.model';
import { LucideAngularModule, CheckCircle2, ChevronRight, RotateCcw, Eye, EyeOff, FastForward } from 'lucide-angular';
import { LiveSessionService } from '../live-session.service';
import { ToastService } from '@core/services/toast.service';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';
import { VoiceRecorderComponent } from '../../voice/voice-recorder/voice-recorder.component';
import { VoiceFeedbackComponent } from '../../voice/voice-feedback/voice-feedback.component';
import { VoiceSessionResult } from '@core/services/voice/voice-recognition.engine';

@Component({
  selector: 'app-speaker-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, VoiceRecorderComponent, VoiceFeedbackComponent],
  templateUrl: './speaker-screen.component.html',
  styles: [`:host { display: block; }`]
})
export class SpeakerScreenComponent implements OnChanges, AfterViewChecked, OnDestroy {

  @Input({ required: true }) turnState!: TurnState;
  @Output() turnShifted = new EventEmitter<void>();

  @ViewChild(VoiceRecorderComponent) voiceRecorder?: VoiceRecorderComponent;

  private liveSessionService = inject(LiveSessionService);
  private toast = inject(ToastService);
  private sessionPrefs = inject(SessionPreferencesService);
  private voiceBroadcast = inject(VoiceBroadcastService);

  readonly NoteIcon = CheckCircle2;
  readonly EyeIcon = Eye;
  readonly EyeHideIcon = EyeOff;
  readonly CheckIcon = ChevronRight;
  readonly RetryIcon = RotateCcw;
  readonly SkipIcon = FastForward;

  sessionResult: VoiceSessionResult | null = null;
  analysisPhase: 'recording' | 'feedback' | 'confirmed' = 'recording';
  isSubmitting = signal(false);
  showHint = signal(false);
  words = signal<string[]>([]);

  /** Set by ngOnChanges, consumed by ngAfterViewChecked once the recorder ViewChild is ready */
  private _pendingAutoStart = false;
  /** Timer handle — cancelled on turn change to prevent stale fire */
  private _autoStartTimer: ReturnType<typeof setTimeout> | null = null;

  /** sessionStorage key scoped to this speaker's turn — survives page refresh within the same tab */
  private get storageKey(): string {
    const userId = localStorage.getItem('gwf_userId') || 'unknown';
    return `gwf_va_${this.turnState.sessionId}_${this.turnState.turnIndex}_${userId}`;
  }

  // ─── COMPUTED STYLES ────────────────────────────────────────────────────────

  /** Dynamic font size: shorter questions get larger text, longer ones shrink gracefully */
  get questionFontSize(): string {
    const len = this.turnState?.utterance?.englishText?.length ?? 0;
    if (len <= 25)  return 'clamp(1.9rem, 6.5vw, 2.75rem)';
    if (len <= 50)  return 'clamp(1.55rem, 5vw, 2.25rem)';
    if (len <= 80)  return 'clamp(1.25rem, 4vw, 1.75rem)';
    if (len <= 120) return 'clamp(1.05rem, 3.5vw, 1.4rem)';
    return 'clamp(0.9rem, 3vw, 1.15rem)';
  }

  /** Show Try Again whenever the backend allows re-reads */
  get showReReadButton(): boolean {
    return this.turnState.reReadAllowed
      && this.turnState.reReadCount < this.turnState.maxReReads;
  }

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

  ngOnChanges(): void {
    if (this.turnState) {
      // Cancel any pending auto-start from the previous turn before resetting state
      this._cancelAutoStart();

      this.words.set(this.turnState.utterance.englishText.split(' '));
      this.resetPhase();
      this.tryRestoreFromStorage();

      // Only schedule auto-start when we land fresh in recording phase (not page-refresh-restored)
      if (this.analysisPhase === 'recording' && this.sessionPrefs.prefs.defaultVoiceStarter) {
        this._pendingAutoStart = true;
      }
    }
  }

  /** Fires after each view update — fire auto-start the first time the recorder ViewChild is ready */
  ngAfterViewChecked(): void {
    if (this._pendingAutoStart && this.voiceRecorder && this.analysisPhase === 'recording') {
      this._pendingAutoStart = false;
      // 700 ms lets the UI settle visually before the mic kicks in
      this._autoStartTimer = setTimeout(() => {
        this._autoStartTimer = null;
        if (this.voiceRecorder && this.analysisPhase === 'recording') {
          this.voiceRecorder.startRecording();
        }
      }, 700);
    }
  }

  private _cancelAutoStart(): void {
    this._pendingAutoStart = false;
    if (this._autoStartTimer !== null) {
      clearTimeout(this._autoStartTimer);
      this._autoStartTimer = null;
    }
  }

  /**
   * After a page refresh the turn state is restored from the API but in-memory
   * voice analysis state is lost. If the speaker already completed a recording for
   * this exact turn (before CompleteTurn was sent), restore the result from
   * sessionStorage so they land back on the feedback screen — not a blank recorder.
   */
  private tryRestoreFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as VoiceSessionResult;
        this.sessionResult = parsed;
        this.analysisPhase = 'feedback';
      }
    } catch {
      // Corrupt storage entry — ignore, let the user re-record
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private persistToStorage(result: VoiceSessionResult): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(result));
    } catch {
      // sessionStorage full or unavailable — non-fatal, UPSERT on backend handles re-recording anyway
    }
  }

  private clearFromStorage(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this._cancelAutoStart();
  }

  // ─── RECORDING EVENTS ───────────────────────────────────────────────────────

  onRecordingStarted(): void {
    this.voiceBroadcast.startBroadcast();
  }

  onRecordingComplete(result: VoiceSessionResult): void {
    this.sessionResult = result;
    this.voiceBroadcast.stopBroadcast();

    // Persist to sessionStorage so a page refresh before CompleteTurn restores this screen
    this.persistToStorage(result);

    // Map to VoiceAnalysis shape for backend save (UPSERT — safe to call multiple times for the same turn)
    const analysis = {
      sessionId: this.turnState.sessionId,
      turnIndex: this.turnState.turnIndex,
      utteranceId: this.turnState.utterance.utteranceId,
      transcribedText: result.transcribedText,
      expectedText: result.expectedText,
      fluencyScore: result.fluencyScore,
      confidenceScore: result.confidenceScore,
      speakingSpeedWpm: result.speakingSpeedWpm,
      pauseCount: result.pauseCount,
      hesitationWords: result.hesitationWords,
      repeatedWords: result.repeatedWords,
      grammarErrors: [],
      pronunciationIssues: [],
      overallScore: result.overallScore
    };

    // Save to backend non-blocking (backend uses UPSERT — no 400 on re-record)
    this.liveSessionService.saveVoiceAnalysis(this.turnState.sessionId, analysis).subscribe();

    // Auto Submit on Stop: bypass feedback screen, submit immediately
    if (this.sessionPrefs.prefs.autoSubmitOnStop) {
      this.onDoneSpeaking();
      return;
    }

    this.analysisPhase = 'feedback';
  }

  onVoiceError(message: string): void {
    this.voiceBroadcast.stopBroadcast();
    this.toast.show(message, 'error');
  }

  // ─── PHASE ACTIONS ──────────────────────────────────────────────────────────

  onDoneSpeaking(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const score = this.sessionResult?.overallScore || 0;
    const currentUserId = localStorage.getItem('gwf_userId') || '';

    this.liveSessionService.completeTurnRealtime(
      this.turnState.sessionId,
      currentUserId,
      this.turnState.turnIndex,
      score
    ).subscribe({
      next: () => {
        this.clearFromStorage();  // Turn completed — remove persisted state for this turn
        this.isSubmitting.set(false);
        this.resetPhase();
        this.turnShifted.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.show('Failed to advance turn. Please try again.', 'error');
      }
    });
  }

  onSkip(): void {
    if (this.voiceRecorder) {
      this.voiceRecorder.stopEarly();
    }
    this.voiceBroadcast.stopBroadcast();
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const currentUserId = localStorage.getItem('gwf_userId') || '';

    this.liveSessionService.completeTurnRealtime(
      this.turnState.sessionId,
      currentUserId,
      this.turnState.turnIndex,
      0
    ).subscribe({
      next: () => {
        this.clearFromStorage();  // Turn skipped — remove persisted state for this turn
        this.isSubmitting.set(false);
        this.resetPhase();
        this.turnShifted.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.show('Failed to skip turn. Please try again.', 'error');
      }
    });
  }

  onReRead(): void {
    const currentUserId = localStorage.getItem('gwf_userId') || '';
    this.liveSessionService.requestReReadRealtime(this.turnState.sessionId, currentUserId).subscribe(() => {
      this.resetPhase();
    });
  }

  private resetPhase(): void {
    this.sessionResult = null;
    this.analysisPhase = 'recording';
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}

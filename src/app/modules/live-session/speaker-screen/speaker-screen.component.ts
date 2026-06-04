// File: src/app/modules/live-session/speaker-screen/speaker-screen.component.ts
import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, AfterViewChecked, inject, signal, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState, VoiceAnalysis } from '@core/models/voice.model';
import { LucideAngularModule, CheckCircle2, ChevronRight, RotateCcw, Eye, EyeOff, FastForward } from 'lucide-angular';
import { LiveSessionService } from '../live-session.service';
import { ToastService } from '@core/services/toast.service';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';
import { VoiceRecorderComponent } from '../../voice/voice-recorder/voice-recorder.component';
import { VoiceFeedbackComponent } from '../../voice/voice-feedback/voice-feedback.component';
import { VoiceRecognitionEngine, VoiceSessionResult } from '@core/services/voice/voice-recognition.engine';
import { AudioArchiveService } from '@core/services/audio-archive.service';
import { Capacitor } from '@capacitor/core';

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
  private toast              = inject(ToastService);
  private sessionPrefs       = inject(SessionPreferencesService);
  private voiceBroadcast     = inject(VoiceBroadcastService);
  private voiceEngine        = inject(VoiceRecognitionEngine);
  private audioArchiveSvc    = inject(AudioArchiveService);

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

  /** Countdown seconds remaining before auto-submit fires (0 = not pending) */
  autoSubmitSecondsLeft = signal(0);

  /** Set by ngOnChanges, consumed by ngAfterViewChecked once the recorder ViewChild is ready */
  private _pendingAutoStart = false;
  /** Timer handle — cancelled on turn change to prevent stale fire */
  private _autoStartTimer: ReturnType<typeof setTimeout> | null = null;

  /** Auto-submit timer and countdown interval handles */
  private _autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;
  private _countdownInterval: ReturnType<typeof setInterval> | null = null;

  /** sessionStorage key scoped to this speaker's turn — survives page refresh within the same tab */
  private get storageKey(): string {
    const userId = localStorage.getItem('gwf_userId') || 'unknown';
    return `gwf_va_${this.turnState.sessionId}_${this.turnState.turnIndex}_${userId}`;
  }

  // ─── COMPUTED STYLES ────────────────────────────────────────────────────────

  /** Dynamic font size: shorter questions get larger text, longer ones shrink gracefully */
  get questionFontSize(): string {
    const len = this.turnState?.utterance?.englishText?.length ?? 0;
    if (len <= 25)  return 'clamp(1.15rem, 4.5vw, 1.55rem)';
    if (len <= 50)  return 'clamp(1rem, 3.8vw, 1.3rem)';
    if (len <= 80)  return 'clamp(0.9rem, 3.2vw, 1.15rem)';
    if (len <= 120) return 'clamp(0.82rem, 2.8vw, 1.05rem)';
    return 'clamp(0.75rem, 2.4vw, 0.95rem)';
  }

  /** Show Try Again for performance turns only when the backend allows re-reads. Hidden on facilitator turns. */
  get showReReadButton(): boolean {
    return !this.turnState.isFacilitatorTurn
      && this.turnState.reReadAllowed
      && this.turnState.reReadCount < this.turnState.maxReReads;
  }

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.turnState) return;

    const ts = changes['turnState'];
    // Only reset phase and arm auto-start when the turn index itself changes.
    // A same-turn re-input (e.g. server confirmation after an optimistic update)
    // must not restart the recording or wipe in-progress state.
    const isTurnChange = !ts || ts.firstChange || (ts.previousValue?.turnIndex !== this.turnState.turnIndex);

    this._cancelAutoStart();
    this._cancelAutoSubmitTimer();
    this.words.set(this.turnState.utterance.englishText.split(' '));

    if (isTurnChange) {
      // Configure audio capture for this turn
      this.voiceEngine.enableAudioCapture(this.audioArchiveSvc.getConsent());

      this.resetPhase();
      this.tryRestoreFromStorage();

      // Auto-start: the Web Speech API bell issue only affects mobile web browsers.
      // On Capacitor native (Android APK) the native speech plugin starts silently —
      // no bell — so auto-start is safe regardless of isMobileDevice.
      const isMobileWebOnly = this.voiceEngine.isMobileDevice && !Capacitor.isNativePlatform();
      if (this.analysisPhase === 'recording'
          && this.sessionPrefs.prefs.defaultVoiceStarter
          && !isMobileWebOnly) {
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
    this._cancelAutoSubmitTimer();
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

    // Upload audio clip if user opted in to audio archiving
    if (this.audioArchiveSvc.getConsent() && this.voiceEngine.lastAudioBlob) {
      this.audioArchiveSvc.uploadClip(
        this.voiceEngine.lastAudioBlob,
        this.turnState.sessionId,
        this.turnState.turnIndex
      ).subscribe(); // best-effort, non-blocking
      this.voiceEngine.lastAudioBlob = null;
    }

    // Always show the feedback screen first so users always see their score.
    // Auto Submit: schedule a 3-second countdown, then submit automatically.
    // Users can still submit early by tapping "Done Speaking".
    this.analysisPhase = 'feedback';

    if (this.sessionPrefs.prefs.autoSubmitOnStop) {
      this._scheduleAutoSubmit(3);
    }
  }

  onVoiceError(message: string): void {
    this.voiceBroadcast.stopBroadcast();
    this.toast.show(message, 'error');
  }

  // ─── AUTO SUBMIT COUNTDOWN ───────────────────────────────────────────────────

  private _scheduleAutoSubmit(seconds: number): void {
    this._cancelAutoSubmitTimer();
    this.autoSubmitSecondsLeft.set(seconds);

    console.log('[Speaker] Auto-submit scheduled', {
      turnIndex: this.turnState.turnIndex,
      delaySeconds: seconds
    });

    this._countdownInterval = setInterval(() => {
      const next = this.autoSubmitSecondsLeft() - 1;
      this.autoSubmitSecondsLeft.set(next);
      if (next <= 0) {
        this._cancelCountdownInterval();
      }
    }, 1000);

    this._autoSubmitTimer = setTimeout(() => {
      this._autoSubmitTimer = null;
      if (this.analysisPhase === 'feedback' && !this.isSubmitting()) {
        console.log('[Speaker] Auto-submit timer fired', { turnIndex: this.turnState.turnIndex });
        this.onDoneSpeaking();
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

  // ─── PHASE ACTIONS ──────────────────────────────────────────────────────────

  onDoneSpeaking(): void {
    this._cancelAutoSubmitTimer();
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const score = this.sessionResult?.overallScore || 0;
    const currentUserId = localStorage.getItem('gwf_userId') || '';

    console.log('[Speaker] CompleteTurn emitting', {
      sessionId: this.turnState.sessionId,
      turnIndex: this.turnState.turnIndex,
      score,
      userId: currentUserId
    });

    this.liveSessionService.completeTurnRealtime(
      this.turnState.sessionId,
      currentUserId,
      this.turnState.turnIndex,
      score
    ).subscribe({
      next: () => {
        console.log('[Speaker] CompleteTurn hub call succeeded', {
          turnIndex: this.turnState.turnIndex
        });
        this.clearFromStorage();
        this.isSubmitting.set(false);
        this.resetPhase();
        this.turnShifted.emit();
      },
      error: (err: any) => {
        const reason = err?.message || err?.toString() || 'unknown';
        console.error('[Speaker] CompleteTurn hub call failed', {
          turnIndex: this.turnState.turnIndex,
          reason
        });
        this.isSubmitting.set(false);
        this.toast.show('Failed to advance turn. Please try again.', 'error');
      }
    });
  }

  onSkip(): void {
    this._cancelAutoSubmitTimer();
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

  /** Cancels any pending auto-submit and returns to the recording phase */
  onRetryRecording(): void {
    this._cancelAutoSubmitTimer();
    this.sessionResult = null;
    this.analysisPhase = 'recording';
  }

  onReRead(): void {
    this._cancelAutoSubmitTimer();
    const currentUserId = localStorage.getItem('gwf_userId') || '';
    this.liveSessionService.requestReReadRealtime(this.turnState.sessionId, currentUserId).subscribe(() => {
      this.resetPhase();
    });
  }

  private resetPhase(): void {
    this._cancelAutoSubmitTimer();
    this.sessionResult = null;
    this.analysisPhase = 'recording';
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}

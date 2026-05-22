// File: src/app/modules/live-session/speaker-screen/speaker-screen.component.ts
import { Component, Input, Output, EventEmitter, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState, VoiceAnalysis } from '@core/models/voice.model';
import { LucideAngularModule, Mic, CheckCircle2, ChevronRight, XCircle, RotateCcw, Eye, EyeOff, FastForward } from 'lucide-angular';
import { VoiceAnalysisService } from '@core/services/voice-analysis.service';
import { LiveSessionService } from '../live-session.service';
import { ToastService } from '@core/services/toast.service';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';

@Component({
  selector: 'app-speaker-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './speaker-screen.component.html',
  styles: [`:host { display: block; }`]
})
export class SpeakerScreenComponent implements OnDestroy {
  @Input({ required: true }) turnState!: TurnState;
  @Output() turnShifted = new EventEmitter<void>();

  ngOnDestroy() {
    clearTimeout(this.autoStartTimer);
  }

  private voiceService = inject(VoiceAnalysisService);
  private liveSessionService = inject(LiveSessionService);
  private toast = inject(ToastService);
  private sessionPrefs = inject(SessionPreferencesService);
  private voiceBroadcast = inject(VoiceBroadcastService);

  readonly MicIcon = Mic;
  readonly NoteIcon = CheckCircle2;
  readonly EyeIcon = Eye;
  readonly EyeHideIcon = EyeOff;
  readonly CheckIcon = ChevronRight;
  readonly RetryIcon = RotateCcw;
  readonly SkipIcon = FastForward;

  isRecording = signal(false);
  interimTranscript = signal('');
  analysis = signal<VoiceAnalysis | null>(null);
  showHint = signal(false);
  
  words = signal<string[]>([]);
  spokenWords = signal<{ text: string, isError: boolean }[]>([]);

  private autoStartTimer: any;

  ngOnChanges() {
    if (this.turnState) {
      clearTimeout(this.autoStartTimer);
      this.words.set(this.turnState.utterance.englishText.split(' '));
      this.resetRecording();
      if (this.sessionPrefs.prefs.defaultVoiceStarter) {
        this.autoStartTimer = setTimeout(() => this.startRecording(), 400);
      }
    }
  }

  get showReReadSkipButtons(): boolean {
    return this.sessionPrefs.prefs.showReReadSkipButtons;
  }

  get autoSubmitOnStop(): boolean {
    return this.sessionPrefs.prefs.autoSubmitOnStop;
  }

  startRecording() {
    this.isRecording.set(true);
    this.interimTranscript.set('');
    this.voiceService.startRecording().subscribe(res => {
      this.interimTranscript.set(res);
    });
    this.voiceBroadcast.startBroadcast();
  }

  stopRecording() {
    this.isRecording.set(false);
    this.voiceService.stopRecording();
    this.voiceBroadcast.stopBroadcast();
    this.performAnalysis(this.interimTranscript());
    if (this.sessionPrefs.prefs.autoSubmitOnStop) {
      setTimeout(() => this.onConfirm(), 0);
    }
  }

  // Skip: stop recording (if active) then submit — immune to autoSubmitOnStop double-fire
  // because onConfirm() guards against re-entry via isSubmitting()
  onSkip() {
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.voiceService.stopRecording();
      this.voiceBroadcast.stopBroadcast();
      this.performAnalysis(this.interimTranscript());
    }
    this.onConfirm();
  }

  performAnalysis(transcript: string) {
    const result = this.voiceService.analyzeTranscript(transcript, this.turnState.utterance.englishText);
    this.analysis.set(result);
    
    // Compute diff for visuals
    const expected = this.turnState.utterance.englishText.toLowerCase().split(' ');
    const spoken = transcript.toLowerCase().split(' ');
    
    const mapped = spoken.map(word => ({
      text: word,
      isError: !expected.includes(word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""))
    }));
    this.spokenWords.set(mapped);
  }

  resetRecording() {
    this.analysis.set(null);
    this.isRecording.set(false);
    this.interimTranscript.set('');
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  isSubmitting = signal(false);

  onConfirm() {
    if (this.isSubmitting()) return;
    const a = this.analysis();
    const score = a?.fluencyScore || 0;
    const analysisPayload = {
      sessionId: this.turnState.sessionId,
      turnIndex: this.turnState.turnIndex,
      utteranceId: this.turnState.utterance.utteranceId,
      transcribedText: this.interimTranscript(),
      expectedText: this.turnState.utterance.englishText,
      fluencyScore: a?.fluencyScore || 0,
      confidenceScore: a?.confidenceScore || 0,
      speakingSpeedWpm: a?.speedWpm || 0,
      pauseCount: 0,
      hesitationWords: a?.hesitations || [],
      repeatedWords: [],
      grammarErrors: (a?.mistakes || []).filter(m => m.type === 'GRAMMAR').map(m => ({
        expectedPhrase: m.expected || '', spokenPhrase: m.actual || '', errorType: m.type, position: 0
      })),
      pronunciationIssues: (a?.mistakes || []).filter(m => m.type === 'PRONUNCIATION').map(m => ({
        word: m.word || '', expectedPhonetic: m.expected || '', issueNote: ''
      })),
      overallScore: score
    };
    const currentUserId = localStorage.getItem('gwf_userId') || '';

    this.isSubmitting.set(true);
    this.liveSessionService.saveVoiceAnalysis(this.turnState.sessionId, analysisPayload).subscribe({
      next: () => {
        this.liveSessionService.completeTurnRealtime(
          this.turnState.sessionId,
          currentUserId,
          this.turnState.turnIndex,
          score
        ).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.turnShifted.emit();
          },
          error: () => {
            this.isSubmitting.set(false);
            this.toast.show('Failed to advance turn. Please try again.', 'error');
          }
        });
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.show('Failed to save voice analysis. Please try again.', 'error');
      }
    });
  }

  onReRead() {
    const currentUserId = localStorage.getItem('gwf_userId') || '';

    this.liveSessionService.requestReReadRealtime(this.turnState.sessionId, currentUserId).subscribe(() => {
      this.resetRecording();
    });
  }
}

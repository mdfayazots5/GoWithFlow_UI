import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AudioActivityDetector } from './audio-activity-detector';
import { PronunciationScorer } from './pronunciation-scorer';
import { TranscriptNormalizer } from './transcript-normalizer';

export type RecordingState = 'idle' | 'requesting' | 'listening' | 'processing' | 'done' | 'error';

export interface VoiceSessionResult {
  transcribedText: string;
  expectedText: string;
  fluencyScore: number;
  confidenceScore: number;
  overallScore: number;
  speakingSpeedWpm: number;
  hesitationWords: string[];
  repeatedWords: string[];
  wordResults: WordResult[];
  pauseCount: number;
  durationMs: number;
  retryCount: number;
}

export interface WordResult {
  word: string;
  expected: string;
  matched: boolean;
  score: number;        // 0–100
  isHesitation: boolean;
  isExtra: boolean;
  isMissing: boolean;
}

@Injectable({ providedIn: 'root' })
export class VoiceRecognitionEngine implements OnDestroy {

  // ─── Public State Streams ───────────────────────────────────────────────────
  state$ = new BehaviorSubject<RecordingState>('idle');
  interimTranscript$ = new BehaviorSubject<string>('');
  waveformData$ = new BehaviorSubject<Uint8Array>(new Uint8Array(0));
  volumeLevel$ = new BehaviorSubject<number>(0);  // 0–100

  private destroy$ = new Subject<void>();
  private recognition: any = null;
  private startTimeMs = 0;
  private retryCount = 0;
  private maxRetries = 3;
  private silenceTimeout: any = null;
  private allFinalTranscripts: string[] = [];
  private apiConfidences: number[] = [];
  private isIOS = false;

  // HESITATION WORDS — covers Indian English patterns too
  private hesitationPatterns = [
    'um', 'uh', 'er', 'err', 'hmm', 'hm',
    'like', 'you know', 'i mean', 'basically',
    'actually', 'literally', 'kind of', 'sort of',
    'so', 'well', // only when isolated at turn start
  ];

  constructor(
    private vad: AudioActivityDetector,
    private scorer: PronunciationScorer,
    private normalizer: TranscriptNormalizer
  ) {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.vad.onSilenceDetected(() => this.handleSilenceDetected());
    this.vad.volumeLevel$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.volumeLevel$.next(v);
    });
    this.vad.waveformData$.pipe(takeUntil(this.destroy$)).subscribe(d => {
      this.waveformData$.next(d);
    });
  }

  // ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────
  async startSession(expectedText: string): Promise<VoiceSessionResult> {
    this.state$.next('requesting');
    this.retryCount = 0;
    this.allFinalTranscripts = [];
    this.apiConfidences = [];

    // Step 1: Request microphone permission explicitly (critical for mobile)
    const permitted = await this.requestMicPermission();
    if (!permitted) {
      this.state$.next('error');
      throw new Error('Microphone permission denied. Please allow microphone access and try again.');
    }

    // Step 2: Start waveform / VAD
    await this.vad.start();

    // Step 3: Start recognition with retry logic
    return new Promise((resolve, reject) => {
      this.startRecognition(expectedText, resolve, reject);
    });
  }

  stopSession(): void {
    this.cleanupSilenceTimeout();
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }
    this.vad.stop();
    this.state$.next('idle');
  }

  // ─── MICROPHONE PERMISSION ──────────────────────────────────────────────────
  private async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep stream open — VAD will reuse it
      stream.getTracks().forEach(t => t.stop()); // release, VAD gets its own
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─── SPEECH RECOGNITION SETUP ───────────────────────────────────────────────
  private startRecognition(
    expectedText: string,
    resolve: (r: VoiceSessionResult) => void,
    reject: (e: any) => void
  ): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.state$.next('error');
      reject(new Error('SpeechRecognition is not supported in this browser. Please use Chrome or Edge.'));
      return;
    }

    this.recognition = new SpeechRecognition();

    // ── CRITICAL SETTINGS ────────────────────────────────────────────────────
    // en-IN covers Indian English accent. Highest single fix for Indian users.
    this.recognition.lang = 'en-IN';
    this.recognition.continuous = !this.isIOS;  // iOS cannot do continuous
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;        // get top 3 guesses

    this.startTimeMs = Date.now();
    this.state$.next('listening');

    // ── EVENT: interim results for live display ──────────────────────────────
    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Collect final — may arrive in multiple chunks
          this.allFinalTranscripts.push(result[0].transcript.trim());
          // Collect confidence from best alternative
          this.apiConfidences.push(result[0].confidence || 0.75);
          // Reset silence timeout on each final chunk (2500ms — standard wait for more finals)
          this.resetSilenceTimeout(() => this.finalize(expectedText, resolve));
        } else {
          interim += result[0].transcript;
          // If no final result has arrived yet, keep pushing the fallback deadline.
          // Without this, the 8000ms timer (started on mic press) fires mid-sentence
          // when the user takes prep time + a full sentence exceeds 8s total.
          // This ensures "8s from last speech activity", not "8s from mic press".
          if (this.allFinalTranscripts.length === 0) {
            this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), 8000);
          }
        }
      }
      this.interimTranscript$.next(interim);

      // iOS: restart immediately after each result (no continuous mode)
      // Guard: only restart if still in listening state — prevents restart after stopSession()
      if (this.isIOS && this.state$.value === 'listening' && event.results[event.results.length - 1].isFinal) {
        try { this.recognition.start(); } catch (e) { /* already started */ }
      }
    };

    // ── EVENT: no speech detected ────────────────────────────────────────────
    this.recognition.onnomatch = () => {
      this.interimTranscript$.next('');
    };

    // ── EVENT: error handling with retry ────────────────────────────────────
    this.recognition.onerror = (event: any) => {
      const retryable = ['network', 'audio-capture', 'no-speech'];
      if (retryable.includes(event.error) && this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.startRecognition(expectedText, resolve, reject), 500);
      } else {
        this.state$.next('error');
        this.vad.stop();
        reject(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    // ── EVENT: recognition ended ─────────────────────────────────────────────
    this.recognition.onend = () => {
      // If we have final transcripts, finalize
      if (this.allFinalTranscripts.length > 0 && this.state$.value === 'listening') {
        this.finalize(expectedText, resolve);
      } else if (this.state$.value === 'listening' && !this.isIOS) {
        // Restart if ended unexpectedly without results
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => {
            try { this.recognition.start(); } catch (e) { /* ignore */ }
          }, 300);
        }
      }
    };

    // Start silence detection timer (fallback if VAD misses)
    this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), 8000);

    try {
      this.recognition.start();
    } catch (e) {
      reject(e);
    }
  }

  // ─── SILENCE HANDLING ───────────────────────────────────────────────────────
  private handleSilenceDetected(): void {
    // Only finalize if we are listening and have something
    if (this.state$.value === 'listening' && this.allFinalTranscripts.length > 0) {
      this.cleanupSilenceTimeout();
      // Small buffer to let recognition catch last word
      setTimeout(() => {
        if (this.recognition) {
          try { this.recognition.stop(); } catch (e) { /* ignore */ }
        }
      }, 400);
    }
  }

  private resetSilenceTimeout(callback: () => void, ms = 2500): void {
    this.cleanupSilenceTimeout();
    this.silenceTimeout = setTimeout(callback, ms);
  }

  private cleanupSilenceTimeout(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  // ─── FINALIZATION AND SCORING ────────────────────────────────────────────────
  private finalize(
    expectedText: string,
    resolve: (r: VoiceSessionResult) => void
  ): void {
    if (this.state$.value !== 'listening') return;
    this.state$.next('processing');
    this.cleanupSilenceTimeout();
    this.vad.stop();

    const durationMs = Date.now() - this.startTimeMs;

    // Merge all final transcript chunks into one string
    const rawTranscript = this.allFinalTranscripts.join(' ');

    // Normalize both sides before scoring
    const spokenNorm = this.normalizer.normalize(rawTranscript);
    const expectedNorm = this.normalizer.normalize(expectedText);

    // Average API confidence
    const avgApiConfidence = this.apiConfidences.length > 0
      ? this.apiConfidences.reduce((a, b) => a + b, 0) / this.apiConfidences.length
      : 0.7;

    // Score
    const scoreResult = this.scorer.score(spokenNorm, expectedNorm, avgApiConfidence);

    // Hesitation detection on raw (not normalized) to preserve filler words
    const hesitations = this.detectHesitations(rawTranscript);
    const repeated = this.detectRepeatedWords(spokenNorm);

    // Speaking speed
    const wordCount = spokenNorm.split(' ').filter(w => w.length > 0).length;
    const minutes = durationMs / 60000;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

    // Confidence score: combines API confidence + hesitation penalty
    const hesitationPenalty = Math.min(hesitations.length * 5, 25);
    const confidenceScore = Math.round((avgApiConfidence * 100) - hesitationPenalty);

    const result: VoiceSessionResult = {
      transcribedText: rawTranscript,
      expectedText,
      fluencyScore: scoreResult.fluencyScore,
      confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
      overallScore: scoreResult.overallScore,
      speakingSpeedWpm: wpm,
      hesitationWords: hesitations,
      repeatedWords: repeated,
      wordResults: scoreResult.wordResults,
      pauseCount: this.vad.getPauseCount(),
      durationMs,
      retryCount: this.retryCount
    };

    this.state$.next('done');
    this.interimTranscript$.next('');
    resolve(result);
  }

  // ─── HESITATION DETECTION ───────────────────────────────────────────────────
  private detectHesitations(transcript: string): string[] {
    const lower = transcript.toLowerCase();
    const found: string[] = [];
    for (const pattern of this.hesitationPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) found.push(...matches.map(m => m.toLowerCase()));
    }
    return found;
  }

  // ─── REPEATED WORDS DETECTION ───────────────────────────────────────────────
  private detectRepeatedWords(normalizedTranscript: string): string[] {
    const words = normalizedTranscript.split(' ');
    const repeated: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1] && words[i].length > 2) {
        repeated.push(words[i]);
      }
    }
    return repeated;
  }

  ngOnDestroy(): void {
    this.stopSession();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

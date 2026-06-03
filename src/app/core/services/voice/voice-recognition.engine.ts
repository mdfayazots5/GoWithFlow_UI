import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';
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
  volumeLevel$ = new BehaviorSubject<number>(0);

  private destroy$ = new Subject<void>();
  private recognition: any = null;
  private startTimeMs = 0;
  private retryCount = 0;
  private maxRetries = 3;
  private silenceTimeout: any = null;
  private allFinalTranscripts: string[] = [];
  private apiConfidences: number[] = [];

  // ─── Platform detection ─────────────────────────────────────────────────────
  // isCapacitorNative: true when running inside Capacitor Android/iOS shell.
  // Web Speech API is unavailable in Capacitor WebView — native plugin path used instead.
  private isCapacitorNative = Capacitor.isNativePlatform();
  private nativeSpeechListener: any = null;

  // ─── Device detection ───────────────────────────────────────────────────────
  // Detected once at construction; used to tune timeouts and thresholds.
  // isIOS: true for iPhone / iPad (including iPads that send Macintosh UA in iOS 13+)
  // isMobile: true for any touch device — iOS, Android, iPadOS
  private isIOS = false;
  private _isMobile = false;

  /** Exposed so SpeakerScreenComponent can skip auto-start on touch devices. */
  get isMobileDevice(): boolean { return this._isMobile; }

  // ─── Per-session flags ──────────────────────────────────────────────────────

  // Set to true when a final transcript arrives with ≥ 2 meaningful words.
  // Guards the VAD silence callback — we never finalise before the user has spoken.
  private _hasSpoken = false;

  // Set to true whenever we deliberately call recognition.stop() so that the
  // resulting onend event does not trigger the restart path and play a second bell.
  private _intentionalStop = false;

  // Accumulated interim text across onresult events (fallback when browser never
  // fires isFinal=true — common on Android Chrome with continuous=true).
  private _accumulatedInterim = '';

  // ─── Audio Archive Support ──────────────────────────────────────────────────
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private captureAudio = false;
  lastAudioBlob: Blob | null = null;

  enableAudioCapture(enabled: boolean): void {
    this.captureAudio = enabled;
    if (!enabled) this.lastAudioBlob = null;
  }

  constructor(
    private vad: AudioActivityDetector,
    private scorer: PronunciationScorer,
    private normalizer: TranscriptNormalizer
  ) {
    const ua = navigator.userAgent;
    const isIPadDesktopUA = navigator.maxTouchPoints > 1 && /Macintosh/.test(ua);
    this.isIOS    = /iPad|iPhone|iPod/.test(ua) || isIPadDesktopUA;
    this._isMobile = this.isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    console.debug('[VRE] Device detection', {
      isIOS: this.isIOS,
      isMobile: this._isMobile,
      ua: ua.substring(0, 80)
    });

    this.vad.onSilenceDetected(() => this.handleSilenceDetected());
    this.vad.volumeLevel$.pipe(takeUntil(this.destroy$)).subscribe(v => this.volumeLevel$.next(v));
    this.vad.waveformData$.pipe(takeUntil(this.destroy$)).subscribe(d => this.waveformData$.next(d));
  }

  // ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────
  async startSession(expectedText: string): Promise<VoiceSessionResult> {
    if (this.state$.value !== 'idle') {
      this.stopSession();
    }

    this.state$.next('requesting');
    this.retryCount = 0;
    this._hasSpoken = false;
    this._intentionalStop = false;
    this.allFinalTranscripts = [];
    this.apiConfidences = [];
    this._accumulatedInterim = '';

    // Configure VAD thresholds for this device before starting.
    // Mobile devices need more tolerance: longer silence hold-off and a
    // quieter speech-detection threshold to cope with lower-gain mobile mics.
    if (this._isMobile) {
      this.vad.configure({
        silenceThresholdDB: -55,  // must be quieter than -55 dB to count as silent
        silenceDurationMs:  2500, // hold silence 2.5 s before firing (vs 1.2 s on desktop)
        speechThresholdDB:  -30   // must exceed -30 dB to latch _hasSpeechStarted
      });
    } else {
      this.vad.configure({
        silenceThresholdDB: -50,
        silenceDurationMs:  1200,
        speechThresholdDB:  -35
      });
    }

    console.debug('[VRE] startSession', { isMobile: this._isMobile, expectedText: expectedText.substring(0, 40) });

    const permitted = await this.requestMicPermission();
    if (!permitted) {
      this.state$.next('error');
      throw new Error('Microphone permission denied. Please allow microphone access and try again.');
    }

    await this.vad.start();

    if (this.captureAudio) {
      this.audioChunks = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
        this.mediaRecorder.onstop = () => {
          this.lastAudioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());
        };
        this.mediaRecorder.start(100);
      } catch { /* audio capture is best-effort */ }
    }

    if (this.isCapacitorNative) {
      return this.startNativeSession(expectedText);
    }

    return new Promise((resolve, reject) => {
      this.startRecognition(expectedText, resolve, reject);
    });
  }

  stopSession(): void {
    this._intentionalStop = true;
    this.cleanupSilenceTimeout();

    if (this.isCapacitorNative) {
      NativeSpeechRecognition.stop().catch(() => { /* ignore */ });
      if (this.nativeSpeechListener) {
        this.nativeSpeechListener.remove();
        this.nativeSpeechListener = null;
      }
    } else if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch { /* ignore */ }
      this.mediaRecorder = null;
    }
    this.vad.stop();
    this.state$.next('idle');
  }

  // ─── CAPACITOR NATIVE RECOGNITION PATH ─────────────────────────────────────
  // Used on Android (Capacitor WebView). Web Speech API is not available there.
  // Android handles end-of-speech detection internally — VAD silence callback is
  // a no-op on this path because recognition is null and _hasSpoken is never set.

  private async startNativeSession(expectedText: string): Promise<VoiceSessionResult> {
    const { speechRecognition } = await NativeSpeechRecognition.checkPermissions();
    if (speechRecognition !== 'granted') {
      const { speechRecognition: granted } = await NativeSpeechRecognition.requestPermissions();
      if (granted !== 'granted') {
        this.state$.next('error');
        this.vad.stop();
        throw new Error('Microphone permission denied. Please allow access in Settings and try again.');
      }
    }

    this.startTimeMs = Date.now();
    this.state$.next('listening');

    this.nativeSpeechListener = await NativeSpeechRecognition.addListener(
      'partialResults',
      (data: { matches: string[] }) => {
        if (data.matches?.length > 0) {
          this.interimTranscript$.next(data.matches[0]);
        }
      }
    );

    try {
      const result = await NativeSpeechRecognition.start({
        language: 'en-IN',
        maxResults: 3,
        partialResults: true,
        popup: false,
      });

      this.nativeSpeechListener.remove();
      this.nativeSpeechListener = null;

      if (this._intentionalStop) {
        // stopSession() was called mid-recognition — return empty result
        this.state$.next('idle');
        return this.buildEmptyResult(expectedText);
      }

      const transcript = (result as any).matches?.[0] ?? '';
      return this.finalizeNative(expectedText, transcript);

    } catch (e: any) {
      if (this.nativeSpeechListener) {
        this.nativeSpeechListener.remove();
        this.nativeSpeechListener = null;
      }
      this.vad.stop();
      this.state$.next('error');
      throw new Error(`Native speech recognition error: ${e?.message ?? e}`);
    }
  }

  private finalizeNative(expectedText: string, transcript: string): VoiceSessionResult {
    const elapsed = Date.now() - this.startTimeMs;
    const confidence = 0.85; // plugin does not return per-word confidence

    this.state$.next('processing');
    this.cleanupSilenceTimeout();
    this.vad.stop();
    this.interimTranscript$.next('');

    const spokenNorm   = this.normalizer.normalize(transcript);
    const expectedNorm = this.normalizer.normalize(expectedText);
    const scoreResult  = this.scorer.score(spokenNorm, expectedNorm, confidence);
    const hesitations  = this.detectHesitations(transcript);
    const repeated     = this.detectRepeatedWords(spokenNorm);

    const wordCount = spokenNorm.split(' ').filter(w => w.length > 0).length;
    const minutes   = elapsed / 60000;
    const wpm       = minutes > 0 ? Math.round(wordCount / minutes) : 0;

    const hesitationPenalty = Math.min(hesitations.length * 5, 25);
    const confidenceScore   = Math.round((confidence * 100) - hesitationPenalty);

    const result: VoiceSessionResult = {
      transcribedText: transcript,
      expectedText,
      fluencyScore:     scoreResult.fluencyScore,
      confidenceScore:  Math.max(0, Math.min(100, confidenceScore)),
      overallScore:     scoreResult.overallScore,
      speakingSpeedWpm: wpm,
      hesitationWords:  hesitations,
      repeatedWords:    repeated,
      wordResults:      scoreResult.wordResults,
      pauseCount:       this.vad.getPauseCount(),
      durationMs:       elapsed,
      retryCount:       0
    };

    this.state$.next('done');
    return result;
  }

  private buildEmptyResult(expectedText: string): VoiceSessionResult {
    return {
      transcribedText: '',
      expectedText,
      fluencyScore: 0, confidenceScore: 0, overallScore: 0,
      speakingSpeedWpm: 0, hesitationWords: [], repeatedWords: [],
      wordResults: [], pauseCount: 0, durationMs: 0, retryCount: 0
    };
  }

  // ─── MICROPHONE PERMISSION ──────────────────────────────────────────────────
  private async requestMicPermission(): Promise<boolean> {
    // Use the Permissions API when available to avoid a redundant getUserMedia
    // round-trip on mobile (two consecutive getUserMedia calls can cause iOS
    // Safari to re-present the permission sheet or fail the second stream).
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'granted') {
          console.debug('[VRE] Mic permission already granted (Permissions API)');
          return true;
        }
        if (result.state === 'denied') {
          console.debug('[VRE] Mic permission denied (Permissions API)');
          return false;
        }
        // 'prompt' — fall through to getUserMedia to trigger the prompt
      } catch { /* Permissions API unsupported — fall through */ }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.warn('[VRE] Mic permission denied via getUserMedia', e);
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
    this.recognition.lang = 'en-IN';
    this.recognition.continuous = !this.isIOS;  // iOS cannot do continuous recognition
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.startTimeMs = Date.now();
    this.state$.next('listening');

    console.debug('[VRE] Recognition started', {
      continuous: this.recognition.continuous,
      retryCount: this.retryCount
    });

    // ── EVENT: results (interim + final) ────────────────────────────────────
    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          this.allFinalTranscripts.push(transcript);
          this.apiConfidences.push(result[0].confidence || 0.75);

          const wordCount = transcript.split(/\s+/).filter((w: string) => w.length > 0).length;
          if (wordCount >= 2) {
            this._hasSpoken = true;
          }

          console.debug('[VRE] Final result', {
            transcript: transcript.substring(0, 60),
            wordCount,
            _hasSpoken: this._hasSpoken,
            totalFinals: this.allFinalTranscripts.length
          });

          // After a final result, wait for more speech before finalising.
          // Mobile gets a longer window because natural inter-phrase pauses
          // are longer and the speech API fires partials more aggressively.
          const postFinalMs = this._isMobile ? 4500 : 2500;
          this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), postFinalMs);

        } else {
          interim += result[0].transcript;

          // While no final has arrived yet, keep pushing the fallback deadline
          // so the timer measures "time since last speech activity", not
          // "time since mic was pressed".  Mobile gets a longer fallback because
          // users may take extra prep time and speak slower.
          if (this.allFinalTranscripts.length === 0) {
            const fallbackMs = this._isMobile ? 12000 : 8000;
            this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), fallbackMs);
          }
        }
      }
      this.interimTranscript$.next(interim);

      // Accumulate ALL non-final text currently in the result buffer.
      // On Android Chrome with continuous=true, isFinal may never fire —
      // we keep this as a fallback so finalize() can use it instead of returning empty.
      let allInterim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (!event.results[i].isFinal) {
          allInterim += event.results[i][0].transcript + ' ';
        }
      }
      if (allInterim.trim()) {
        this._accumulatedInterim = allInterim.trim();
      }

      // iOS requires an explicit restart after each final result because
      // continuous mode is not supported.  Guard with _intentionalStop so
      // we do not restart after a deliberate stop-to-finalize.
      if (this.isIOS
          && !this._intentionalStop
          && this.state$.value === 'listening'
          && event.results[event.results.length - 1].isFinal) {
        try { this.recognition.start(); } catch (e) { /* already started */ }
      }
    };

    // ── EVENT: no speech match ───────────────────────────────────────────────
    this.recognition.onnomatch = () => {
      this.interimTranscript$.next('');
    };

    // ── EVENT: error handling ────────────────────────────────────────────────
    this.recognition.onerror = (event: any) => {
      console.warn('[VRE] Recognition error', { error: event.error, retryCount: this.retryCount, _hasSpoken: this._hasSpoken });

      // 'no-speech' fires when the browser's own internal silence timer expires.
      // If the user has already produced transcripts, this just means they paused —
      // extend the window instead of retrying with a new recognition instance
      // (which would play the browser's start bell again mid-speech).
      if (event.error === 'no-speech') {
        if (this.allFinalTranscripts.length > 0) {
          console.debug('[VRE] no-speech after finals — extending timeout instead of retrying');
          const extendMs = this._isMobile ? 4500 : 2500;
          this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), extendMs);
          return;
        }
        // No transcripts yet — user genuinely has not spoken.
        // Retry below (standard path) to give them another window.
      }

      const retryable = ['network', 'audio-capture', 'no-speech'];
      if (retryable.includes(event.error) && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.debug('[VRE] Retrying after error', { error: event.error, attempt: this.retryCount });
        setTimeout(() => this.startRecognition(expectedText, resolve, reject), 500);
      } else {
        this.state$.next('error');
        this.vad.stop();
        reject(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    // ── EVENT: recognition ended ─────────────────────────────────────────────
    this.recognition.onend = () => {
      console.debug('[VRE] onend', {
        _intentionalStop: this._intentionalStop,
        state: this.state$.value,
        finals: this.allFinalTranscripts.length
      });

      // If we deliberately stopped recognition (e.g., finalize() or stopSession()),
      // suppress any restart logic so the browser does not play a second start bell.
      if (this._intentionalStop) return;

      if (this.allFinalTranscripts.length > 0 && this.state$.value === 'listening') {
        // Recognition ended with captured speech — finalize now
        this.finalize(expectedText, resolve);
      } else if (this.state$.value === 'listening' && !this.isIOS) {
        // Recognition ended unexpectedly before any speech.
        // Create a fresh recognition instance — reusing the ended instance via
        // .start() is unreliable on Android Chrome and silently fails.
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.debug('[VRE] Unexpected onend — creating fresh recognition instance', this.retryCount);
          setTimeout(() => {
            if (this.state$.value === 'listening') {
              this.startRecognition(expectedText, resolve, reject);
            }
          }, 300);
        }
      }
    };

    // Initial fallback: if no activity at all within this window, finalise
    // with whatever transcripts exist (or an empty result).
    const fallbackMs = this._isMobile ? 12000 : 8000;
    this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), fallbackMs);

    try {
      this.recognition.start();
    } catch (e) {
      reject(e);
    }
  }

  // ─── SILENCE HANDLING ───────────────────────────────────────────────────────

  private handleSilenceDetected(): void {
    // Guard: only act if we are listening AND the user has actually spoken.
    // The VAD's own _hasSpeechStarted flag prevents this from firing on ambient
    // startup noise, but _hasSpoken adds a second layer: we require a meaningful
    // final transcript (≥ 2 words) before the silence path can stop recording.
    if (this.state$.value !== 'listening') return;
    if (!this._hasSpoken) {
      console.debug('[VRE] VAD silence fired but _hasSpoken=false — ignoring');
      return;
    }

    console.debug('[VRE] VAD silence → stopping recognition', { finals: this.allFinalTranscripts.length });

    this._intentionalStop = true;
    this.cleanupSilenceTimeout();

    // Small buffer to allow the speech API to deliver any last in-flight result
    // before we actually stop.  Mobile gets slightly more time.
    const stopDelayMs = this._isMobile ? 600 : 400;
    setTimeout(() => {
      if (this.recognition) {
        try { this.recognition.stop(); } catch (e) { /* ignore */ }
      }
    }, stopDelayMs);
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

    const elapsed = Date.now() - this.startTimeMs;
    // Use accumulated interim as fallback when the browser never fires isFinal=true
    // (common on Android Chrome with continuous=true).
    const combined = this.allFinalTranscripts.join(' ').trim() || this._accumulatedInterim;
    const wordCount = combined.split(/\s+/).filter(w => w.length > 0).length;

    // Minimum duration guard:
    // If the recording is very short and has almost no content, the trigger was
    // almost certainly spurious (ambient noise, mic click, brief AGC artefact).
    // Reschedule the timer and keep listening rather than emitting garbage.
    const minMs  = this._isMobile ? 2000 : 800;
    const minWords = 2;
    if (elapsed < minMs && wordCount < minWords && !this._hasSpoken) {
      console.debug('[VRE] Minimum-duration guard — rescheduling', { elapsed, wordCount });
      const rescheduleMs = this._isMobile ? 4500 : 2500;
      this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), rescheduleMs);
      return;
    }

    console.debug('[VRE] Finalizing', { elapsed, wordCount, _hasSpoken: this._hasSpoken, finals: this.allFinalTranscripts.length });

    this.state$.next('processing');
    this.cleanupSilenceTimeout();

    // Stop recognition explicitly so the browser does not play another bell
    // if it fires onend before we complete processing.
    this._intentionalStop = true;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }

    this.vad.stop();

    const durationMs = elapsed;

    const spokenNorm   = this.normalizer.normalize(combined);
    const expectedNorm = this.normalizer.normalize(expectedText);

    const avgApiConfidence = this.apiConfidences.length > 0
      ? this.apiConfidences.reduce((a, b) => a + b, 0) / this.apiConfidences.length
      : 0.7;

    const scoreResult = this.scorer.score(spokenNorm, expectedNorm, avgApiConfidence);

    const hesitations = this.detectHesitations(combined);
    const repeated    = this.detectRepeatedWords(spokenNorm);

    const wordCountFinal = spokenNorm.split(' ').filter(w => w.length > 0).length;
    const minutes        = durationMs / 60000;
    const wpm            = minutes > 0 ? Math.round(wordCountFinal / minutes) : 0;

    const hesitationPenalty = Math.min(hesitations.length * 5, 25);
    const confidenceScore   = Math.round((avgApiConfidence * 100) - hesitationPenalty);

    const result: VoiceSessionResult = {
      transcribedText: combined,
      expectedText,
      fluencyScore:     scoreResult.fluencyScore,
      confidenceScore:  Math.max(0, Math.min(100, confidenceScore)),
      overallScore:     scoreResult.overallScore,
      speakingSpeedWpm: wpm,
      hesitationWords:  hesitations,
      repeatedWords:    repeated,
      wordResults:      scoreResult.wordResults,
      pauseCount:       this.vad.getPauseCount(),
      durationMs,
      retryCount:       this.retryCount
    };

    console.debug('[VRE] Session result', {
      transcribed: combined.substring(0, 60),
      overallScore: result.overallScore,
      durationMs,
      retryCount: result.retryCount
    });

    this.state$.next('done');
    this.interimTranscript$.next('');
    resolve(result);
  }

  // ─── HESITATION DETECTION ───────────────────────────────────────────────────
  private detectHesitations(transcript: string): string[] {
    return this.normalizer.detectFillerPhrases(transcript);
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

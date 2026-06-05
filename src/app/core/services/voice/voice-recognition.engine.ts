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

export type BrowserEngine = 'chrome' | 'edge' | 'firefox' | 'samsung' | 'safari' | 'other';

/**
 * Runtime capability snapshot for the voice pipeline. Drives the pre-flight guard
 * (clear, actionable errors instead of a silent failure) and the Speech Debug page.
 */
export interface VoiceCapabilities {
  isCapacitorNative: boolean;   // running inside the installed app (on-device recognizer)
  isSecureContext: boolean;     // window.isSecureContext — Web Speech API hard requirement
  hasSpeechApi: boolean;        // SpeechRecognition / webkitSpeechRecognition present
  browserEngine: BrowserEngine; // best-effort UA classification
  origin: string;               // window.location.origin (shown in the secure-context error)
  online: boolean;              // navigator.onLine — cloud STT needs the network
  isMobile: boolean;
  isIOS: boolean;
  /**
   * Best-effort verdict on whether speech recognition can actually run here.
   * Native: always true. Web: needs a secure context AND the API. Engines that
   * expose the API but have no working speech backend on mobile (Edge, Firefox)
   * are flagged unreliable so the UI can recommend Chrome / the app up front.
   */
  speechSupported: boolean;
  /** Human-readable reason when speechSupported is false (null otherwise). */
  blockerReason: string | null;
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

  // Set to true after a language-not-supported error so the next startRecognition
  // attempt uses en-US instead of en-IN (Edge mobile does not support en-IN).
  private _useFallbackLang = false;

  // ─── Platform detection ─────────────────────────────────────────────────────
  // isCapacitorNative: true when running inside Capacitor Android/iOS shell.
  // Web Speech API is unavailable in Capacitor WebView — native plugin path used instead.
  private isCapacitorNative = Capacitor.isNativePlatform();
  private nativeSpeechListener: any = null;   // 'partialResults' handle
  private nativeStateListener: any = null;    // 'listeningState' handle

  // localStorage key for the last language that produced a transcript on THIS
  // device. The native recognizer is the device default (often the offline SODA
  // engine), which only serves languages whose offline model is installed — so we
  // discover and remember the working one to avoid re-walking the chain each turn.
  private readonly _langCacheKey = 'gwf_voice_lang';

  // ─── Device detection ───────────────────────────────────────────────────────
  // Detected once at construction; used to tune timeouts and thresholds.
  // isIOS: true for iPhone / iPad (including iPads that send Macintosh UA in iOS 13+)
  // isMobile: true for any touch device — iOS, Android, iPadOS
  private isIOS = false;
  private _isMobile = false;
  private _engine: BrowserEngine = 'other';

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

  // ─── Standalone capture (turns with no speech recognition, e.g. facilitator read-aloud) ──────
  private standaloneStream: MediaStream | null = null;

  /**
   * Start a standalone MediaRecorder for a turn that has no recognition phase (facilitator
   * "Read Aloud"). Best-effort: no-op on Capacitor native (getUserMedia blocked) or if a
   * recorder is already running. Pairs with {@link stopStandaloneCapture}.
   */
  async startStandaloneCapture(): Promise<void> {
    if (this.isCapacitorNative) return;   // getUserMedia unavailable on native
    if (this.mediaRecorder) return;       // a recognition recorder is already capturing
    this.lastAudioBlob = null;
    this.audioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.standaloneStream = stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
      this.mediaRecorder.start(100);
    } catch { /* capture is best-effort */ }
  }

  /** Stop the standalone recorder and resolve with the captured blob (or null). */
  stopStandaloneCapture(): Promise<Blob | null> {
    const recorder = this.mediaRecorder;
    if (!recorder || !this.standaloneStream) return Promise.resolve(null);
    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const blob = this.audioChunks.length ? new Blob(this.audioChunks, { type: 'audio/webm' }) : null;
        this.standaloneStream?.getTracks().forEach(t => t.stop());
        this.standaloneStream = null;
        this.mediaRecorder = null;
        this.lastAudioBlob = blob;
        resolve(blob);
      };
      try { recorder.stop(); } catch { resolve(null); }
    });
  }

  // Set once we have triggered the native model load for this app run.
  private _prewarmed = false;

  /**
   * Pre-load the native speech model so the first real recording starts instantly.
   * Briefly starts + stops the recognizer (the OS mic indicator may flash for ~150 ms).
   * No-op off native, when not idle, or after the first call. Best-effort — never throws.
   */
  async prewarm(): Promise<void> {
    if (!this.isCapacitorNative || this._prewarmed) return;
    if (this.state$.value !== 'idle') return;
    this._prewarmed = true;
    try {
      const { speechRecognition } = await NativeSpeechRecognition.checkPermissions();
      if (speechRecognition !== 'granted') return; // never prompt during a silent prewarm
      let cached = '';
      try { cached = localStorage.getItem(this._langCacheKey) || ''; } catch { /* ignore */ }
      const lang = this.buildLanguageCandidates(cached)[0]; // best guess for this device
      await NativeSpeechRecognition.start({ language: lang, partialResults: true, popup: false });
      // Only needed to trigger the model load — stop right away, but never stop a real
      // session that may have started in the meantime.
      setTimeout(() => {
        if (this.state$.value === 'idle') NativeSpeechRecognition.stop().catch(() => {});
      }, 150);
    } catch { /* best-effort warm-up */ }
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
    this._engine  = this.detectEngine(ua);

    console.debug('[VRE] Device detection', {
      isIOS: this.isIOS,
      isMobile: this._isMobile,
      engine: this._engine,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : 'n/a',
      origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
      ua: ua.substring(0, 80)
    });

    this.vad.onSilenceDetected(() => this.handleSilenceDetected());
    this.vad.volumeLevel$.pipe(takeUntil(this.destroy$)).subscribe(v => this.volumeLevel$.next(v));
    this.vad.waveformData$.pipe(takeUntil(this.destroy$)).subscribe(d => this.waveformData$.next(d));
  }

  // ─── CAPABILITY DETECTION ─────────────────────────────────────────────────
  // Classify the browser engine from the UA. Used only for diagnostics + to warn
  // the user up front on engines that expose the Web Speech API but have no working
  // speech backend on mobile (Edge, Firefox). Order matters: Samsung/Edge/Firefox
  // UAs also contain "Chrome"/"Safari", so they must be tested first.
  private detectEngine(ua: string): BrowserEngine {
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/Edg(A|iOS|)\//i.test(ua))  return 'edge';      // EdgA = Edge Android, EdgiOS = Edge iOS
    if (/Firefox\/|FxiOS\//i.test(ua)) return 'firefox';
    if (/CriOS\//i.test(ua))        return 'chrome';    // Chrome on iOS (WebKit shell)
    if (/Chrome\//i.test(ua))       return 'chrome';
    if (/Safari\//i.test(ua))       return 'safari';
    return 'other';
  }

  /**
   * Snapshot of what the voice pipeline can do in the current runtime. Cheap to
   * call — recomputed each time so `isSecureContext`/`online` are always current.
   */
  getCapabilities(): VoiceCapabilities {
    const hasSpeechApi = typeof window !== 'undefined' &&
      (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const blockerReason = this.isCapacitorNative
      ? null
      : this.webSpeechBlocker(isSecure, hasSpeechApi, origin);

    // Engines that ship the API but commonly have no speech service on mobile.
    // Not a hard block (we still let them try), but flagged so the UI can advise.
    const unreliableMobileEngine = this._isMobile && (this._engine === 'edge' || this._engine === 'firefox');

    return {
      isCapacitorNative: this.isCapacitorNative,
      isSecureContext: isSecure,
      hasSpeechApi,
      browserEngine: this._engine,
      origin,
      online,
      isMobile: this._isMobile,
      isIOS: this.isIOS,
      speechSupported: this.isCapacitorNative || (!blockerReason && !unreliableMobileEngine),
      blockerReason
    };
  }

  /**
   * Hard blockers for the Web Speech path. Returns an actionable message, or null
   * if the path can at least be attempted. Native callers never hit this.
   */
  private webSpeechBlocker(isSecure: boolean, hasSpeechApi: boolean, origin: string): string | null {
    if (!isSecure) {
      return `Speech recognition needs a secure (HTTPS) connection. This page is open over an insecure address (${origin || 'http://…'}). Open it via https://, or install the GoWithFlow app for voice support.`;
    }
    if (!hasSpeechApi) {
      return `Speech recognition isn't supported in this browser. Please use Google Chrome, or install the GoWithFlow app.`;
    }
    return null;
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
    this._useFallbackLang = false;
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

    console.debug('[VRE] startSession', { isMobile: this._isMobile, isCapacitorNative: this.isCapacitorNative, expectedText: expectedText.substring(0, 40) });

    // On Capacitor native (Android/iOS), skip the web-based mic permission check —
    // getUserMedia is blocked on HTTP dev server and the native plugin handles
    // its own permission request inside startNativeSession().
    if (this.isCapacitorNative) {
      return this.startNativeSession(expectedText);
    }

    // ── WEB PATH PRE-FLIGHT GUARD ──────────────────────────────────────────────
    // Surface the real reason (insecure context / no API) up front with an
    // actionable message, instead of letting recognition fail later with a generic
    // "Speech recognition error". This is the #1 cause of "works in the app but not
    // in the mobile browser": a LAN IP over plain HTTP is not a secure context.
    const cap = this.getCapabilities();
    console.debug('[VRE] Web capability snapshot', cap);
    if (cap.blockerReason) {
      console.warn('[VRE] Web speech blocked', { reason: cap.blockerReason, origin: cap.origin, secure: cap.isSecureContext, hasApi: cap.hasSpeechApi });
      this.state$.next('error');
      throw new Error(cap.blockerReason);
    }
    if (!cap.speechSupported) {
      // Has the API + secure, but a known-unreliable mobile engine (Edge/Firefox).
      // We still attempt — but warn so the failure path can advise switching browsers.
      console.warn('[VRE] Unreliable mobile engine for Web Speech', { engine: cap.browserEngine });
    }

    const permitted = await this.requestMicPermission();
    if (!permitted) {
      this.state$.next('error');
      throw new Error('Microphone permission denied. Please allow microphone access and try again.');
    }

    // Skip VAD on mobile — the VAD's getUserMedia stream conflicts with the
    // Web Speech API's internal audio pipeline on Android Chrome, causing
    // speech recognition to receive no audio (zero onresult events).
    // On mobile, continuous=false lets the browser handle end-of-speech natively.
    if (!this._isMobile) {
      await this.vad.start();
    }

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
      if (this.nativeStateListener) {
        this.nativeStateListener.remove();
        this.nativeStateListener = null;
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
  // Runs on Android/iOS inside the Capacitor WebView, where the Web Speech API is
  // unavailable. Uses @capacitor-community/speech-recognition, which drives the
  // device's DEFAULT recognizer. On many Android phones that default is the OFFLINE
  // SODA engine (com.google.android.tts), which only serves languages whose offline
  // model is installed — frequently just the device locale. Requesting an
  // uninstalled language (e.g. en-IN on an en-GB device) fails with an error the
  // plugin SWALLOWS: in partialResults mode start() resolves the call immediately,
  // then onError() rejects an already-resolved call and emits NO listeningState
  // event. The JS side therefore sees nothing on a bad language.
  //
  // So we cannot detect a bad language from an error. Instead we walk a language
  // fallback chain and use a per-attempt WATCHDOG: if an attempt produces no
  // 'started'/'partialResults' signal within the window, we treat that language as
  // unusable and advance to the next. The first language that yields a result is
  // cached (localStorage) so subsequent turns succeed on the first try.

  /**
   * Ordered language fallback chain for native recognition, de-duplicated.
   * Front-loads the languages most likely to be installed offline on this device.
   */
  private buildLanguageCandidates(cachedLang: string): (string | undefined)[] {
    const out: (string | undefined)[] = [];
    const push = (l: string | undefined) => {
      if (l === undefined) { if (!out.includes(undefined)) out.push(undefined); return; }
      const v = l.trim();
      if (v && !out.some(c => typeof c === 'string' && c.toLowerCase() === v.toLowerCase())) out.push(v);
    };

    // 1. Previously-confirmed working language on this device — instant success.
    if (cachedLang) push(cachedLang);

    // 2. English variant matching the device region — most likely the installed
    //    offline pack. 'en-GB' device → en-GB; non-English 'hi-IN' device → en-IN.
    const devLang = (navigator.language || '').trim();
    if (devLang) {
      if (/^en\b/i.test(devLang)) push(devLang);
      else {
        const region = devLang.split('-')[1];
        if (region) push(`en-${region.toUpperCase()}`);
      }
    }

    // 3. Primary user base (Indian English), then global + common English packs.
    push('en-IN');
    push('en-US');
    push('en-GB');

    // 4. Device default — omit EXTRA_LANGUAGE so the recognizer uses whatever
    //    offline pack IS installed (Locale.getDefault()). Guaranteed last resort.
    push(undefined);

    return out;
  }

  private async startNativeSession(expectedText: string): Promise<VoiceSessionResult> {
    const { speechRecognition } = await NativeSpeechRecognition.checkPermissions();
    if (speechRecognition !== 'granted') {
      const { speechRecognition: granted } = await NativeSpeechRecognition.requestPermissions();
      if (granted !== 'granted') {
        this.state$.next('error');
        throw new Error('Microphone permission denied. Please allow access in Settings and try again.');
      }
    }

    if (this._intentionalStop) {
      this.state$.next('idle');
      return this.buildEmptyResult(expectedText);
    }

    this.startTimeMs = Date.now();
    this.state$.next('listening');

    let cachedLang = '';
    try { cachedLang = localStorage.getItem(this._langCacheKey) || ''; } catch { /* ignore */ }
    const candidates = this.buildLanguageCandidates(cachedLang);
    console.debug('[VRE] Native session start', { deviceLang: navigator.language, cachedLang, candidates });

    return new Promise<VoiceSessionResult>((resolve, reject) => {
      const SILENCE_MS          = 1200;   // pause after last partial ⇒ user finished (snappy, Duolingo-like)
      const KEEPALIVE_MS        = 7000;   // no signal this long ⇒ recognizer timed out on silence; relisten
      const HARD_CEIL_MS        = 30000;  // absolute ceiling for the whole turn
      const RESTART_GAP_MS      = 300;    // let the recognizer release before the next start
      const MAX_SILENT_RESTARTS = 2;      // silent relistens on one language before trying the next candidate

      let latestTranscript = '';
      let lastPartialSeen  = '';
      let langConfirmed    = false; // true once 'started'/'partial' arrives — never switch language after this
      let attemptIndex     = 0;     // index into `candidates`
      let silentRestarts   = 0;     // consecutive relistens on the current language with no signal
      let attemptToken     = 0;     // bumped each (re)start; stale-attempt callbacks ignored
      let settled          = false;

      let silenceTimer:   any = null;
      let keepaliveTimer: any = null;
      let hardTimeout:    any = null;
      let stopPoll:       any = null;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(silenceTimer);
        clearTimeout(keepaliveTimer);
        clearTimeout(hardTimeout);
        clearInterval(stopPoll);
        if (this.nativeSpeechListener) { this.nativeSpeechListener.remove(); this.nativeSpeechListener = null; }
        if (this.nativeStateListener)  { this.nativeStateListener.remove();  this.nativeStateListener = null; }
        this.interimTranscript$.next('');
        fn();
      };

      const finalizeWithTranscript = () => settle(() => {
        NativeSpeechRecognition.stop().catch(() => {});
        if (this._intentionalStop) {
          this.state$.next('idle');
          resolve(this.buildEmptyResult(expectedText));
          return;
        }
        if (!latestTranscript) {
          this.state$.next('error');
          reject(new Error('No speech detected. Please tap the mic and speak clearly.'));
          return;
        }
        resolve(this.finalizeNative(expectedText, latestTranscript));
      });

      const confirmLanguage = (lang: string | undefined) => {
        if (langConfirmed) return;
        langConfirmed = true;
        if (lang) { try { localStorage.setItem(this._langCacheKey, lang); } catch { /* ignore */ } }
        console.debug('[VRE] Native language confirmed', { lang: lang ?? '(device default)' });
      };

      // The recognizer ended (onEndOfSpeech / swallowed timeout) with no usable
      // transcript yet. Keep the mic open by relistening on the SAME language —
      // Android's SpeechRecognizer is single-utterance, and a still-preparing user
      // simply produces no signal. Only after MAX_SILENT_RESTARTS silent relistens
      // (i.e. the language genuinely yields nothing) do we move to the next candidate.
      // This is what separates "user hasn't spoken yet" (common — same language) from
      // "language not installed" (rare — advance), without the short watchdog that used
      // to cut off slow speakers and thrash a working recognizer.
      const relisten = (reason: string) => {
        if (settled || latestTranscript) return;
        attemptToken++;                     // invalidate the ended attempt's callbacks
        clearTimeout(keepaliveTimer);
        clearTimeout(silenceTimer);
        NativeSpeechRecognition.stop().catch(() => {});

        if (!langConfirmed) {
          silentRestarts++;
          if (silentRestarts > MAX_SILENT_RESTARTS) {
            silentRestarts = 0;
            attemptIndex++;
            if (attemptIndex >= candidates.length) {
              settle(() => {
                this.state$.next('error');
                reject(new Error('Speech recognition is unavailable on this device. Open Settings → System → Languages & input → Voice input and download an English voice model, then try again.'));
              });
              return;
            }
          }
        }
        console.debug('[VRE] Native relisten', { reason, attemptIndex, silentRestarts, langConfirmed });
        setTimeout(() => startAttempt(), RESTART_GAP_MS);
      };

      const startAttempt = async () => {
        if (settled) return;
        const myToken = ++attemptToken;
        const lang = candidates[attemptIndex];

        if (this.nativeSpeechListener) { this.nativeSpeechListener.remove(); this.nativeSpeechListener = null; }
        if (this.nativeStateListener)  { this.nativeStateListener.remove();  this.nativeStateListener = null; }

        this.nativeSpeechListener = await NativeSpeechRecognition.addListener(
          'partialResults',
          (data: { matches: string[] }) => {
            if (settled || myToken !== attemptToken) return;
            if (data?.matches?.length > 0) {
              confirmLanguage(lang);
              clearTimeout(keepaliveTimer);     // speech is flowing — don't relisten
              latestTranscript = data.matches[0];
              this.interimTranscript$.next(latestTranscript);
              if (latestTranscript !== lastPartialSeen) {
                lastPartialSeen = latestTranscript;
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                  NativeSpeechRecognition.stop().catch(() => {});
                  finalizeWithTranscript();
                }, SILENCE_MS);
              }
            }
          }
        );

        this.nativeStateListener = await NativeSpeechRecognition.addListener(
          'listeningState',
          (data: { status: string }) => {
            if (settled || myToken !== attemptToken) return;
            // onBeginningOfSpeech — speech onset detected, so this language works.
            if (data.status === 'started') { confirmLanguage(lang); return; }
            if (data.status !== 'stopped') return;
            // onEndOfSpeech. With a transcript → done; otherwise keep the mic open.
            if (latestTranscript) { finalizeWithTranscript(); return; }
            relisten('stopped');
          }
        );

        if (settled || myToken !== attemptToken) return;

        console.debug('[VRE] Native start()', { attemptIndex, lang: lang ?? '(device default)' });
        NativeSpeechRecognition.start({ language: lang, maxResults: 3, partialResults: true, popup: false })
          .catch((e: any) => {
            if (settled || myToken !== attemptToken) return;
            console.warn('[VRE] Native start() threw', { lang, err: e?.message ?? e });
            relisten('start-threw');
          });

        // Keep-alive: if the recognizer delivers no speech signal within the window it
        // almost certainly timed out on silence (the error is swallowed). Relisten so a
        // slow user is never stranded with a dead mic. Cleared as soon as a partial
        // arrives. A long window (7 s) deliberately lets users read + start speaking.
        clearTimeout(keepaliveTimer);
        keepaliveTimer = setTimeout(() => {
          if (settled || myToken !== attemptToken || latestTranscript) return;
          console.warn('[VRE] Keep-alive — no speech yet, relistening', { lang: lang ?? '(device default)', silentRestarts, langConfirmed });
          relisten('keepalive');
        }, KEEPALIVE_MS);
      };

      // External stop (user taps mic) — finalize with whatever was captured.
      stopPoll = setInterval(() => {
        if (this._intentionalStop) {
          NativeSpeechRecognition.stop().catch(() => {});
          settle(() => {
            if (latestTranscript) {
              resolve(this.finalizeNative(expectedText, latestTranscript));
            } else {
              this.state$.next('idle');
              resolve(this.buildEmptyResult(expectedText));
            }
          });
        }
      }, 100);

      hardTimeout = setTimeout(() => finalizeWithTranscript(), HARD_CEIL_MS);

      startAttempt();
    });
  }

  private finalizeNative(expectedText: string, transcript: string): VoiceSessionResult {
    const elapsed = Date.now() - this.startTimeMs;
    const confidence = 0.85; // plugin does not return per-word confidence

    // VAD is never started on the native path, so there is nothing to stop here.
    this.state$.next('processing');
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
      pauseCount:       0, // VAD not used on native — no pause data
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
    // On mobile browsers with SpeechRecognition available, skip the getUserMedia
    // permission probe entirely. Edge/Chrome mobile do not release the audio
    // hardware immediately after stream.getTracks().forEach(t => t.stop()), so a
    // SpeechRecognition.start() call that follows gets an audio-capture error.
    // SpeechRecognition handles its own permission prompt — not-allowed is caught
    // in onerror and surfaced as a clear user-facing message.
    const hasSpeechApi = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    if (this._isMobile && hasSpeechApi) {
      console.debug('[VRE] Mobile browser — skipping getUserMedia probe, SpeechRecognition handles permissions');
      return true;
    }

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
    // en-IN is preferred. Edge mobile does not support it — _useFallbackLang is set
    // to true after the first language-not-supported error and subsequent attempts use en-US.
    this.recognition.lang = this._useFallbackLang ? 'en-US' : 'en-IN';
    // continuous=true only on desktop — mobile Chrome with continuous=true fires onend
    // every ~5 s (internal browser timeout) causing restart bells mid-speech.
    // With continuous=false the browser handles end-of-speech naturally and isFinal fires reliably.
    this.recognition.continuous = !this.isIOS && !this._isMobile;
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
        console.warn('[BELL] iOS restart after final result — bell will fire', { finals: this.allFinalTranscripts.length });
        try { this.recognition.start(); } catch (e) { /* already started */ }
      }
    };

    // ── EVENT: no speech match ───────────────────────────────────────────────
    this.recognition.onnomatch = () => {
      console.debug('[VRE] onnomatch — recognizer could not match any speech');
      this.interimTranscript$.next('');
    };

    // ── EVENTS: audio/speech lifecycle (diagnostics) ─────────────────────────
    // These confirm the mic actually opened and the user's voice reached the
    // recognizer. On an insecure context or a backend-less engine, onaudiostart
    // never fires — the gap between 'onstart' and 'onaudiostart' in the logs is
    // the tell-tale signature of a blocked Web Speech path.
    this.recognition.onstart       = () => console.debug('[VRE] onstart — speech service started', { lang: this.recognition?.lang });
    this.recognition.onaudiostart  = () => console.debug('[VRE] onaudiostart — microphone audio capture began');
    this.recognition.onspeechstart = () => console.debug('[VRE] onspeechstart — speech detected');
    this.recognition.onspeechend   = () => console.debug('[VRE] onspeechend — speech ended');
    this.recognition.onaudioend    = () => console.debug('[VRE] onaudioend — microphone audio capture ended');

    // ── EVENT: error handling ────────────────────────────────────────────────
    this.recognition.onerror = (event: any) => {
      console.warn('[VRE] Recognition error', { error: event.error, retryCount: this.retryCount, _hasSpoken: this._hasSpoken, lang: this.recognition?.lang });

      // Permission denied — SpeechRecognition itself asked and was refused.
      // Surfaces when getUserMedia probe is skipped on mobile browsers.
      if (event.error === 'not-allowed') {
        this.state$.next('error');
        this.vad.stop();
        reject(new Error('Microphone permission denied. Please allow microphone access in your browser settings and try again.'));
        return;
      }

      // 'service-not-allowed' = the browser has the Web Speech API surface but no
      // working speech backend (classic Edge/Firefox-on-Android case), or the OS
      // dictation service is disabled. This is NOT retryable — surface a clear,
      // browser-specific recommendation rather than spinning through generic retries.
      if (event.error === 'service-not-allowed') {
        this.state$.next('error');
        this.vad.stop();
        const engineHint = (this._engine === 'edge' || this._engine === 'firefox')
          ? ` ${this._engine === 'edge' ? 'Edge' : 'Firefox'} on mobile does not provide a speech service.`
          : '';
        reject(new Error(`Speech recognition isn't available in this browser.${engineHint} Please use Google Chrome, or install the GoWithFlow app.`));
        return;
      }

      // Edge mobile does not support en-IN. Retry once with en-US as fallback.
      if (event.error === 'language-not-supported' && !this._useFallbackLang) {
        console.warn('[VRE] language-not-supported for en-IN — retrying with en-US');
        this._useFallbackLang = true;
        setTimeout(() => this.startRecognition(expectedText, resolve, reject), 300);
        return;
      }

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
        console.warn('[BELL] Retry after error — bell will fire on restart', { error: event.error, attempt: this.retryCount });
        setTimeout(() => this.startRecognition(expectedText, resolve, reject), 500);
      } else {
        this.state$.next('error');
        this.vad.stop();
        // A terminal 'network' error after retries is, on mobile, usually a browser
        // with no speech backend (Edge/Firefox) rather than a real connectivity drop —
        // point the user at a supported path instead of an opaque error code.
        if (event.error === 'network' && this._isMobile && (this._engine === 'edge' || this._engine === 'firefox')) {
          reject(new Error(`Speech recognition isn't available in ${this._engine === 'edge' ? 'Edge' : 'Firefox'} on mobile. Please use Google Chrome, or install the GoWithFlow app.`));
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
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

      if (this.state$.value !== 'listening') return;

      if (this.allFinalTranscripts.length > 0) {
        if (this._isMobile && !this.isIOS) {
          // Mobile (continuous=false): onend fires after each utterance — restart
          // for more speech. The silence timer fires finalize when user truly stops.
          console.warn('[BELL] Mobile onend restart after finals — bell will fire', { finals: this.allFinalTranscripts.length });
          try { this.recognition.start(); } catch (e) { /* ignore */ }
        } else {
          // Desktop (continuous=true): onend with finals means recognition ended cleanly
          this.finalize(expectedText, resolve);
        }
        // iOS: onresult already restarted recognition; silence timer handles finalize
      } else if (!this.isIOS) {
        // No finals yet — restart to keep listening
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.warn('[BELL] Unexpected onend — restarting, bell will fire', { attempt: this.retryCount });
          setTimeout(() => {
            if (this.state$.value === 'listening') {
              try { this.recognition.start(); } catch (e) { /* ignore */ }
            }
          }, 300);
        }
      }
    };

    // Initial fallback: if no activity at all within this window, finalise
    // with whatever transcripts exist (or an empty result).
    const fallbackMs = this._isMobile ? 12000 : 8000;
    this.resetSilenceTimeout(() => this.finalize(expectedText, resolve), fallbackMs);

    console.warn('[BELL] Initial recognition.start() — bell will fire now', {
      isMobile: this._isMobile,
      isIOS: this.isIOS,
      continuous: this.recognition.continuous,
      retryCount: this.retryCount
    });
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

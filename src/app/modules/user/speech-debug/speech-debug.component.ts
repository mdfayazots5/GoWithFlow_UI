import {
  Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import {
  VoiceRecognitionEngine,
  VoiceSessionResult,
  RecordingState
} from '@core/services/voice/voice-recognition.engine';

// ─── Types ──────────────────────────────────────────────────────────────────

type LogLevel = 'START' | 'STATE' | 'PERM' | 'MIC' | 'VOICE' | 'SILENCE' | 'TRANSCRIPT' | 'API' | 'SCORE' | 'ERROR' | 'INFO' | 'STOP';

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
}

interface DeviceInfo {
  platform: string;
  isNative: boolean;
  isMobile: boolean;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  speechApiAvailable: boolean;
  online: boolean;
  isSecureContext: boolean;
  origin: string;
  browserEngine: string;
  speechSupported: boolean;
  blockerReason: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-speech-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gw-bg pb-24">
  <div class="max-w-lg mx-auto px-4 pt-4 space-y-3">

    <!-- Header -->
    <div class="flex items-center gap-3">
      <button (click)="goBack()"
              class="w-9 h-9 rounded-xl bg-white border border-gw-card-border flex items-center justify-center shrink-0 active:scale-95 transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gw-text">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div>
        <h1 class="text-base font-black text-gw-text tracking-tight">Speech Debug</h1>
        <p class="text-[11px] text-gw-text-muted font-semibold uppercase tracking-widest">Voice Recognition Diagnostic</p>
      </div>
    </div>

    <!-- Device Info Card -->
    <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
      <button (click)="deviceExpanded.set(!deviceExpanded())"
              class="w-full flex items-center justify-between px-4 py-3 text-left">
        <span class="text-[11px] font-black text-gw-primary uppercase tracking-widest">Device &amp; Platform</span>
        <svg [class.rotate-180]="deviceExpanded()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gw-text-muted transition-transform duration-200">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      @if (deviceExpanded()) {
        <div class="px-4 pb-4 space-y-1 border-t border-gw-bg">
          @for (row of deviceRows; track row.label) {
            <div class="flex justify-between items-start gap-2 py-1">
              <span class="text-[11px] font-black text-gw-text-muted uppercase tracking-wide shrink-0">{{ row.label }}</span>
              <span class="text-[11px] font-semibold text-gw-text text-right break-all leading-relaxed">{{ row.value }}</span>
            </div>
          }
        </div>
      }
    </div>

    <!-- Test Phrase Input -->
    <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm px-4 py-3 space-y-2">
      <label class="text-[11px] font-black text-gw-primary uppercase tracking-widest">Test Phrase</label>
      <textarea
        [(ngModel)]="expectedText"
        [disabled]="isRunning()"
        rows="2"
        class="w-full text-sm font-semibold text-gw-text bg-gw-bg rounded-xl px-3 py-2 border border-gw-card-border resize-none focus:outline-none focus:border-gw-primary disabled:opacity-50"
        placeholder="Type expected text...">
      </textarea>
      <div class="flex gap-2 flex-wrap">
        @for (phrase of presets; track phrase) {
          <button (click)="setPreset(phrase)"
                  [disabled]="isRunning()"
                  class="text-[11px] font-black px-2.5 py-1 rounded-lg border border-gw-card-border text-gw-text-muted hover:border-gw-primary hover:text-gw-primary active:scale-95 transition-all disabled:opacity-40">
            {{ phrase.substring(0, 20) }}…
          </button>
        }
      </div>
    </div>

    <!-- Controls + Live State -->
    <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm px-4 py-3 space-y-3">

      <div class="flex gap-2">
        <button (click)="startTest()"
                [disabled]="isRunning()"
                class="flex-1 py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                [style.background]="isRunning() ? '#9CA3AF' : '#3D5A99'">
          {{ isRunning() ? 'Running...' : '● Start Test' }}
        </button>
        <button (click)="stopTest()"
                [disabled]="!isRunning()"
                class="flex-1 py-3 rounded-xl font-black text-sm border transition-all active:scale-95 disabled:opacity-30"
                style="border-color:#EF4444; color:#EF4444;">
          ■ Stop
        </button>
      </div>

      <!-- State Pill + Volume Bar -->
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide"
              [style.background]="stateColor(currentState()).bg"
              [style.color]="stateColor(currentState()).text">
          {{ currentState() }}
        </span>
        <div class="flex-1 h-2 bg-gw-bg rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-100"
               [style.width.%]="volumeLevel()"
               [style.background]="volumeLevel() > 15 ? '#22C55E' : '#D1D5DB'">
          </div>
        </div>
        <span class="text-[11px] font-black text-gw-text-muted w-8 text-right">{{ volumeLevel().toFixed(0) }}</span>
      </div>

      <!-- Interim Transcript -->
      @if (interimText()) {
        <div class="bg-gw-bg rounded-xl px-3 py-2">
          <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-widest mb-1">Interim</p>
          <p class="text-sm font-semibold text-gw-text italic">"{{ interimText() }}"</p>
        </div>
      }
    </div>

    <!-- Log Panel -->
    <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gw-bg">
        <span class="text-[11px] font-black text-gw-primary uppercase tracking-widest">
          Logs ({{ logs().length }})
        </span>
        <button (click)="clearLogs()"
                class="text-[11px] font-black text-gw-text-muted hover:text-gw-text uppercase tracking-wide px-2 py-1 rounded-lg hover:bg-gw-bg transition-all">
          Clear
        </button>
      </div>

      <div #logPanel class="overflow-y-auto font-mono" style="max-height: 320px; min-height: 80px;">
        @if (logs().length === 0) {
          <p class="text-[11px] text-gw-text-muted text-center py-6 italic">Tap Start Test to begin logging</p>
        }
        @for (entry of logs(); track $index) {
          <div class="flex gap-2 px-3 py-1 border-b border-gw-bg last:border-0"
               [style.background]="logBg(entry.level)">
            <span class="text-[11px] text-gw-text-muted shrink-0 pt-px leading-5">{{ entry.ts }}</span>
            <span class="text-[11px] font-black shrink-0 w-16 pt-px leading-5"
                  [style.color]="logColor(entry.level)">{{ entry.level }}</span>
            <span class="text-[11px] text-gw-text leading-5 break-all">{{ entry.msg }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Result Card -->
    @if (sessionResult()) {
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm px-4 py-4 space-y-3 animate-in fade-in duration-300">
        <p class="text-[11px] font-black text-gw-primary uppercase tracking-widest">Result</p>

        <!-- Score row -->
        <div class="grid grid-cols-3 gap-2">
          @for (s of scoreRows(); track s.label) {
            <div class="bg-gw-bg rounded-xl px-3 py-2 text-center">
              <p class="text-xl font-black" [style.color]="scoreColor(s.val)">{{ s.val }}</p>
              <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-wide mt-0.5">{{ s.label }}</p>
            </div>
          }
        </div>

        <!-- Transcribed text -->
        <div class="bg-gw-bg rounded-xl px-3 py-2 space-y-1">
          <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-wide">Transcribed</p>
          <p class="text-sm font-semibold text-gw-text italic">"{{ sessionResult()!.transcribedText || '(empty)' }}"</p>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="flex justify-between border-b border-gw-bg pb-1">
            <span class="font-black text-gw-text-muted uppercase">Speed</span>
            <span class="font-bold text-gw-text">{{ sessionResult()!.speakingSpeedWpm }} wpm</span>
          </div>
          <div class="flex justify-between border-b border-gw-bg pb-1">
            <span class="font-black text-gw-text-muted uppercase">Duration</span>
            <span class="font-bold text-gw-text">{{ sessionResult()!.durationMs }}ms</span>
          </div>
          <div class="flex justify-between border-b border-gw-bg pb-1">
            <span class="font-black text-gw-text-muted uppercase">Pauses</span>
            <span class="font-bold text-gw-text">{{ sessionResult()!.pauseCount }}</span>
          </div>
          <div class="flex justify-between border-b border-gw-bg pb-1">
            <span class="font-black text-gw-text-muted uppercase">Retries</span>
            <span class="font-bold text-gw-text">{{ sessionResult()!.retryCount }}</span>
          </div>
        </div>

        <!-- Hesitations -->
        @if (sessionResult()!.hesitationWords.length) {
          <div>
            <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-wide mb-1">Hesitations</p>
            <div class="flex flex-wrap gap-1">
              @for (w of sessionResult()!.hesitationWords; track w) {
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg" style="background:rgba(239,68,68,0.1);color:#EF4444;">{{ w }}</span>
              }
            </div>
          </div>
        }

        <!-- Word breakdown -->
        <div>
          <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-wide mb-1">Word Breakdown</p>
          <div class="flex flex-wrap gap-1">
            @for (w of sessionResult()!.wordResults; track $index) {
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                    [style.background]="w.matched ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'"
                    [style.color]="w.matched ? '#16A34A' : '#EF4444'">
                {{ w.word || '—' }}
              </span>
            }
          </div>
        </div>
      </div>
    }

  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    textarea { font-family: inherit; }
  `]
})
export class SpeechDebugComponent implements OnInit, OnDestroy, AfterViewChecked {

  private engine = inject(VoiceRecognitionEngine);
  private router  = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild('logPanel') logPanelRef?: ElementRef<HTMLDivElement>;

  // ── Reactive state ───────────────────────────────────────────────────────
  currentState   = signal<RecordingState>('idle');
  interimText    = signal('');
  volumeLevel    = signal(0);
  isRunning      = signal(false);
  logs           = signal<LogEntry[]>([]);
  sessionResult  = signal<VoiceSessionResult | null>(null);
  deviceExpanded = signal(true);

  expectedText = 'Hello, my name is. Please test the microphone.';

  readonly presets = [
    'The quick brown fox jumps over the lazy dog',
    'Good morning, how are you today?',
    'I would like to schedule a meeting for tomorrow',
    'Please repeat after me slowly and clearly',
  ];

  // ── Device info ──────────────────────────────────────────────────────────
  readonly deviceInfo: DeviceInfo = this.buildDeviceInfo();
  readonly deviceRows = this.buildDeviceRows();

  // ── Voice/silence tracking ───────────────────────────────────────────────
  private lastVoiceActive = false;
  private shouldScrollLogs = false;

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Track every engine state transition
    this.engine.state$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      const prev = this.currentState();
      this.currentState.set(s);

      if (prev === s) return;

      this.addLog('STATE', `${prev} → ${s}`);

      switch (s) {
        case 'requesting':
          this.addLog('PERM', 'Requesting microphone / speech permission from OS');
          break;
        case 'listening':
          this.addLog('MIC', 'Microphone open — engine is now listening');
          this.addLog('INFO', `Native path: ${this.deviceInfo.isNative} | Mobile: ${this.deviceInfo.isMobile}`);
          this.lastVoiceActive = false;
          break;
        case 'processing':
          this.addLog('API', 'Speech ended — running scoring pipeline (PronunciationScorer + TranscriptNormalizer)');
          break;
        case 'done':
          this.addLog('SCORE', 'Scoring pipeline complete');
          break;
        case 'error':
          this.addLog('ERROR', 'Engine entered error state — check next log entry');
          break;
        case 'idle':
          if (prev !== 'idle') this.addLog('STOP', 'Engine returned to idle');
          break;
      }
    });

    // Track interim transcript updates
    this.engine.interimTranscript$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      const prev = this.interimText();
      this.interimText.set(t);
      if (t && t !== prev && t.trim().length > 0) {
        this.addLog('TRANSCRIPT', `Interim: "${t.substring(0, 80)}${t.length > 80 ? '…' : ''}"`);
      }
    });

    // Track volume — derive voice/silence transitions
    this.engine.volumeLevel$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.volumeLevel.set(v);

      if (this.currentState() !== 'listening') return;

      const isVoice = v > 15;
      if (isVoice && !this.lastVoiceActive) {
        this.lastVoiceActive = true;
        this.addLog('VOICE', `Voice activity detected (vol: ${v.toFixed(1)})`);
      } else if (!isVoice && this.lastVoiceActive && v < 6) {
        this.lastVoiceActive = false;
        this.addLog('SILENCE', `Silence detected (vol: ${v.toFixed(1)}) — silence timer may start`);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollLogs && this.logPanelRef?.nativeElement) {
      const el = this.logPanelRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScrollLogs = false;
    }
  }

  ngOnDestroy(): void {
    this.engine.stopSession();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Controls ────────────────────────────────────────────────────────────

  async startTest(): Promise<void> {
    if (this.isRunning()) return;

    this.logs.set([]);
    this.sessionResult.set(null);
    this.isRunning.set(true);
    this.lastVoiceActive = false;

    this.addLog('START', '══════ Speech Debug Session Started ══════');
    this.addLog('INFO',  `Platform: ${this.deviceInfo.platform}`);
    this.addLog('INFO',  `Capacitor native: ${this.deviceInfo.isNative}`);
    this.addLog('INFO',  `Mobile UA: ${this.deviceInfo.isMobile}`);
    this.addLog('INFO',  `Browser engine: ${this.deviceInfo.browserEngine}`);
    this.addLog(this.deviceInfo.isSecureContext ? 'INFO' : 'ERROR',
                `Secure context: ${this.deviceInfo.isSecureContext} (origin: ${this.deviceInfo.origin})`);
    this.addLog('INFO',  `Web Speech API: ${this.deviceInfo.speechApiAvailable}`);
    this.addLog(this.deviceInfo.speechSupported ? 'INFO' : 'ERROR',
                `Speech supported: ${this.deviceInfo.speechSupported}`);
    if (this.deviceInfo.blockerReason) {
      this.addLog('ERROR', `Blocker: ${this.deviceInfo.blockerReason}`);
    }
    this.addLog('INFO',  `Online: ${this.deviceInfo.online}`);
    this.addLog('INFO',  `Screen: ${this.deviceInfo.screen} @ ${this.deviceInfo.pixelRatio}x`);
    this.addLog('INFO',  `UA: ${this.deviceInfo.ua}`);
    this.addLog('INFO',  `Expected text (${this.expectedText.length} chars): "${this.expectedText}"`);
    this.addLog('INFO',  'Calling engine.startSession()…');

    const t0 = Date.now();
    try {
      const result = await this.engine.startSession(this.expectedText);
      const elapsed = Date.now() - t0;

      this.sessionResult.set(result);
      this.isRunning.set(false);

      this.addLog('SCORE',  `Overall: ${result.overallScore}  Fluency: ${result.fluencyScore}  Confidence: ${result.confidenceScore}`);
      this.addLog('SCORE',  `Speed: ${result.speakingSpeedWpm}wpm  Duration: ${result.durationMs}ms  Pauses: ${result.pauseCount}  Retries: ${result.retryCount}`);
      this.addLog('TRANSCRIPT', `Final: "${result.transcribedText}"`);
      this.addLog('TRANSCRIPT', `Expected: "${result.expectedText}"`);

      if (result.hesitationWords.length) {
        this.addLog('INFO', `Hesitations: ${result.hesitationWords.join(', ')}`);
      }
      if (result.repeatedWords.length) {
        this.addLog('INFO', `Repeated words: ${result.repeatedWords.join(', ')}`);
      }

      const wordDetail = result.wordResults
        .map(w => `${w.word}(${w.matched ? '✓' : '✗'}${w.score})`)
        .join(' ');
      this.addLog('SCORE', `Words: ${wordDetail.substring(0, 120)}`);
      this.addLog('START', `══════ Session Complete (${elapsed}ms) ══════`);

    } catch (err: any) {
      const elapsed = Date.now() - t0;
      this.isRunning.set(false);
      this.addLog('ERROR', `Exception after ${elapsed}ms: ${err?.message ?? 'Unknown error'}`);
      if (err?.stack) {
        const firstLine = String(err.stack).split('\n').slice(0, 2).join(' | ');
        this.addLog('ERROR', `Stack: ${firstLine}`);
      }
      this.addLog('START', `══════ Session Failed (${elapsed}ms) ══════`);
    }
  }

  stopTest(): void {
    if (!this.isRunning()) return;
    this.addLog('STOP', 'Stop requested by user — calling engine.stopSession()');
    this.engine.stopSession();
    this.isRunning.set(false);
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  setPreset(phrase: string): void {
    this.expectedText = phrase;
  }

  goBack(): void {
    this.router.navigate(['/user/dashboard']);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private addLog(level: LogLevel, msg: string): void {
    const now = new Date();
    const ts = now.toTimeString().substring(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const entry: LogEntry = { ts, level, msg };

    this.logs.update(l => [...l, entry]);
    this.shouldScrollLogs = true;

    // Mirror to console for ADB logcat filtering with: adb logcat | findstr "GWF-DEBUG"
    console.log(`[GWF-DEBUG] [${level}] ${ts} ${msg}`);
  }

  stateColor(s: RecordingState): { bg: string; text: string } {
    const map: Record<RecordingState, { bg: string; text: string }> = {
      idle:       { bg: 'rgba(156,163,175,0.15)', text: '#6B7280' },
      requesting: { bg: 'rgba(245,158,11,0.15)',  text: '#D97706' },
      listening:  { bg: 'rgba(34,197,94,0.15)',   text: '#16A34A' },
      processing: { bg: 'rgba(99,102,241,0.15)',  text: '#4F46E5' },
      done:       { bg: 'rgba(61,90,153,0.15)',   text: '#3D5A99' },
      error:      { bg: 'rgba(239,68,68,0.15)',   text: '#DC2626' },
    };
    return map[s] ?? map['idle'];
  }

  logColor(level: LogLevel): string {
    const map: Record<LogLevel, string> = {
      START:      '#3D5A99',
      STATE:      '#7C3AED',
      PERM:       '#D97706',
      MIC:        '#16A34A',
      VOICE:      '#059669',
      SILENCE:    '#6B7280',
      TRANSCRIPT: '#2563EB',
      API:        '#7C3AED',
      SCORE:      '#D97706',
      ERROR:      '#DC2626',
      INFO:       '#374151',
      STOP:       '#EF4444',
    };
    return map[level] ?? '#374151';
  }

  logBg(level: LogLevel): string {
    if (level === 'ERROR' || level === 'STOP') return 'rgba(239,68,68,0.04)';
    if (level === 'START') return 'rgba(61,90,153,0.04)';
    if (level === 'SCORE') return 'rgba(245,158,11,0.04)';
    return 'transparent';
  }

  scoreRows(): { label: string; val: number }[] {
    const r = this.sessionResult();
    if (!r) return [];
    return [
      { label: 'Overall',    val: r.overallScore },
      { label: 'Fluency',    val: r.fluencyScore },
      { label: 'Confidence', val: r.confidenceScore },
    ];
  }

  scoreColor(val: number): string {
    if (val >= 80) return '#16A34A';
    if (val >= 55) return '#D97706';
    return '#DC2626';
  }

  // ─── Device info ─────────────────────────────────────────────────────────

  private buildDeviceInfo(): DeviceInfo {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const cap = this.engine.getCapabilities();
    return {
      platform:            typeof navigator !== 'undefined' ? (navigator.platform || 'unknown') : 'unknown',
      isNative:            Capacitor.isNativePlatform(),
      isMobile:            /Android|iPhone|iPad|iPod/i.test(ua),
      ua:                  ua.substring(0, 200),
      screen:              typeof screen !== 'undefined' ? `${screen.width}×${screen.height}` : 'unknown',
      pixelRatio:          typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      language:            typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      speechApiAvailable:  cap.hasSpeechApi,
      online:              cap.online,
      isSecureContext:     cap.isSecureContext,
      origin:              cap.origin,
      browserEngine:       cap.browserEngine,
      speechSupported:     cap.speechSupported,
      blockerReason:       cap.blockerReason,
    };
  }

  private buildDeviceRows(): { label: string; value: string }[] {
    const d = this.buildDeviceInfo();
    return [
      { label: 'Platform',        value: d.platform },
      { label: 'Native (Cap)',    value: String(d.isNative) },
      { label: 'Mobile UA',       value: String(d.isMobile) },
      { label: 'Browser Engine',  value: d.browserEngine },
      { label: 'Secure Context',  value: d.isSecureContext ? 'true ✓' : 'FALSE ✗ — Web Speech blocked' },
      { label: 'Origin',          value: d.origin },
      { label: 'Web Speech API',  value: String(d.speechApiAvailable) },
      { label: 'Speech Supported',value: d.speechSupported ? 'true ✓' : 'false ✗' },
      { label: 'Blocker',         value: d.blockerReason ?? 'none' },
      { label: 'Screen',          value: `${d.screen} @ ${d.pixelRatio}x` },
      { label: 'Language',        value: d.language },
      { label: 'Online',          value: String(d.online) },
      { label: 'User Agent',      value: d.ua },
    ];
  }
}

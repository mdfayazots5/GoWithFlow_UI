import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { TtsService } from './tts.service';
import { ListenMedia, ListenMediaLine } from './listen-media.plugin';
import { AI_VOICES, VoicePersona, getVoicePersona } from './voice-personas';

/**
 * Listen Script — LINE-LEVEL playback engine, with two backends behind one public API:
 *
 *  - **Native (Android):** delegates to the `ListenMedia` foreground media service so playback
 *    survives lock/background and exposes lock-screen + notification-panel controls. The service is
 *    the source of truth; this engine sends the queue/commands and mirrors `stateChanged` events
 *    back into the signals the UI reads.
 *  - **Web:** a JS line-by-line loop over `TtsService` (no lock screen on the web platform).
 *
 * The on-device TTS engine speaks a whole line and signals only when it finishes — NO word timing,
 * NO mid-line seek. So granularity is the LINE: highlight = current line; "seek/rewind/ff" = jump/
 * prev/next line; "pause" stops the line and resume re-speaks it. OUTPUT only — never opens the mic
 * (Voice constitution rule #1).
 */

export interface PlaybackLine {
  index: number;
  speakerLabel: string;
  text: string;
  hint?: string;
}

export type RepeatMode = 'off' | 'one' | 'all';
// Voice personas (the 6 named Indian voices) live in voice-personas.ts — single source of truth.
export type { VoicePersona } from './voice-personas';

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Distinct display colors per role (assigned by first-appearance order) for the lyrics view. */
const ROLE_COLORS = ['#7C3AED', '#0891B2', '#E07B39', '#2E7D32', '#DB2777', '#3D5A99'];

@Injectable({ providedIn: 'root' })
export class ScriptPlaybackService {
  private tts = inject(TtsService);

  // ── Reactive state ────────────────────────────────────────────────
  readonly scriptId = signal<string | null>(null);
  readonly title = signal('');
  readonly lines = signal<PlaybackLine[]>([]);
  readonly currentIndex = signal(0);
  readonly isPlaying = signal(false);
  readonly rate = signal<number>(1);
  readonly repeat = signal<RepeatMode>('off');
  /** Distinct speaker labels in order of first appearance. */
  readonly roles = signal<string[]>([]);
  /** Per-role voice assignment (label → named Indian persona); user-overridable via the Settings sheet. */
  readonly roleVoices = signal<Record<string, VoicePersona>>({});

  readonly currentLine = computed<PlaybackLine | null>(() => this.lines()[this.currentIndex()] ?? null);
  readonly hasContent = computed(() => this.lines().length > 0);

  // ── Practice / Repeat group (Listen settings) ─────────────────────
  // A learning loop: optionally repeat each line N times and/or pause after each line so the
  // learner can repeat it aloud (shadowing). These are global Listen preferences (not per script),
  // persisted in localStorage. When practice mode is ON the engine uses the JS line loop on every
  // platform (so the per-line repeat/pause timing is honored) — the native foreground media service
  // only drives plain, lock-screen playback when practice is OFF.
  readonly practiceMode = signal(false);
  /** How many times each line is spoken in practice mode (1–3). */
  readonly repeatCount = signal(2);
  /** When true, pause after each line (gap ≈ line length) so the learner repeats it aloud. */
  readonly pauseToRepeat = signal(false);
  /** Pause length as a multiple of the spoken line's estimated duration. */
  private static readonly PAUSE_FACTOR = 1.0;

  /** True when the very next question-jump should be available. */
  readonly questionStarts = computed<number[]>(() => {
    const lines = this.lines();
    const first = this.roles()[0];
    if (!lines.length || first == null) return [0];
    const starts = lines.filter(l => l.speakerLabel === first).map(l => l.index);
    return starts.length ? (starts[0] === 0 ? starts : [0, ...starts]) : [0];
  });

  /** Monotonic token: bumped on any stop so a pending speak()-loop knows it was superseded. */
  private playToken = 0;

  /** True on the Capacitor APK — routes playback through the native foreground media service. */
  private readonly native = Capacitor.isNativePlatform();
  /** Whether the native service has been started for the current script. */
  private nativeStarted = false;

  /**
   * Whether the native foreground media service should drive playback. Practice mode forces the JS
   * line loop on every platform so per-line repeat/pause timing works (the native service has no
   * notion of practice repeats).
   */
  private useNativeService(): boolean {
    return this.native && !this.practiceMode();
  }

  constructor() {
    this.loadPrefs();
    // Mirror native playback state (incl. lock-screen / notification control actions) into signals.
    if (this.native) {
      void ListenMedia.addListener('stateChanged', s => {
        // Ignore native events while practice mode (JS loop) owns playback.
        if (this.practiceMode()) return;
        this.currentIndex.set(s.index);
        this.isPlaying.set(s.isPlaying);
        this.rate.set(s.rate);
        this.repeat.set(s.repeat);
        this.persist();
      });
    }
  }

  /**
   * Loads a script's utterances into the engine and restores the last-listened position for
   * this script ("Continue From Last Position"). Resets transport state.
   */
  load(scriptId: string, title: string, utterances: Array<{ speakerLabel: string; englishText: string; hintText?: string }>): void {
    this.stopInternal();

    const lines: PlaybackLine[] = (utterances ?? []).map((u, i) => ({
      index: i,
      speakerLabel: u.speakerLabel,
      text: u.englishText,
      hint: u.hintText,
    }));

    const roles: string[] = [];
    const roleVoices: Record<string, VoicePersona> = {};
    for (const l of lines) {
      if (!roles.includes(l.speakerLabel)) {
        // Assign a distinct named Indian persona per role, in first-appearance order.
        roleVoices[l.speakerLabel] = AI_VOICES[roles.length % AI_VOICES.length];
        roles.push(l.speakerLabel);
      }
    }

    this.scriptId.set(scriptId);
    this.title.set(title ?? '');
    this.lines.set(lines);
    this.roles.set(roles);
    this.roleVoices.set(roleVoices);
    this.isPlaying.set(false);
    this.repeat.set('off');
    this.nativeStarted = false;

    const resume = this.readSavedPosition(scriptId);
    this.currentIndex.set(resume != null && resume < lines.length ? resume : 0);
  }

  // ── Transport ─────────────────────────────────────────────────────

  togglePlay(): void {
    this.isPlaying() ? this.pause() : this.play();
  }

  play(): void {
    if (!this.hasContent() || this.isPlaying()) return;
    this.isPlaying.set(true);
    if (this.useNativeService()) {
      if (!this.nativeStarted) { this.nativeStarted = true; void this.nativeStart(this.currentIndex()); }
      else void ListenMedia.play();
      return;
    }
    void this.runLoop(this.currentIndex());
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.useNativeService()) { void ListenMedia.pause(); this.persist(); return; }
    this.playToken++;          // cancel any in-flight loop
    void this.tts.stop();
    this.persist();
  }

  /**
   * Transport "Next": jump to the START of the NEXT question (music-app style). Falls back to the
   * last line if already in the final question.
   */
  next(): void {
    const starts = this.questionStarts();
    const cur = this.currentIndex();
    const nextStart = starts.find(s => s > cur);
    this.seekTo(nextStart ?? (this.lines().length - 1));
  }

  /**
   * Transport "Back" (music-app style): if we're partway INTO the current question, restart it from
   * its first line; otherwise jump to the START of the PREVIOUS question.
   */
  prev(): void {
    const starts = this.questionStarts();
    const cur = this.currentIndex();
    // Largest start <= cur is the current question's first line.
    let curStartIdx = 0;
    for (let i = 0; i < starts.length; i++) { if (starts[i] <= cur) curStartIdx = i; else break; }
    const curStart = starts[curStartIdx];
    if (cur > curStart) { this.seekTo(curStart); return; }       // restart current question
    this.seekTo(starts[Math.max(0, curStartIdx - 1)]);            // previous question
  }

  /** Step exactly one line earlier/later (used by the line-level seek bar, not the transport). */
  stepLine(delta: number): void {
    this.seekTo(this.currentIndex() + delta);
  }

  /** Jump playback to a tapped line. If playing, narration restarts at that line. */
  seekTo(index: number): void {
    if (!this.hasContent()) return;
    const clamped = Math.max(0, Math.min(this.lines().length - 1, index));
    this.currentIndex.set(clamped);
    this.persist();
    if (this.useNativeService()) { void ListenMedia.seekTo({ index: clamped }); return; }
    const wasPlaying = this.isPlaying();
    this.playToken++;          // cancel current line
    void this.tts.stop();
    if (wasPlaying) {
      this.isPlaying.set(true);
      void this.runLoop(clamped);
    }
  }

  setRate(rate: number): void {
    this.rate.set(rate);
    if (this.useNativeService()) { void ListenMedia.setRate({ rate }); return; }
    if (this.isPlaying()) {
      // Restart the current line so the new speed takes effect immediately.
      const i = this.currentIndex();
      this.playToken++;
      void this.tts.stop();
      void this.runLoop(i);
    }
  }

  cycleSpeed(): void {
    const i = PLAYBACK_SPEEDS.indexOf(this.rate() as typeof PLAYBACK_SPEEDS[number]);
    this.setRate(PLAYBACK_SPEEDS[(i + 1) % PLAYBACK_SPEEDS.length]);
  }

  cycleRepeat(): void {
    const order: RepeatMode[] = ['off', 'one', 'all'];
    this.setRepeat(order[(order.indexOf(this.repeat()) + 1) % order.length]);
  }

  /** Set the repeat mode directly (used by the Settings sheet). */
  setRepeat(mode: RepeatMode): void {
    this.repeat.set(mode);
    if (this.useNativeService()) void ListenMedia.setRepeat({ mode });
  }

  // ── Practice / Repeat group setters ───────────────────────────────

  /** Toggle practice mode. Switches the playback backend (native service ↔ JS loop), preserving position. */
  setPracticeMode(on: boolean): void {
    if (this.practiceMode() === on) return;
    const wasPlaying = this.isPlaying();
    this.stopInternal();              // stop the CURRENT backend (uses old practiceMode value)
    this.practiceMode.set(on);
    this.persistPrefs();
    this.nativeStarted = false;
    if (wasPlaying) this.play();      // resume on the now-correct backend
  }

  /** Set how many times each line repeats in practice mode (clamped 1–3). Takes effect on the next line. */
  setRepeatCount(n: number): void {
    this.repeatCount.set(Math.max(1, Math.min(3, Math.round(n))));
    this.persistPrefs();
  }

  /** Toggle the "pause after each line so I can repeat" gap (practice mode). Takes effect on the next line. */
  setPauseToRepeat(on: boolean): void {
    this.pauseToRepeat.set(on);
    this.persistPrefs();
  }

  /** Stable display color for a role, by its first-appearance order. */
  roleColor(label: string): string {
    const i = this.roles().indexOf(label);
    return ROLE_COLORS[(i < 0 ? 0 : i) % ROLE_COLORS.length];
  }

  /** User override of a role's voice (named Indian persona) from the Settings sheet. */
  setRoleVoice(label: string, personaId: string): void {
    const persona = getVoicePersona(personaId);
    const current = this.roleVoices()[label];
    if (current && current.id === persona.id) return;
    this.roleVoices.update(m => ({ ...m, [label]: persona }));
    if (this.useNativeService()) {
      // Re-send the queue with updated per-line voices; native continues from the current line.
      if (this.nativeStarted && this.isPlaying()) void this.nativeStart(this.currentIndex());
      return;
    }
    if (this.isPlaying() && this.currentLine()?.speakerLabel === label) {
      const i = this.currentIndex();
      this.playToken++;
      void this.tts.stop();
      void this.runLoop(i);
    }
  }

  /** Full teardown — call when leaving the player so nothing keeps speaking. */
  reset(): void {
    this.stopInternal();
    this.scriptId.set(null);
    this.title.set('');
    this.lines.set([]);
    this.roles.set([]);
    this.roleVoices.set({});
    this.currentIndex.set(0);
  }

  // ── Internals ─────────────────────────────────────────────────────

  /**
   * Sequential line loop. `TtsService.speak()` resolves when the line finishes (or when stop()
   * is called); after each await we re-check the token so a superseded loop exits cleanly.
   */
  private async runLoop(startIndex: number): Promise<void> {
    const token = ++this.playToken;
    let i = startIndex;
    const total = this.lines().length;

    while (i >= 0 && i < total && token === this.playToken && this.isPlaying()) {
      this.currentIndex.set(i);
      this.persist();

      const line = this.lines()[i];
      const persona = this.roleVoices()[line.speakerLabel] ?? AI_VOICES[0];

      // Practice mode repeats each line N times, optionally pausing for the learner to repeat aloud.
      const reps = this.practiceMode() ? Math.max(1, this.repeatCount()) : 1;
      for (let r = 0; r < reps; r++) {
        // No explicit lang: TtsService resolves en-IN → en-GB → en-US to whatever the device has
        // installed, so desktop (no en-IN voice) still produces audio instead of silence.
        await this.tts.speak(line.text, {
          rate: this.rate(), gender: persona.gender, pitch: persona.pitch,
          voiceVariant: persona.variant,
        });
        // Superseded (paused / seeked / rate change) — abandon this loop silently.
        if (token !== this.playToken || !this.isPlaying()) return;

        if (this.practiceMode() && this.pauseToRepeat()) {
          await this.delay(this.estimateLineMs(line.text), token);
          if (token !== this.playToken || !this.isPlaying()) return;
        }
      }

      if (this.repeat() === 'one') continue;          // re-speak same line
      i++;
      if (i >= total && this.repeat() === 'all') i = 0; // loop whole script
    }

    // Reached the natural end.
    if (token === this.playToken && this.isPlaying()) {
      this.isPlaying.set(false);
    }
  }

  /** Estimate a spoken line's duration (ms) from word count and rate — used to size the practice pause. */
  private estimateLineMs(text: string): number {
    const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length || 1;
    const base = words * 380;                          // ~380ms/word at rate 1.0
    return Math.max(900, (base / Math.max(0.25, this.rate())) * ScriptPlaybackService.PAUSE_FACTOR);
  }

  /** Cancellable wait that bails the instant the loop is superseded or playback stops. */
  private async delay(ms: number, token: number): Promise<void> {
    let waited = 0;
    const step = 100;
    while (waited < ms) {
      if (token !== this.playToken || !this.isPlaying()) return;
      await new Promise(r => setTimeout(r, Math.min(step, ms - waited)));
      waited += step;
    }
  }

  private stopInternal(): void {
    this.isPlaying.set(false);
    if (this.useNativeService()) { void ListenMedia.stop(); this.nativeStarted = false; return; }
    this.playToken++;
    void this.tts.stop();
  }

  /** Hands the full queue + transport state to the native foreground media service and begins playback. */
  private async nativeStart(startIndex: number): Promise<void> {
    try { await ListenMedia.ensureNotificationPermission(); } catch { /* controls still work, banner may be hidden */ }
    try {
      await ListenMedia.start({
        title: this.title(),
        lines: this.buildNativeLines(),
        startIndex,
        rate: this.rate(),
        repeat: this.repeat(),
      });
    } catch (err) {
      console.error('[ListenMedia] native start failed', err);
      this.isPlaying.set(false);
      this.nativeStarted = false;
    }
  }

  private buildNativeLines(): ListenMediaLine[] {
    const voices = this.roleVoices();
    return this.lines().map(l => {
      const p = voices[l.speakerLabel] ?? AI_VOICES[0];
      return { text: l.text, speakerLabel: l.speakerLabel, gender: p.gender, pitch: p.pitch, variant: p.variant };
    });
  }

  // ── Position persistence ("Continue From Last Position") ──────────

  private storageKey(scriptId: string): string {
    return `gwf_listen_pos_${scriptId}`;
  }

  private persist(): void {
    const id = this.scriptId();
    if (!id) return;
    try {
      localStorage.setItem(this.storageKey(id), String(this.currentIndex()));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }

  private readSavedPosition(scriptId: string): number | null {
    try {
      const raw = localStorage.getItem(this.storageKey(scriptId));
      if (raw == null) return null;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  // ── Practice-preference persistence (global, not per script) ───────

  private static readonly PREF_PRACTICE = 'gwf_listen_practice';
  private static readonly PREF_COUNT = 'gwf_listen_repeat_count';
  private static readonly PREF_PAUSE = 'gwf_listen_pause_to_repeat';

  private loadPrefs(): void {
    try {
      this.practiceMode.set(localStorage.getItem(ScriptPlaybackService.PREF_PRACTICE) === '1');
      this.pauseToRepeat.set(localStorage.getItem(ScriptPlaybackService.PREF_PAUSE) === '1');
      const c = parseInt(localStorage.getItem(ScriptPlaybackService.PREF_COUNT) ?? '', 10);
      if (Number.isFinite(c)) this.repeatCount.set(Math.max(1, Math.min(3, c)));
    } catch {
      /* storage unavailable — keep defaults (off) */
    }
  }

  private persistPrefs(): void {
    try {
      localStorage.setItem(ScriptPlaybackService.PREF_PRACTICE, this.practiceMode() ? '1' : '0');
      localStorage.setItem(ScriptPlaybackService.PREF_PAUSE, this.pauseToRepeat() ? '1' : '0');
      localStorage.setItem(ScriptPlaybackService.PREF_COUNT, String(this.repeatCount()));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }
}

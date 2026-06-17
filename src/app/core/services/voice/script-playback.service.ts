import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { TtsService } from './tts.service';
import { ListenMedia, ListenMediaLine } from './listen-media.plugin';

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
export type VoiceGender = 'Male' | 'Female';

export interface RoleVoice {
  gender: VoiceGender;
  pitch: number;
}

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Distinct display colors per role (assigned by first-appearance order) for the lyrics view. */
const ROLE_COLORS = ['#7C3AED', '#0891B2', '#E07B39', '#2E7D32', '#DB2777', '#3D5A99'];

/** Audible per-role differentiation using only the on-device engine's gender + pitch knobs. */
const VOICE_PALETTE: RoleVoice[] = [
  { gender: 'Female', pitch: 1.0 },
  { gender: 'Male', pitch: 0.92 },
  { gender: 'Female', pitch: 1.18 },
  { gender: 'Male', pitch: 1.12 },
];

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
  /** Per-role voice assignment (label → gender/pitch); user-overridable via the Voices sheet. */
  readonly roleVoices = signal<Record<string, RoleVoice>>({});

  readonly currentLine = computed<PlaybackLine | null>(() => this.lines()[this.currentIndex()] ?? null);
  readonly hasContent = computed(() => this.lines().length > 0);

  /** Monotonic token: bumped on any stop so a pending speak()-loop knows it was superseded. */
  private playToken = 0;

  /** True on the Capacitor APK — routes playback through the native foreground media service. */
  private readonly native = Capacitor.isNativePlatform();
  /** Whether the native service has been started for the current script. */
  private nativeStarted = false;

  constructor() {
    // Mirror native playback state (incl. lock-screen / notification control actions) into signals.
    if (this.native) {
      void ListenMedia.addListener('stateChanged', s => {
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
    const roleVoices: Record<string, RoleVoice> = {};
    for (const l of lines) {
      if (!roles.includes(l.speakerLabel)) {
        roleVoices[l.speakerLabel] = VOICE_PALETTE[roles.length % VOICE_PALETTE.length];
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
    if (this.native) {
      if (!this.nativeStarted) { this.nativeStarted = true; void this.nativeStart(this.currentIndex()); }
      else void ListenMedia.play();
      return;
    }
    void this.runLoop(this.currentIndex());
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.native) { void ListenMedia.pause(); this.persist(); return; }
    this.playToken++;          // cancel any in-flight loop
    void this.tts.stop();
    this.persist();
  }

  next(): void {
    this.seekTo(Math.min(this.lines().length - 1, this.currentIndex() + 1));
  }

  prev(): void {
    this.seekTo(Math.max(0, this.currentIndex() - 1));
  }

  /** Jump playback to a tapped line. If playing, narration restarts at that line. */
  seekTo(index: number): void {
    if (!this.hasContent()) return;
    const clamped = Math.max(0, Math.min(this.lines().length - 1, index));
    this.currentIndex.set(clamped);
    this.persist();
    if (this.native) { void ListenMedia.seekTo({ index: clamped }); return; }
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
    if (this.native) { void ListenMedia.setRate({ rate }); return; }
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
    const mode = order[(order.indexOf(this.repeat()) + 1) % order.length];
    this.repeat.set(mode);
    if (this.native) void ListenMedia.setRepeat({ mode });
  }

  /** Stable display color for a role, by its first-appearance order. */
  roleColor(label: string): string {
    const i = this.roles().indexOf(label);
    return ROLE_COLORS[(i < 0 ? 0 : i) % ROLE_COLORS.length];
  }

  /** User override of a role's voice from the Voices sheet. */
  setRoleGender(label: string, gender: VoiceGender): void {
    const current = this.roleVoices()[label];
    if (!current || current.gender === gender) return;
    this.roleVoices.update(m => ({ ...m, [label]: { ...current, gender } }));
    if (this.native) {
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
      const voice = this.roleVoices()[line.speakerLabel] ?? VOICE_PALETTE[0];
      await this.tts.speak(line.text, { rate: this.rate(), gender: voice.gender, pitch: voice.pitch });

      // Superseded (paused / seeked / rate change) — abandon this loop silently.
      if (token !== this.playToken || !this.isPlaying()) return;

      if (this.repeat() === 'one') continue;          // re-speak same line
      i++;
      if (i >= total && this.repeat() === 'all') i = 0; // loop whole script
    }

    // Reached the natural end.
    if (token === this.playToken && this.isPlaying()) {
      this.isPlaying.set(false);
    }
  }

  private stopInternal(): void {
    this.isPlaying.set(false);
    if (this.native) { void ListenMedia.stop(); this.nativeStarted = false; return; }
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
      const v = voices[l.speakerLabel] ?? VOICE_PALETTE[0];
      return { text: l.text, speakerLabel: l.speakerLabel, gender: v.gender, pitch: v.pitch };
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
}

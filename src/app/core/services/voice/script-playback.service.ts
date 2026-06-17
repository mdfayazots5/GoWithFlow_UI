import { Injectable, computed, inject, signal } from '@angular/core';
import { TtsService } from './tts.service';

/**
 * Listen Script — on-device, LINE-LEVEL playback engine.
 *
 * The on-device TTS engine (`@capacitor-community/text-to-speech`) speaks a whole line and only
 * signals when that line finishes — it exposes NO word/sentence timing and NO mid-utterance seek.
 * So this engine operates at the LINE (utterance) granularity:
 *   - highlight = the line currently being spoken
 *   - "seek"    = jump to / prev / next LINE (no continuous scrubber exists)
 *   - "pause"   = stop the current line; resume re-speaks that line from its start
 *
 * OUTPUT only — it never opens the microphone, so it does not contend with the recognizer
 * (Voice constitution rule #1). Listen Script is a standalone, non-session experience.
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

export const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

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

  /**
   * Loads a script's utterances into the engine and restores the last-listened position for
   * this script ("Continue From Last Position"). Resets transport state.
   */
  load(scriptId: string, utterances: Array<{ speakerLabel: string; englishText: string; hintText?: string }>): void {
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
    this.lines.set(lines);
    this.roles.set(roles);
    this.roleVoices.set(roleVoices);
    this.isPlaying.set(false);
    this.repeat.set('off');

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
    void this.runLoop(this.currentIndex());
  }

  pause(): void {
    this.isPlaying.set(false);
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
    const wasPlaying = this.isPlaying();
    this.playToken++;          // cancel current line
    void this.tts.stop();
    this.currentIndex.set(clamped);
    this.persist();
    if (wasPlaying) {
      this.isPlaying.set(true);
      void this.runLoop(clamped);
    }
  }

  setRate(rate: number): void {
    this.rate.set(rate);
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
    this.repeat.set(order[(order.indexOf(this.repeat()) + 1) % order.length]);
  }

  /** User override of a role's voice from the Voices sheet. */
  setRoleGender(label: string, gender: VoiceGender): void {
    const current = this.roleVoices()[label];
    if (!current || current.gender === gender) return;
    this.roleVoices.update(m => ({ ...m, [label]: { ...current, gender } }));
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
    this.playToken++;
    void this.tts.stop();
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

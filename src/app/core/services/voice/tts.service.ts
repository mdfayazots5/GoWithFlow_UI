import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/**
 * On-device Text-to-Speech for the AI Voice Participant (Phase 17) and the Listen Script player.
 *
 * OUTPUT only — never touches the microphone, so it does not contend with the recognizer (Voice
 * constitution rule #1). AI turns and human turns are sequential.
 *
 * **Indian English by default.** Narration prefers `en-IN` (Indian accent, clearer for Telangana/AP
 * learners), falling back `en-IN → en-GB → en-US` to whatever the device actually has installed —
 * the same "use what's installed, never hard-fail" principle as the recognizer (rule #4). A persona's
 * `voiceVariant` selects the 1st/2nd/3rd same-gender voice in that language so the 6 named voices use
 * genuinely different device voices where available; `pitch` differentiates them otherwise.
 */
@Injectable({ providedIn: 'root' })
export class TtsService {
  /** Accent preference order. en-IN first for Indian English. */
  private static readonly LANG_CHAIN = ['en-IN', 'en-GB', 'en-US'];

  /** Cached best-available language for this device (resolved from installed voices once). */
  private resolvedLang: string | null = null;

  /** Whether the engine has been primed once this app session (see {@link warmUp}). */
  private warmedUp = false;

  /**
   * Google TTS voice **code → gender** (the `<code>` in `en-in-x-<code>-local`). On real devices the
   * plugin's `name` is just the locale label ("English India") — it carries NO gender — so gender must
   * be read from the voiceURI code. Verified by ear on-device (IV2201, 2026-06-19): en-IN ena/enc are
   * female, end/ene are male. Extend this map as other locales' codes are confirmed.
   */
  private static readonly VOICE_GENDER: Record<string, 'Male' | 'Female'> = {
    ena: 'Female', enc: 'Female', end: 'Male', ene: 'Male', // en-IN (Google)
  };

  /** Gender of a device voice: prefer the known voiceURI code map, then any gender word in the name. */
  private static voiceGender(v: { name?: string; voiceURI?: string }): 'Male' | 'Female' | null {
    const code = ((v.voiceURI ?? '').toLowerCase().match(/-x-([a-z]+)(?:-|$)/) ?? [])[1];
    if (code && TtsService.VOICE_GENDER[code]) return TtsService.VOICE_GENDER[code];
    const n = (v.name ?? '').toLowerCase();
    if (n.includes('female')) return 'Female';
    if (n.includes('male')) return 'Male';
    return null;
  }

  /**
   * Speaks `text` and resolves when playback completes. Failures never throw — narration must never
   * wedge the turn flow. `voiceVariant` picks the Nth same-gender voice in the resolved language.
   */
  async speak(
    text: string,
    opts: { rate?: number; lang?: string; gender?: 'Male' | 'Female'; pitch?: number; voiceVariant?: number } = {},
  ): Promise<void> {
    const clean = (text ?? '').trim();
    if (!clean) return;

    const lang = opts.lang ?? await this.resolveBestLang();
    const voiceIndex = await this.resolveVoiceIndex(lang, opts.gender, opts.voiceVariant);

    try {
      await TextToSpeech.speak({
        text: clean,
        lang,
        rate: opts.rate ?? 1.0,
        pitch: opts.pitch ?? 1.0,
        volume: 1.0,
        ...(voiceIndex != null ? { voice: voiceIndex } : {}),
      });
    } catch (err) {
      console.warn('[TTS] speak failed', err);
    }
  }

  async stop(): Promise<void> {
    try {
      await TextToSpeech.stop();
    } catch {
      /* no-op */
    }
  }

  /**
   * Primes the TTS engine once per session by speaking a near-silent priming utterance, so the FIRST
   * real line is not clipped (cold-start swallows the leading word — verified on the Listen player).
   * Idempotent and safe to call from a UI gesture (e.g. opening the Listen player). Failures are
   * swallowed — warming up is best-effort.
   */
  async warmUp(): Promise<void> {
    if (this.warmedUp) return;
    this.warmedUp = true;
    try {
      const lang = await this.resolveBestLang();
      await TextToSpeech.speak({ text: 'ready', lang, rate: 1.0, pitch: 1.0, volume: 0 });
    } catch {
      /* best-effort — engine may still warm from the attempt */
    }
  }

  /**
   * Picks the device's best available language from LANG_CHAIN (first one that actually has a voice
   * installed), so narration uses Indian English when present and degrades gracefully otherwise.
   * Cached after the first resolution.
   */
  private async resolveBestLang(): Promise<string> {
    if (this.resolvedLang) return this.resolvedLang;
    try {
      const voices = await this.getVoices();
      for (const lang of TtsService.LANG_CHAIN) {
        const prefix = lang.toLowerCase();
        if (voices.some(v => (v.lang ?? '').toLowerCase().replace('_', '-').startsWith(prefix))) {
          this.resolvedLang = lang;   // cache only a CONFIRMED match from a non-empty voice list
          return lang;
        }
      }
      // We have voices but none in the chain — pick the first English voice, else its own locale.
      if (voices.length) {
        const en = voices.find(v => (v.lang ?? '').toLowerCase().startsWith('en'));
        const fallback = (en?.lang ?? voices[0].lang ?? TtsService.LANG_CHAIN[0]).replace('_', '-');
        this.resolvedLang = fallback;
        return fallback;
      }
    } catch {
      /* fall through to default; do NOT cache so a later call can resolve once voices load */
    }
    // No voices available yet (web populates asynchronously) — return a default WITHOUT caching,
    // so the next speak() re-resolves once speechSynthesis has loaded its voice list.
    return TtsService.LANG_CHAIN[0];
  }

  /**
   * Returns installed voices. On the web, `speechSynthesis.getVoices()` is populated asynchronously
   * and is often EMPTY on the first call — which previously caused desktop to lock onto `en-IN`
   * (no audio). Retry briefly so the real list is used. Returns `[]` if none ever load.
   */
  private async getVoices(): Promise<Array<{ lang?: string; name?: string; voiceURI?: string }>> {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const { voices } = await TextToSpeech.getSupportedVoices();
        if (voices?.length) return voices;
      } catch {
        return [];
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return [];
  }

  /**
   * Resolve a concrete voice index for the given language + gender + variant. Keeps the persona's
   * accent by preferring voices of the **exact resolved locale** (e.g. `en-IN`), then same language,
   * then any. Gender is read from the voiceURI code (see {@link voiceGender}) because device voice
   * names carry no gender. Among the same-gender voices, picks the variant-th (clamped). Returns null
   * when no gender match is found, so the plugin falls back to its default for the language.
   */
  private async resolveVoiceIndex(
    lang: string,
    gender?: 'Male' | 'Female',
    variant = 0,
  ): Promise<number | null> {
    if (!gender) return null;
    try {
      const voices = await this.getVoices();
      if (!voices.length) return null;

      const want = lang.toLowerCase().replace('_', '-');   // e.g. 'en-in'
      const two = want.slice(0, 2);
      const norm = (v: { lang?: string }) => (v.lang ?? '').toLowerCase().replace('_', '-');

      // Prefer the exact locale (keep the Indian accent), then same language, then everything.
      let pool = voices.filter(v => norm(v) === want);
      if (!pool.length) pool = voices.filter(v => norm(v).startsWith(two));
      if (!pool.length) pool = voices;

      const sameGender = pool.filter(v => TtsService.voiceGender(v) === gender);
      if (!sameGender.length) return null;

      // Pick the variant-th same-gender voice so different personas use different device voices.
      const chosen = sameGender[Math.max(0, variant) % sameGender.length];
      return voices.indexOf(chosen);
    } catch {
      return null;
    }
  }
}

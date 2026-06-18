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

  /** TEMP DIAGNOSTIC (2026-06-18, voice gender fix) — dump device voice list once. REMOVE after device map confirmed. */
  private static _voicesDumped = false;
  private async dumpVoicesOnce(): Promise<void> {
    if (TtsService._voicesDumped) return;
    TtsService._voicesDumped = true;
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      const en = (voices ?? []).filter(v => (v.lang ?? '').toLowerCase().startsWith('en'));
      console.log('[TTS-DIAG] total voices=', voices?.length, ' en voices=', en.length);
      en.forEach(v => console.log(`[TTS-DIAG] name="${v.name}" lang="${v.lang}" uri="${(v as any).voiceURI ?? ''}"`));
    } catch (err) {
      console.log('[TTS-DIAG] getSupportedVoices failed', err);
    }
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

    await this.dumpVoicesOnce(); // TEMP DIAGNOSTIC — remove after device voice map confirmed
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
   * Picks the device's best available language from LANG_CHAIN (first one that actually has a voice
   * installed), so narration uses Indian English when present and degrades gracefully otherwise.
   * Cached after the first resolution.
   */
  private async resolveBestLang(): Promise<string> {
    if (this.resolvedLang) return this.resolvedLang;
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      for (const lang of TtsService.LANG_CHAIN) {
        const prefix = lang.toLowerCase();
        if (voices?.some(v => (v.lang ?? '').toLowerCase().replace('_', '-').startsWith(prefix))) {
          this.resolvedLang = lang;
          return lang;
        }
      }
    } catch {
      /* fall through to default */
    }
    this.resolvedLang = TtsService.LANG_CHAIN[0];
    return this.resolvedLang;
  }

  /**
   * Resolve a concrete voice index for the given language + gender + variant. Among the same-gender
   * voices in that language, pick the variant-th (clamped). Android voice names are inconsistent
   * (e.g. "en-in-x-ene-local"), so gender is matched by substring; if nothing matches we return null
   * and the plugin uses its default for the language.
   */
  private async resolveVoiceIndex(
    lang: string,
    gender?: 'Male' | 'Female',
    variant = 0,
  ): Promise<number | null> {
    if (!gender) return null;
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      if (!voices?.length) return null;

      const prefix = lang.slice(0, 2).toLowerCase();
      const inLang = voices.filter(v => (v.lang ?? '').toLowerCase().startsWith(prefix));
      const pool = inLang.length ? inLang : voices;

      // "female" contains "male" — match female explicitly; male must NOT also contain "female".
      const matchesGender = (name: string): boolean => {
        const n = name.toLowerCase();
        return gender === 'Female' ? n.includes('female') : n.includes('male') && !n.includes('female');
      };

      const sameGender = pool.filter(v => matchesGender(v.name ?? ''));
      if (!sameGender.length) return null;

      // Pick the variant-th same-gender voice so different personas use different device voices.
      const chosen = sameGender[Math.max(0, variant) % sameGender.length];
      return voices.indexOf(chosen);
    } catch {
      return null;
    }
  }
}

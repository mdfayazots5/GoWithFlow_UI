import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/**
 * Phase 17 — on-device Text-to-Speech for the AI Voice Participant. Wraps
 * `@capacitor-community/text-to-speech` (native Android TTS on the APK, Web Speech API on web).
 *
 * This is OUTPUT only — it never touches the microphone, so it does not contend with the
 * recognizer (the Voice constitution's #1 rule). AI turns and human turns are sequential; the
 * recognizer is idle during an AI turn because the human is a listener then.
 */
@Injectable({ providedIn: 'root' })
export class TtsService {
  /**
   * Speaks `text` and resolves when playback completes (the plugin's speak() promise resolves on
   * finish). Failures never throw to the caller — narration must never wedge the turn flow.
   */
  async speak(text: string, opts: { rate?: number; lang?: string; gender?: 'Male' | 'Female'; pitch?: number } = {}): Promise<void> {
    const clean = (text ?? '').trim();
    if (!clean) return;

    const lang = opts.lang ?? 'en-US';
    const voiceIndex = await this.resolveVoiceIndex(lang, opts.gender);

    try {
      await TextToSpeech.speak({
        text: clean,
        lang,
        rate: opts.rate ?? 1.0,
        pitch: opts.pitch ?? 1.0,
        volume: 1.0,
        ...(voiceIndex != null ? { voice: voiceIndex } : {})
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
   * Best-effort gender → voice index. Android voice names are inconsistent across devices
   * (e.g. "en-us-x-sfg#female_1-local"), so we match on the name containing male/female within
   * the requested language; if nothing matches we return null and the plugin uses its default.
   */
  private async resolveVoiceIndex(lang: string, gender?: 'Male' | 'Female'): Promise<number | null> {
    if (!gender) return null;
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      if (!voices?.length) return null;

      const prefix = lang.slice(0, 2).toLowerCase();
      const inLang = voices.filter(v => (v.lang ?? '').toLowerCase().startsWith(prefix));
      const pool = inLang.length ? inLang : voices;

      // NOTE: "female" contains the substring "male", so a naive `name.includes('male')`
      // matches female voices too — selecting Male then spoke in a female voice. Match
      // female explicitly, and require male names to NOT also contain "female".
      const matchesGender = (name: string): boolean => {
        const n = name.toLowerCase();
        return gender === 'Female' ? n.includes('female') : n.includes('male') && !n.includes('female');
      };

      const match = pool.find(v => matchesGender(v.name ?? ''));
      if (!match) return null;

      return voices.indexOf(match);
    } catch {
      return null;
    }
  }
}

/**
 * Shared Indian-English voice personas — the single source of truth for the 6 named AI voices used
 * by BOTH the AI Voice Participant (live session) and the Listen Script player.
 *
 * Free / on-device only: these map to the device TTS engine's Indian English (`en-IN`) voices. Where
 * a device has several distinct en-IN voices of a gender, `variant` selects the 1st/2nd/3rd so the
 * personas use genuinely different voices; where it has fewer, `pitch` shapes them so all 6 still
 * sound clearly different. Narration runs at a slower default rate for clarity (Telangana/AP learners
 * struggle with fast US English). Accent fallback chain is en-IN → en-GB → en-US (see TtsService).
 *
 * Truly distinct studio/neural voices on every device would need a PAID cloud TTS — out of scope.
 */

export type VoiceGender = 'Male' | 'Female';

export interface VoicePersona {
  /** Stable key — stored in tblSession.AiVoiceName and used everywhere. Never display this. */
  id: string;
  /** Display name shown in pickers. */
  name: string;
  gender: VoiceGender;
  /** Which same-gender en-IN device voice to prefer (0,1,2). Falls back to pitch shaping if absent. */
  variant: number;
  /** Persona pitch signature (the primary free differentiator). */
  pitch: number;
  /** One-line style description for the picker. */
  blurb: string;
}

/** The 6 Indian voices. Order is the display order. ids are permanent — renaming `name` is safe. */
export const AI_VOICES: readonly VoicePersona[] = [
  { id: 'aarav',  name: 'Aarav',  gender: 'Male',   variant: 0, pitch: 1.0,  blurb: 'Calm & steady' },
  { id: 'ananya', name: 'Ananya', gender: 'Female', variant: 0, pitch: 1.05, blurb: 'Warm & friendly' },
  { id: 'vikram', name: 'Vikram', gender: 'Male',   variant: 1, pitch: 0.9,  blurb: 'Deep, slow & clear' },
  { id: 'meera',  name: 'Meera',  gender: 'Female', variant: 1, pitch: 1.18, blurb: 'Bright & articulate' },
  { id: 'rohan',  name: 'Rohan',  gender: 'Male',   variant: 2, pitch: 1.08, blurb: 'Youthful & lively' },
  { id: 'priya',  name: 'Priya',  gender: 'Female', variant: 2, pitch: 0.96, blurb: 'Gentle & very clear' },
] as const;

/** Default persona when none is chosen / an old value is missing. */
export const DEFAULT_VOICE_ID = 'aarav';

/** Resolve a persona by id, tolerating null/legacy values. Also maps legacy 'Male'/'Female'. */
export function getVoicePersona(id?: string | null): VoicePersona {
  if (id) {
    const byId = AI_VOICES.find(v => v.id === id.toLowerCase());
    if (byId) return byId;
    // Legacy AiVoiceGender values ('Male'/'Female') → first persona of that gender.
    const byGender = AI_VOICES.find(v => v.gender.toLowerCase() === id.toLowerCase());
    if (byGender) return byGender;
  }
  return AI_VOICES.find(v => v.id === DEFAULT_VOICE_ID) ?? AI_VOICES[0];
}

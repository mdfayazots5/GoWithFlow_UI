import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranscriptNormalizer {

  normalize(text: string): string {
    let result = text;

    // Step 1: Lowercase
    result = result.toLowerCase();

    // Step 2: Expand common contractions (spoken vs written)
    result = this.expandContractions(result);

    // Step 3: Remove punctuation (Speech API sometimes adds commas/periods)
    result = result.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '');

    // Step 4: Normalize whitespace
    result = result.replace(/\s+/g, ' ').trim();

    // Step 5: Remove filler words (for scoring purposes — not for display)
    result = this.removeFillerWords(result);

    return result;
  }

  // For DISPLAY only — keeps contractions, proper casing
  normalizeForDisplay(text: string): string {
    return text.trim();
  }

  private expandContractions(text: string): string {
    // ── No-apostrophe forms (Speech API often transcribes without apostrophe)
    // These MUST use \b word boundaries — plain replace would corrupt words
    // that contain the sequence (e.g. "dont" inside "londontower").
    // "were" intentionally excluded — it's an independent past-tense verb.
    const noApostrophe: Record<string, string> = {
      "dont":    'do not',
      "cant":    'cannot',
      "wont":    'will not',
      "isnt":    'is not',
      "arent":   'are not',
      "wasnt":   'was not',
      "werent":  'were not',
      "havent":  'have not',
      "hasnt":   'has not',
      "hadnt":   'had not',
      "wouldnt": 'would not',
      "couldnt": 'could not',
      "shouldnt": 'should not',
      "mustnt":  'must not',
      "didnt":   'did not',
      "doesnt":  'does not',
      "ive":     'i have',
      "youve":   'you have',
      "hes":     'he is',
      "shes":    'she is',
      "theyre":  'they are',
      "theyve":  'they have',
      "im":      'i am',
    };

    // ── Standard apostrophe contractions (curly + straight + backtick apostrophe)
    const withApostrophe: Record<string, string> = {
      "i'm": 'i am',       "i've": 'i have',    "i'll": 'i will',    "i'd": 'i would',
      "you're": 'you are', "you've": 'you have', "you'll": 'you will', "you'd": 'you would',
      "he's": 'he is',     "he'll": 'he will',
      "she's": 'she is',   "she'll": 'she will',
      "it's": 'it is',
      "we're": 'we are',   "we've": 'we have',  "we'll": 'we will',
      "they're": 'they are', "they've": 'they have', "they'll": 'they will',
      "don't": 'do not',   "doesn't": 'does not', "didn't": 'did not',
      "isn't": 'is not',   "aren't": 'are not',
      "wasn't": 'was not', "weren't": 'were not',
      "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
      "won't": 'will not', "wouldn't": 'would not',
      "can't": 'cannot',   "couldn't": 'could not', "shouldn't": 'should not',
      "mustn't": 'must not',
      "that's": 'that is', "there's": 'there is',
      "what's": 'what is', "who's": 'who is',
    };

    let result = text;

    // Apply no-apostrophe expansions with word boundaries
    for (const [token, expansion] of Object.entries(noApostrophe)) {
      result = result.replace(new RegExp(`\\b${token}\\b`, 'g'), expansion);
    }

    // Apply apostrophe expansions (handles curly/straight/backtick variants)
    for (const [contraction, expansion] of Object.entries(withApostrophe)) {
      result = result.replace(new RegExp(contraction.replace(/'/g, "[''`']"), 'g'), expansion);
    }

    return result;
  }

  private removeFillerWords(text: string): string {
    const fillers = ['um', 'uh', 'er', 'hmm', 'hm'];
    let result = text;
    for (const filler of fillers) {
      result = result.replace(new RegExp(`\\b${filler}\\b`, 'g'), '');
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * Detect filler phrases in raw transcript text.
   * Returns a flat list of all detected fillers/phrases (may include duplicates).
   * Used by voice engine to populate HesitationWords alongside single-word hesitations.
   */
  detectFillerPhrases(rawText: string): string[] {
    const lower = rawText.toLowerCase();
    const found: string[] = [];

    // Single-word hesitations — all occurrences count
    const singleWordFillers = ['um', 'uh', 'er', 'err', 'hmm', 'hm'];
    for (const filler of singleWordFillers) {
      const matches = lower.match(new RegExp(`\\b${filler}\\b`, 'g'));
      if (matches) found.push(...matches);
    }

    // Multi-word filler phrases — each occurrence counts
    const multiWordFillers = [
      'you know',
      'i mean',
      'basically',
      'kind of',
      'sort of',
      'you see',
      'to be honest',
      'at the end of the day',
    ];
    for (const phrase of multiWordFillers) {
      const escaped = phrase.replace(/\s+/g, '\\s+');
      const matches = lower.match(new RegExp(escaped, 'g'));
      if (matches) found.push(...matches.map(() => phrase));
    }

    // Frequency-gated: "like" and "actually" only when used 3+ times in a turn
    const frequencyGated = ['like', 'actually'];
    for (const word of frequencyGated) {
      const matches = lower.match(new RegExp(`\\b${word}\\b`, 'g'));
      const count = matches?.length ?? 0;
      if (count >= 3) {
        // Flag all occurrences above the threshold (count - 2 are considered fillers)
        for (let i = 0; i < count - 2; i++) found.push(word);
      }
    }

    return found;
  }
}

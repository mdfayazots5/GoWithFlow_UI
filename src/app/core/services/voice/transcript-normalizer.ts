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

    // Step 5: Canonicalize numbers to digits so word/digit forms always match.
    // The recognizer often emits digits ("305", "25") while scripts may use words
    // ("three oh five", "twenty five") or vice versa. Applied to BOTH the spoken and
    // expected sides, so the comparison no longer depends on which form was used.
    result = this.numbersToDigits(result);

    // Step 6: Remove filler words (for scoring purposes — not for display)
    result = this.removeFillerWords(result);

    return result;
  }

  // ─── NUMBER NORMALIZATION ─────────────────────────────────────────────────────
  // Converts spoken number-words into digit strings on a token stream.
  // Handles two reading styles:
  //   • Digit sequence — "three oh five" → "305", "double five" → "55" (room/phone numbers)
  //   • Cardinal value — "twenty five" → "25", "three hundred five" → "305"
  private readonly numberWord: Record<string, number> = {
    zero: 0, oh: 0, o: 0, nought: 0,
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  private readonly scaleWord: Record<string, number> = {
    hundred: 100, thousand: 1000, lakh: 100000, million: 1000000, crore: 10000000, billion: 1000000000,
  };
  private readonly repeatWord: Record<string, number> = { double: 2, triple: 3 };

  private numbersToDigits(text: string): string {
    const tokens = text.split(' ');
    const out: string[] = [];
    const isNum = (w: string) => w in this.numberWord || w in this.scaleWord;
    let i = 0;

    while (i < tokens.length) {
      const w = tokens[i];

      // "double five" → "55", "triple two" → "222"
      if (w in this.repeatWord && i + 1 < tokens.length
          && tokens[i + 1] in this.numberWord && this.numberWord[tokens[i + 1]] < 10) {
        out.push(String(this.numberWord[tokens[i + 1]]).repeat(this.repeatWord[w]));
        i += 2;
        continue;
      }

      if (!isNum(w)) { out.push(w); i++; continue; }

      // Collect a contiguous run of number words ("and" allowed between them).
      const run: string[] = [];
      while (i < tokens.length
             && (isNum(tokens[i])
                 || (tokens[i] === 'and' && run.length > 0 && i + 1 < tokens.length && isNum(tokens[i + 1])))) {
        if (tokens[i] !== 'and') run.push(tokens[i]);
        i++;
      }
      out.push(this.convertNumberRun(run));
    }

    return out.join(' ');
  }

  private convertNumberRun(run: string[]): string {
    // Pure digit-sequence (only units 0–9 / "oh") → concatenate: "three oh five" → "305".
    const hasTensOrScale = run.some(w => w in this.scaleWord || (w in this.numberWord && this.numberWord[w] >= 10));
    if (!hasTensOrScale) {
      return run.map(w => String(this.numberWord[w])).join('');
    }

    // Cardinal value: "three hundred five" → 305, "twenty five" → 25.
    let total = 0;
    let current = 0;
    for (const w of run) {
      if (w in this.scaleWord) {
        const s = this.scaleWord[w];
        if (s === 100) current = (current || 1) * 100;
        else { total += (current || 1) * s; current = 0; }
      } else {
        current += this.numberWord[w];
      }
    }
    return String(total + current);
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

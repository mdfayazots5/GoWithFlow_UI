import { Injectable } from '@angular/core';
import { WordResult } from './voice-recognition.engine';

export interface ScoreResult {
  fluencyScore: number;
  overallScore: number;
  wordResults: WordResult[];
  matchedCount: number;
  totalExpected: number;
}

@Injectable({ providedIn: 'root' })
export class PronunciationScorer {

  // Common Indian English pronunciation mappings — single-token only.
  // Multi-word keys are NEVER matched (scoring is token-by-token).
  // Contractions without apostrophes are handled upstream by TranscriptNormalizer.
  // Only accent-substitution tokens belong here.
  private pronunciationMap: Record<string, string> = {
    // V/W confusion (very common in Telugu/Kannada speakers)
    'wery': 'very',   'wideo': 'video',   'wehicle': 'vehicle',
    'wersion': 'version', 'wiolent': 'violent',
    // TH sounds → D/T substitution
    'dis': 'this', 'dat': 'that', 'dey': 'they', 'dem': 'them',
    'tink': 'think', 'tings': 'things',
  };

  score(
    spokenNormalized: string,
    expectedNormalized: string,
    apiConfidence: number
  ): ScoreResult {
    const spokenWords = this.tokenize(spokenNormalized);
    const expectedWords = this.tokenize(expectedNormalized);

    if (expectedWords.length === 0) {
      return { fluencyScore: 0, overallScore: 0, wordResults: [], matchedCount: 0, totalExpected: 0 };
    }

    // Apply pronunciation map to spoken words
    const mappedSpoken = spokenWords.map(w => this.pronunciationMap[w] || w);

    // Align words using dynamic programming (like Duolingo)
    const wordResults = this.alignAndScore(mappedSpoken, expectedWords);

    const matchedCount = wordResults.filter(w => w.matched).length;
    const totalExpected = expectedWords.length;

    // Word accuracy: weighted by confidence
    const wordAccuracy = totalExpected > 0 ? matchedCount / totalExpected : 0;
    const avgWordScore = wordResults.length > 0
      ? wordResults.reduce((s, w) => s + w.score, 0) / wordResults.length
      : 0;

    // Fluency: weighted combination
    const fluencyScore = Math.round(
      (wordAccuracy * 0.6 + avgWordScore / 100 * 0.4) * 100
    );

    // Overall: fluency weighted with API confidence
    const overallScore = Math.round(
      fluencyScore * 0.75 + (apiConfidence * 100) * 0.25
    );

    return {
      fluencyScore: Math.min(100, Math.max(0, fluencyScore)),
      overallScore: Math.min(100, Math.max(0, overallScore)),
      wordResults,
      matchedCount,
      totalExpected
    };
  }

  // ─── WORD ALIGNMENT ─────────────────────────────────────────────────────────
  private alignAndScore(spoken: string[], expected: string[]): WordResult[] {
    const results: WordResult[] = [];
    let spokenIdx = 0;
    let expectedIdx = 0;

    while (expectedIdx < expected.length) {
      const exp = expected[expectedIdx];

      if (spokenIdx >= spoken.length) {
        // Out of spoken words — remaining expected are missing
        results.push({
          word: '',
          expected: exp,
          matched: false,
          score: 0,
          isHesitation: false,
          isExtra: false,
          isMissing: true
        });
        expectedIdx++;
        continue;
      }

      const spk = spoken[spokenIdx];
      const similarity = this.wordSimilarity(spk, exp);

      if (similarity >= 0.8) {
        // Direct or near match
        results.push({
          word: spk,
          expected: exp,
          matched: true,
          score: Math.round(similarity * 100),
          isHesitation: false,
          isExtra: false,
          isMissing: false
        });
        spokenIdx++;
        expectedIdx++;
      } else {
        // Look ahead for INSERTION: spoken has an extra word the user shouldn't have said
        const nextSpkSimilarity = spokenIdx + 1 < spoken.length
          ? this.wordSimilarity(spoken[spokenIdx + 1], exp)
          : 0;

        // Look ahead for DELETION: an expected word was skipped entirely.
        // Check whether the CURRENT spoken word matches the NEXT expected word.
        // Without this, a single skipped word cascades: every subsequent word
        // compares against the wrong expected slot and scores near-zero.
        const nextExpSimilarity = expectedIdx + 1 < expected.length
          ? this.wordSimilarity(spk, expected[expectedIdx + 1])
          : 0;

        if (nextSpkSimilarity > similarity && nextSpkSimilarity >= 0.7) {
          // INSERTION — current spoken word is extra, skip it
          results.push({
            word: spk,
            expected: '',
            matched: false,
            score: 0,
            isHesitation: false,
            isExtra: true,
            isMissing: false
          });
          spokenIdx++;
        } else if (nextExpSimilarity > similarity && nextExpSimilarity >= 0.7) {
          // DELETION — current expected word was skipped, mark it missing
          // Do NOT advance spokenIdx — re-compare current spoken word against next expected
          results.push({
            word: '',
            expected: exp,
            matched: false,
            score: 0,
            isHesitation: false,
            isExtra: false,
            isMissing: true
          });
          expectedIdx++;
        } else {
          // SUBSTITUTION — partial match or wrong word
          results.push({
            word: spk,
            expected: exp,
            matched: similarity >= 0.6,
            score: Math.round(similarity * 100),
            isHesitation: false,
            isExtra: false,
            isMissing: false
          });
          spokenIdx++;
          expectedIdx++;
        }
      }
    }

    // Any remaining spoken words are extras
    while (spokenIdx < spoken.length) {
      results.push({
        word: spoken[spokenIdx],
        expected: '',
        matched: false,
        score: 0,
        isHesitation: false,
        isExtra: true,
        isMissing: false
      });
      spokenIdx++;
    }

    return results;
  }

  // ─── WORD SIMILARITY: Levenshtein + Phonetic Blend ──────────────────────────
  wordSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;

    // Levenshtein distance normalized
    const maxLen = Math.max(a.length, b.length);
    const editDist = this.levenshtein(a, b);
    const editSim = 1 - editDist / maxLen;

    // Phonetic similarity (Soundex-based)
    const phoneticSim = this.soundexMatch(a, b) ? 0.85 : 0;

    // Take the best of the two
    return Math.max(editSim, phoneticSim);
  }

  // ─── LEVENSHTEIN DISTANCE ────────────────────────────────────────────────────
  private levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  // ─── SOUNDEX (simplified for English phonetics) ──────────────────────────────
  private soundex(s: string): string {
    const map: Record<string, string> = {
      b: '1', f: '1', p: '1', v: '1',
      c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
      d: '3', t: '3',
      l: '4',
      m: '5', n: '5',
      r: '6'
    };
    const upper = s.toUpperCase();
    let code = upper[0];
    let prev = map[upper[0].toLowerCase()] || '0';
    for (let i = 1; i < upper.length && code.length < 4; i++) {
      const c = upper[i].toLowerCase();
      const mapped = map[c] || '0';
      if (mapped !== '0' && mapped !== prev) {
        code += mapped;
      }
      prev = mapped;
    }
    return code.padEnd(4, '0');
  }

  private soundexMatch(a: string, b: string): boolean {
    return this.soundex(a) === this.soundex(b);
  }

  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(w => w.length > 0);
  }
}

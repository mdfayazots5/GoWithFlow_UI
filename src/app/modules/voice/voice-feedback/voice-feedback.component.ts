import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceSessionResult, WordResult } from '../../../core/services/voice/voice-recognition.engine';

export interface FeedbackBand {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-voice-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-feedback.component.html',
  styleUrls: ['./voice-feedback.component.scss']
})
export class VoiceFeedbackComponent implements OnChanges {

  @Input() result: VoiceSessionResult | null = null;

  overallBand: FeedbackBand | null = null;
  wordColorMap: { word: string; css: string; tooltip: string; isMissing: boolean }[] = [];
  showDetailedBreakdown = false;

  private bands: { min: number; max: number; data: FeedbackBand }[] = [
    { min: 90, max: 100, data: { label: 'Excellent!',    emoji: '🌟', color: '#1B5E20', bg: '#E8F5E9' } },
    { min: 75, max: 89,  data: { label: 'Great job!',    emoji: '✅', color: '#2E7D32', bg: '#F1F8E9' } },
    { min: 60, max: 74,  data: { label: 'Good try!',     emoji: '👍', color: '#E65100', bg: '#FFF3E0' } },
    { min: 40, max: 59,  data: { label: 'Keep going!',   emoji: '💪', color: '#BF360C', bg: '#FBE9E7' } },
    { min: 0,  max: 39,  data: { label: 'Try again',     emoji: '🔄', color: '#B71C1C', bg: '#FFEBEE' } },
  ];

  ngOnChanges(): void {
    if (!this.result) return;
    this.overallBand = this.getBand(this.result.overallScore);
    this.buildWordColorMap();
  }

  private getBand(score: number): FeedbackBand {
    const match = this.bands.find(b => score >= b.min && score <= b.max);
    return match?.data ?? this.bands[this.bands.length - 1].data;
  }

  private buildWordColorMap(): void {
    if (!this.result) return;

    this.wordColorMap = this.result.wordResults.map(wr => {
      if (wr.isMissing) {
        return {
          word: wr.expected,
          css: 'word-missing',
          tooltip: `Missing word: "${wr.expected}"`,
          isMissing: true
        };
      }
      if (wr.isExtra) {
        return {
          word: wr.word,
          css: 'word-extra',
          tooltip: 'Extra word — not in the expected sentence',
          isMissing: false
        };
      }
      if (wr.matched && wr.score >= 80) {
        return { word: wr.word, css: 'word-correct', tooltip: 'Correct!', isMissing: false };
      }
      if (wr.score >= 50) {
        return {
          word: wr.word,
          css: 'word-partial',
          tooltip: `Close — expected "${wr.expected}"`,
          isMissing: false
        };
      }
      return {
        word: wr.word,
        css: 'word-wrong',
        tooltip: `Should be "${wr.expected}"`,
        isMissing: false
      };
    });
  }

  get speedLabel(): string {
    if (!this.result) return '';
    const wpm = this.result.speakingSpeedWpm;
    if (wpm === 0) return '— Not detected';   // capture failed — not a speed judgment
    if (wpm < 70)  return '🐢 Too slow';
    if (wpm < 100) return '✅ Good pace';
    if (wpm < 140) return '👏 Natural speed';
    return '⚡ Too fast';
  }
}

// File: src/app/core/models/mistake.model.ts

export type MistakeType = 'GRAMMAR' | 'PRONUNCIATION' | 'HESITATION' | 'SKIP' | 'INCOMPLETE' | 'SPEED';
export type RepracticeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Mistake {
  id: string;
  userId: string;
  type: MistakeType;
  spokenText: string;
  expectedText: string;
  sessionId: string;
  sessionName: string;
  createdDate: string;
  occurredCount: number;
  practicedCount: number;
  isResolved: boolean;
  correctionNote?: string;
}

export interface MistakeSummary {
  totalMistakes: number;
  resolvedMistakes: number;
  pendingMistakes: number;
  improvementPercent: number;
}

export interface GrammarProgress {
  grammarTag: string;
  totalMistakes: number;
  resolvedMistakes: number;
  improvementPercent: number;
  progressBarValue: number;
}

export interface RepracticeSession {
  id: string;
  userId: string;
  status: RepracticeStatus;
  startedDate: string;
  endedDate?: string;
  utterances: RepracticeUtterance[];
  overallImprovement?: number;
}

export interface RepracticeUtterance {
  id: string;
  englishText: string;
  hintText: string;
  mistakeType: string;
  mistakeDetail: string;
  correctionNote: string;
  attemptCount: number;
  bestScore: number;
  lastScore: number;
  isResolved: boolean;
}

export interface RepracticeAttempt {
  timestamp: string;
  spokenText: string;
  score: number;
  isPassed: boolean;
}

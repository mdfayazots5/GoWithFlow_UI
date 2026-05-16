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
  pendingPractice: number;
  improvementPercent: number;
}

export interface GrammarProgress {
  tag: string;
  errorCount: number;
  improvementPercent: number;
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
  mistakeId: string;
  originalSpoken: string;
  correctText: string;
  correctionNote: string;
  hintText: string;
  attempts: RepracticeAttempt[];
  isResolved: boolean;
}

export interface RepracticeAttempt {
  timestamp: string;
  spokenText: string;
  score: number;
  isPassed: boolean;
}

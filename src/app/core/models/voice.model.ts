// File: src/app/core/models/voice.model.ts

export interface VoiceAnalysis {
  transcript: string;
  expectedText: string;
  fluencyScore: number;
  confidenceScore: number;
  speedWpm: number;
  hesitations: string[];
  mistakes: VoiceMistake[];
  isPassed: boolean;
}

export interface VoiceMistake {
  type: 'GRAMMAR' | 'PRONUNCIATION' | 'HESITATION' | 'SKIP' | 'INCOMPLETE' | 'SPEED';
  word?: string;
  expected?: string;
  actual?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TurnState {
  sessionId: string;
  turnIndex: number;
  totalTurns: number;
  activeMemberId: string | number;
  activeMemberName: string;
  activeSlotIndex: number;
  utterance: UtteranceData;
  reReadAllowed: boolean;
  reReadCount: number;
  maxReReads: number;
  nextUtterance?: string;
}

export interface UtteranceData {
  utteranceId: number;
  sequenceId: number;
  speakerLabel: string;
  englishText: string;
  hintText: string;
  grammarTag: string;
  contextTag: string;
  focusWord?: string;
  pronunciationNote?: string;
}

export interface VoiceAnalysisResponse {
  id: string;
  score: number;
  isAutoSavedAsMistake: boolean;
}

// ── Session Completion ────────────────────────────────────────────────────────

export interface MemberScore {
  userId: number;
  fullName: string;
  fluencyScore: number;
  confidenceScore: number;
  mistakeCount: number;
  listenerRating: number;
}

export interface SessionSummary {
  memberScores: MemberScore[];
  totalTurns: number;
  scriptTitle: string;
  grammarFocusTag: string;
  totalMistakesAllMembers: number;
}

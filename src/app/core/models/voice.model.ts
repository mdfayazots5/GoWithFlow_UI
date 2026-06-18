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
  activeMemberAvatarUrl?: string | null;
  activeSlotIndex: number;
  utterance: UtteranceData;
  reReadAllowed: boolean;
  reReadCount: number;
  maxReReads: number;
  nextUtterance?: string;
  /** True when the active speaker is a facilitator (Interviewer, Tutor, Coach). No scoring on these turns. */
  isFacilitatorTurn: boolean;
  /** Phase 17 — true when the active slot is the AI Voice Participant. Client narrates via TTS then advances. */
  isAi?: boolean;
  /** Phase 2 (Q&A) — true for Question & Answer sessions: hide the question/model-answer text, grammar tag
   *  and hint on BOTH the AI Interviewer turn and the candidate's answer turn (candidate only hears + speaks). */
  hideScriptText?: boolean;
  /** Phase 17 — session AI config (present only on AI sessions). */
  aiVoiceGender?: 'Male' | 'Female' | null;
  /** Named Indian voice persona id (e.g. "aarav") chosen for this session's AI. */
  aiVoiceName?: string | null;
  aiSpeechRate?: number | null;
  aiQuestionDelaySec?: number | null;
  /** Q&A "Show Hard Words" practice aid — true when the session was created with the flag on. */
  showHardWords?: boolean;
  /** Q&A "Show key words while answering" — true when the question's key words stay visible on the
   *  candidate's own answer turn. Independent of showHardWords. */
  showHardWordsInAnswer?: boolean;
  /** Q&A "Key words to remember" — populated by the backend on the Interviewer/listen turn (when
   *  showHardWords is on) and on the candidate's answer turn (when showHardWordsInAnswer is on, carrying
   *  the question's words). Empty otherwise. */
  hardWords?: HardWord[];
}

/** A single Q&A "Key word to remember" surfaced on the Interviewer/listen turn. */
export interface HardWord {
  word: string;
  meaning?: string | null;
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
  /** Q&A — raw 'word:meaning | …' hard-words string; only sent when the words are being shown. */
  hardWords?: string | null;
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
  avatarUrl?: string | null;
  fluencyScore: number;
  confidenceScore: number;
  mistakeCount: number;
  listenerRating: number;
  /** True when this member played a facilitator role (Interviewer, Tutor, Coach). Excluded from performance scoreboard. */
  isFacilitator: boolean;
  /** Phase 17 — true for the AI Voice Participant. Excluded from the scored leaderboard; shown as an AI partner. */
  isAi?: boolean;
}

export interface VocabularySummary {
  wordsPracticedThisSession: number;
  totalWordsInBank: number;
  wordsDueForReview: number;
  wordsPracticed: string[];
}

export interface SessionSummary {
  memberScores: MemberScore[];
  totalTurns: number;
  scriptTitle: string;
  grammarFocusTag: string;
  totalMistakesAllMembers: number;
  /** Populated for Vocabulary Sprint sessions only. */
  vocabularySummary?: VocabularySummary;
}

// ── Post-Session Review ───────────────────────────────────────────────────────

export interface GrammarError {
  expectedPhrase: string;
  spokenPhrase: string;
  errorType: string;
  position: number;
}

export interface PronunciationIssue {
  word: string;
  expectedPhonetic: string;
  issueNote: string;
}

export interface SessionReviewTurn {
  turnIndex: number;
  speakerLabel: string;
  isFacilitatorTurn: boolean;
  englishText: string;
  transcribedText?: string;
  fluencyScore: number;
  confidenceScore: number;
  speakingSpeedWpm: number;
  overallScore: number;
  hesitationWords: string[];
  grammarErrors: GrammarError[];
  pronunciationIssues: PronunciationIssue[];
  wasAnalyzed: boolean;
}

export interface SessionReview {
  sessionId: number;
  scriptTitle: string;
  category: string;
  grammarFocusTag: string;
  totalTurns: number;
  averageOverallScore: number;
  turns: SessionReviewTurn[];
}

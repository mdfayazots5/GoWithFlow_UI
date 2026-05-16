export interface User {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  ageGroup: 'Child (6-12)' | 'Teen (13-17)' | 'Adult (18+)';
  preferredHintLanguage: string;
  avatar?: string;
  groupCode?: string;
  role: 'ADMIN' | 'USER';
  dailyStreakCount: number;
  totalSessionsPlayed: number;
  totalPracticeHours: number;
  active: boolean;
  registrationDate: string;
  weeklyProgress?: number[];
}

export interface Session {
  id: string;
  sessionName: string;
  joinCode?: string;
  sessionMode: 'Solo' | 'Together' | 'Grammar Drill' | 'Roleplay' | 'Mock Interview' | 'Vocabulary Sprint' | 'Fluency Drill' | 'Repractice Round';
  maxMembers?: number;
  sessionDuration?: number;
  hostId: string;
  scriptId: string;
  scriptTitle?: string;
  status: 'LOBBY' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  createdDate: any;
  roomExpiry?: number;
  activeSpeakerId?: string;
  turnIndex?: number;
  currentTranscript?: string;
  lastEvaluation?: VoiceAnalysis;
  memberIds?: string[];
  currentUtteranceIndex?: number;
}

export interface Member {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  slot: number;
  role: string;
  ready: boolean;
  joinedAt: string;
}

export interface Utterance {
  sequenceId: number;
  speakerLabel: string;
  englishText: string;
  hintText: string;
  grammarTag: string;
  contextTag: string;
  focusWord?: string;
  pronunciationNote?: string;
}

export interface Script {
  id: string;
  title: string;
  description: string;
  category: string;
  grammarFocusTag: string;
  contextTag: string;
  complexityLevel: 1 | 2 | 3 | 4 | 5;
  targetAgeGroup: string;
  hintLanguage: string;
  active: boolean;
  uploadedDate: string;
  uploadedBy: string;
  version: number;
  estDuration: number;
  utteranceCount: number;
  utterances: Utterance[];
}

export interface VoiceAnalysis {
  sessionId: string;
  userId: string;
  turnIndex: number;
  utteranceId: number;
  audioUrl?: string;
  transcribedText: string;
  expectedText: string;
  fluencyScore: number;          // 0-100
  confidenceScore: number;       // 0-100
  speakingSpeedWPM: number;      // words per minute
  pauseCount: number;
  pauseTimings: number[];        // pause durations in ms
  hesitationWords: string[];     // um, uh, err etc.
  repeatedWords: string[];
  grammarErrors: GrammarError[];
  pronunciationIssues: PronunciationIssue[];
  overallScore: number;          // 0-100
  recordedAt: string;
}

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

export interface TurnState {
  sessionId: string;
  activeMemberId: string;
  activeSlotIndex: number;
  turnIndex: number;
  totalTurns: number;
  utterance: {
    sequenceId: number;
    speakerLabel: string;
    englishText: string;
    hintText: string;
    grammarTag: string;
    focusWord?: string;
    pronunciationNote?: string;
  };
  reReadAllowed: boolean;
  reReadCount: number;
  maxReReads: number;
}

export interface Mistake {
  id: string;
  userId: string;
  sessionId: string;
  utteranceId: number;
  scriptId: string;
  utteranceText: string;
  spokenText: string;
  mistakeType: 'GRAMMAR' | 'PRONUNCIATION' | 'HESITATION' | 'SKIP' | 'INCOMPLETE' | 'SPEED';
  mistakeDetail: string;
  grammarTag?: string;
  contextTag?: string;
  correctionText?: string;
  practiceCount: number;
  resolved: boolean;
  firstOccurrence: string;
  lastAttempt: string;
}

export interface RepracticeSession {
  id: string;
  userId: string;
  sourceSessionId: string;
  generatedDate: string;
  mistakeIds: string[];
  totalMistakes: number;
  completedRounds: number;
  improvementPercentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  utterances: RepracticeUtterance[];
}

export interface RepracticeUtterance {
  originalUtteranceId: number;
  englishText: string;
  hintText: string;
  mistakeType: string;
  mistakeDetail: string;
  correctionNote: string;
  attemptCount: number;
  bestScore: number;
  lastScore: number;
  resolved: boolean;
}

export interface Assessment {
  id: string;
  sessionId: string;
  candidateMemberId: string;
  assessorMemberId: string;
  utteranceIndex: number;
  transcript: string;
  ratings: {
    fluency: number;
    pronunciationScore: number;
    confidence: number;
    accuracy: number;
    grammar: number;
    clarity: number;
  };
  phoneticFeedback?: string;
  feedbackTags: string[];
  notes?: string;
  timestamp: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: any;
}

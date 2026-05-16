export interface User {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  ageGroup: 'Child (6-12)' | 'Teen (13-17)' | 'Adult (18+)';
  preferredHintLanguage: 'Telugu' | 'Hindi' | 'Tamil' | 'Kannada' | 'None';
  avatar?: string;
  groupCode?: string;
  role: 'ADMIN' | 'USER';
  dailyStreakCount: number;
  totalSessionsPlayed: number;
  active: boolean;
  registrationDate: string;
}

export interface UserProfile extends User {
  memberSince: string;
  avgFluencyScore: number;
  mistakesFixed: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedDate?: string;
}

export interface StreakData {
  currentStreak: number;
  lastPracticeDate: string;
  streakHistory: { date: string; completed: boolean }[];
}

export interface ImprovementData {
  sessionsCompleted: number;
  avgScoreThisWeek: number;
  mistakesResolved: number;
  currentStreak: number;
  scoreTrend: ScoreTrendPoint[];
  grammarProgress: GrammarProgress[];
  repracticeHistory: RepracticeHistoryItem[];
}

export interface ScoreTrendPoint {
  date: string;
  sessionName: string;
  fluency: number;
  confidence: number;
  mistakes: number;
}

export interface GrammarProgress {
  tag: string;
  totalMistakes: number;
  resolvedMistakes: number;
}

export interface RepracticeHistoryItem {
  date: string;
  sourceSession: string;
  mistakesPracticed: number;
  improvementPercent: number;
}

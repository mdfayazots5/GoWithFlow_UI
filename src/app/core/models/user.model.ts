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
  longestStreak: number;
  last30Days: { streakDate: string; sessionCount: number; practiceMinutes: number }[];
}

export interface ImprovementData {
  statsHeader: {
    sessionsCompleted: number;
    avgScoreThisWeek: number;
    mistakesResolved: number;
    currentStreak: number;
  };
  recentSessions: ScoreTrendPoint[];
  weeklyScores: { weekLabel: string; avgFluencyScore: number }[];
  grammarProgress: GrammarProgress[];
  repracticeHistory: RepracticeHistoryItem[];
  badgesEarned: UserBadge[];
}

export interface ScoreTrendPoint {
  sessionDate: string;
  sessionName: string;
  fluencyScore: number;
  confidenceScore: number;
  mistakeCount: number;
}

export interface GrammarProgress {
  grammarTag: string;
  totalMistakes: number;
  resolvedMistakes: number;
  improvementPercent: number;
  progressBarValue: number;
}

export interface RepracticeHistoryItem {
  date: string;
  sourceSession: string;
  mistakesPracticed: number;
  improvementPercent: number;
}

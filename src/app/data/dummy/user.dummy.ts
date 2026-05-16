import { User } from '../../core/models/user.model';

export const DUMMY_USERS: User[] = [
  {
    id: 'U000',
    fullName: 'GoWithFlow Admin',
    mobileNumber: '9999900000',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'None',
    role: 'ADMIN',
    dailyStreakCount: 0,
    totalSessionsPlayed: 0,
    active: true,
    registrationDate: '2024-01-01'
  },
  {
    id: 'U001',
    fullName: 'Ravi Kumar',
    mobileNumber: '9876543210',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'Telugu',
    role: 'USER',
    dailyStreakCount: 7,
    totalSessionsPlayed: 23,
    active: true,
    registrationDate: '2024-01-10'
  },
  {
    id: 'U002',
    fullName: 'Priya Kumar',
    mobileNumber: '9876543211',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'Telugu',
    role: 'USER',
    dailyStreakCount: 5,
    totalSessionsPlayed: 18,
    active: true,
    registrationDate: '2024-01-15'
  },
  {
    id: 'U003',
    fullName: 'Arjun Kumar',
    mobileNumber: '9876543212',
    ageGroup: 'Teen (13-17)',
    preferredHintLanguage: 'Telugu',
    role: 'USER',
    dailyStreakCount: 12,
    totalSessionsPlayed: 30,
    active: true,
    registrationDate: '2024-01-20'
  },
  {
    id: 'U004',
    fullName: 'Sneha Kumar',
    mobileNumber: '9876543213',
    ageGroup: 'Child (6-12)',
    preferredHintLanguage: 'Telugu',
    role: 'USER',
    dailyStreakCount: 4,
    totalSessionsPlayed: 10,
    active: true,
    registrationDate: '2024-01-25'
  }
];

export const DUMMY_USER_PROFILE = {
  ...DUMMY_USERS[1],
  memberSince: 'Jan 2024',
  avgFluencyScore: 82,
  mistakesFixed: 45
};

export const DUMMY_BADGES = [
  { id: 'B001', name: '7-Day Streak', description: 'Practiced for 7 days in a row', icon: 'Flame', isEarned: true, earnedDate: '2024-05-10' },
  { id: 'B002', name: '10 Sessions', description: 'Completed 10 speaking sessions', icon: 'Award', isEarned: true, earnedDate: '2024-04-15' },
  { id: 'B003', name: '50 Mistakes Fixed', description: 'Successfully corrected 50 mistakes', icon: 'Target', isEarned: false },
  { id: 'B004', name: 'Fluency King', description: 'Achieve 90%+ score in 5 sessions', icon: 'Crown', isEarned: false }
];

export const DUMMY_STREAK_DATA = {
  currentStreak: 7,
  lastPracticeDate: '2024-05-16',
  streakHistory: [
    { date: '2024-05-16', completed: true },
    { date: '2024-05-15', completed: true },
    { date: '2024-05-14', completed: true },
    { date: '2024-05-13', completed: true },
    { date: '2024-05-12', completed: true },
    { date: '2024-05-11', completed: true },
    { date: '2024-05-10', completed: true }
  ]
};

export const DUMMY_IMPROVEMENT_DATA = {
  sessionsCompleted: 23,
  avgScoreThisWeek: 85,
  mistakesResolved: 45,
  currentStreak: 7,
  scoreTrend: [
    { date: '2024-05-10', sessionName: 'Office Conversation', fluency: 78, confidence: 70, mistakes: 4 },
    { date: '2024-05-12', sessionName: 'Market Roleplay', fluency: 82, confidence: 75, mistakes: 2 },
    { date: '2024-05-14', sessionName: 'Drill: Was/Were', fluency: 88, confidence: 85, mistakes: 1 },
    { date: '2024-05-16', sessionName: 'Mock Interview: Intro', fluency: 85, confidence: 80, mistakes: 3 }
  ],
  grammarProgress: [
    { tag: 'Have Been', totalMistakes: 10, resolvedMistakes: 6 },
    { tag: 'Was/Were', totalMistakes: 8, resolvedMistakes: 7 },
    { tag: 'Doesn\'t', totalMistakes: 12, resolvedMistakes: 5 }
  ],
  repracticeHistory: [
    { date: '2024-05-15', sourceSession: 'Office Conversation', mistakesPracticed: 5, improvementPercent: 80 },
    { date: '2024-05-14', sourceSession: 'Grammar Drill', mistakesPracticed: 3, improvementPercent: 95 }
  ]
};

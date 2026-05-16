import { User } from '@/types';

export const DUMMY_USERS: User[] = [
  {
    id: 'U000',
    fullName: 'GoWithFlow Admin',
    mobileNumber: '9999999999',
    role: 'ADMIN',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'None',
    dailyStreakCount: 0,
    totalSessionsPlayed: 0,
    totalPracticeHours: 0,
    active: true,
    registrationDate: new Date().toISOString(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    weeklyProgress: [0, 0, 0, 0]
  },
  {
    id: 'U001',
    fullName: 'Ravi Kumar',
    mobileNumber: '9876543210',
    role: 'USER',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'Telugu',
    dailyStreakCount: 7,
    totalSessionsPlayed: 23,
    totalPracticeHours: 12.5,
    active: true,
    registrationDate: new Date().toISOString(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
    weeklyProgress: [45, 58, 72, 85]
  },
  {
    id: 'U002',
    fullName: 'Priya Kumar',
    mobileNumber: '9123456789',
    role: 'USER',
    ageGroup: 'Adult (18+)',
    preferredHintLanguage: 'Telugu',
    dailyStreakCount: 5,
    totalSessionsPlayed: 18,
    totalPracticeHours: 9.2,
    active: true,
    registrationDate: new Date().toISOString(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    weeklyProgress: [60, 62, 68, 75]
  },
  {
    id: 'U003',
    fullName: 'Arjun Kumar',
    mobileNumber: '9234567890',
    role: 'USER',
    ageGroup: 'Teen (13-17)',
    preferredHintLanguage: 'Telugu',
    dailyStreakCount: 12,
    totalSessionsPlayed: 30,
    totalPracticeHours: 25.8,
    active: true,
    registrationDate: new Date().toISOString(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    weeklyProgress: [30, 45, 60, 92]
  },
  {
    id: 'U004',
    fullName: 'Sneha Kumar',
    mobileNumber: '9345678901',
    role: 'USER',
    ageGroup: 'Child (6-12)',
    preferredHintLanguage: 'Telugu',
    dailyStreakCount: 4,
    totalSessionsPlayed: 10,
    totalPracticeHours: 5.4,
    active: true,
    registrationDate: new Date().toISOString(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    weeklyProgress: [50, 55, 52, 65]
  }
];

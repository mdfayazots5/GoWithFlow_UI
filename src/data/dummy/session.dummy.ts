import { Session } from '@/types';

export const DUMMY_SESSIONS: Session[] = [
  {
    id: 'S001',
    sessionName: 'Family Dinner Drill',
    sessionMode: 'Solo',
    scriptId: 'SCR001',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 } as any,
    status: 'COMPLETED',
    memberIds: ['U001'],
    currentUtteranceIndex: 5,
    hostId: 'U001'
  },
  {
    id: 'S002',
    sessionName: 'Bedtime Stories',
    sessionMode: 'Together',
    scriptId: 'SCR002',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 7200, nanoseconds: 0 } as any,
    status: 'COMPLETED',
    memberIds: ['U001', 'U002'],
    currentUtteranceIndex: 12,
    hostId: 'U001'
  },
  {
    id: 'S003',
    sessionName: 'Morning Routine',
    sessionMode: 'Solo',
    scriptId: 'SCR001',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 } as any,
    status: 'IN_PROGRESS',
    memberIds: ['U003'],
    currentUtteranceIndex: 2,
    hostId: 'U003'
  },
  {
    id: 'S004',
    sessionName: 'Weekend Grocery Shop',
    sessionMode: 'Together',
    scriptId: 'SCR003',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 172800, nanoseconds: 0 } as any,
    status: 'COMPLETED',
    memberIds: ['U001', 'U004'],
    currentUtteranceIndex: 8,
    hostId: 'U001'
  },
  {
    id: 'S005',
    sessionName: 'Job Interview Prep',
    sessionMode: 'Mock Interview',
    scriptId: 'SCR005',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 5000, nanoseconds: 0 } as any,
    status: 'ACTIVE',
    memberIds: ['U002'],
    currentUtteranceIndex: 3,
    hostId: 'U002'
  },
  {
    id: 'S006',
    sessionName: 'Airport Check-in',
    sessionMode: 'Roleplay',
    scriptId: 'SCR006',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 12000, nanoseconds: 0 } as any,
    status: 'LOBBY',
    memberIds: ['U004', 'U005'],
    currentUtteranceIndex: 0,
    hostId: 'U004'
  },
  {
    id: 'S007',
    sessionName: 'Grammar Power Hour',
    sessionMode: 'Grammar Drill',
    scriptId: 'SCR007',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 200000, nanoseconds: 0 } as any,
    status: 'EXPIRED',
    memberIds: ['U001'],
    currentUtteranceIndex: 15,
    hostId: 'U001'
  },
  {
    id: 'S008',
    sessionName: 'Coffee Shop Order',
    sessionMode: 'Solo',
    scriptId: 'SCR008',
    createdDate: { seconds: Math.floor(Date.now() / 1000) - 300000, nanoseconds: 0 } as any,
    status: 'ABANDONED',
    memberIds: ['U006'],
    currentUtteranceIndex: 1,
    hostId: 'U006'
  }
];

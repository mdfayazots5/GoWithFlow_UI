// File: src/app/data/dummy/session.dummy.ts
import { Session } from '@core/models/session.model';

export const DUMMY_SESSIONS: Session[] = [
  {
    id: 'S001',
    sessionName: 'Family Grammar Practice',
    joinCode: 'KLM849',
    sessionMode: 'Grammar Drill',
    maxMembers: 4,
    currentMembers: 4,
    sessionDuration: 30,
    hostUserId: 'U001',
    hostName: 'Ravi Kumar',
    scriptId: 'SC001',
    scriptTitle: 'Office Conversation — Have Been',
    status: 'ACTIVE',
    createdDate: '2024-05-16T10:00:00Z',
    roomExpiresAt: '2024-05-16T14:00:00Z'
  },
  {
    id: 'S002',
    sessionName: 'OOP Mock Interview',
    joinCode: 'JNR293',
    sessionMode: 'Mock Interview',
    maxMembers: 3,
    currentMembers: 1,
    sessionDuration: 45,
    hostUserId: 'U001',
    hostName: 'Ravi Kumar',
    scriptId: 'SC002',
    scriptTitle: 'Mock Interview — OOP Concepts',
    status: 'LOBBY',
    createdDate: '2024-05-16T14:00:00Z',
    roomExpiresAt: '2024-05-16T18:00:00Z'
  },
  {
    id: 'S003',
    sessionName: 'Kids Kitchen Roleplay',
    joinCode: 'KCH772',
    sessionMode: 'Roleplay',
    maxMembers: 2,
    currentMembers: 2,
    sessionDuration: 20,
    hostUserId: 'U001',
    hostName: 'Ravi Kumar',
    scriptId: 'SC003',
    scriptTitle: 'Family Kitchen Roleplay',
    status: 'COMPLETED',
    createdDate: '2024-05-15T18:00:00Z',
    roomExpiresAt: '2024-05-15T20:00:00Z',
    fluencyScore: 92,
    mistakesCount: 1
  }
];

export const DUMMY_SESSION_DETAIL = {
  ...DUMMY_SESSIONS[2],
  myPerformance: {
    fluency: 92,
    confidence: 88,
    speedWpm: 120,
    pauses: 2
  },
  myMistakes: [
    { type: 'GRAMMAR', said: 'I have work here', shouldBe: 'I have been working here', tag: 'Have Been' }
  ],
  listenerFeedback: [
    { tag: 'Good', count: 5 },
    { tag: 'Mistake', count: 1 }
  ],
  memberScores: [
    { name: 'Ravi Kumar', fluency: 92, confidence: 88, mistakes: 1 },
    { name: 'Priya Kumar', fluency: 88, confidence: 82, mistakes: 2 }
  ]
};

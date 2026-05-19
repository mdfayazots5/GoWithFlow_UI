// File: src/app/core/models/session.model.ts

export interface Session {
  id: string;
  sessionName: string;
  joinCode: string;
  sessionMode: 'Grammar Drill' | 'Roleplay' | 'Mock Interview' | 'Vocabulary Sprint' | 'Fluency Drill' | 'Repractice Round';
  maxMembers: number;
  currentMembers: number;
  sessionDuration: number;
  hostUserId: string;
  hostName: string;
  scriptId: string;
  scriptTitle: string;
  status: 'LOBBY' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  createdDate: string;
  startedDate?: string;
  endedDate?: string;
  roomExpiresAt: string;
  fluencyScore?: number;
  mistakesCount?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  sessionName: string;
  joinCode: string;
  status: string;
  scriptTitle: string;
}

export interface SessionPreview {
  id: string;
  sessionName: string;
  sessionMode: string;
  scriptTitle: string;
  sessionDuration: number;
  currentMembers: number;
  maxMembers: number;
  slots: SessionSlot[];
}

export interface JoinSessionResponse {
  sessionId: string;
  sessionName: string;
  joinCode: string;
  sessionMode: string;
  scriptTitle: string;
  maxMembers: number;
  sessionDuration: number;
  canStart: boolean;
  members: LobbyMember[];
}

export interface SessionSlot {
  slotIndex: number;
  slotName: string;
  isOccupied: boolean;
  userId?: string;
  userName?: string;
  isReady?: boolean;
}

export interface SessionDetail extends Session {
  myPerformance: {
    fluency: number;
    confidence: number;
    speedWpm: number;
    pauses: number;
  };
  myMistakes: {
    type: string;
    said: string;
    shouldBe: string;
    tag: string;
  }[];
  listenerFeedbackReceived: {
    tag: string;
    count: number;
  }[];
  allMemberScores: {
    name: string;
    fluency: number;
    confidence: number;
    mistakes: number;
  }[];
}

export interface LobbyState {
  session: Session;
  members: LobbyMember[];
  canStart: boolean;
}

export interface LobbyMember {
  userId: string;
  name: string;
  avatar: string;
  ready: boolean;
  isHost: boolean;
  slotIndex: number;
  slotName: string;
}

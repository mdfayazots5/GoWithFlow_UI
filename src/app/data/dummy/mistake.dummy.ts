// File: src/app/data/dummy/mistake.dummy.ts
import { Mistake, MistakeSummary, RepracticeSession } from '@core/models/mistake.model';

export const DUMMY_MISTAKES: Mistake[] = [
  {
    id: 'M001',
    userId: 'U001',
    type: 'GRAMMAR',
    spokenText: 'I have work here for three years.',
    expectedText: 'I have been working here for three years.',
    sessionId: 'S001',
    sessionName: 'Family Grammar Practice',
    createdDate: '2024-05-16T10:00:00Z',
    occurredCount: 3,
    practicedCount: 1,
    isResolved: false,
    correctionNote: "Use 'have been working' for actions that started in the past and continue to the present."
  },
  {
    id: 'M002',
    userId: 'U001',
    type: 'GRAMMAR',
    spokenText: 'He don\'t like coffee.',
    expectedText: 'He doesn\'t like coffee.',
    sessionId: 'S001',
    sessionName: 'Family Grammar Practice',
    createdDate: '2024-05-16T10:15:00Z',
    occurredCount: 2,
    practicedCount: 0,
    isResolved: false,
    correctionNote: "Use 'doesn't' for third-person singular (He, She, It)."
  },
  {
    id: 'M003',
    userId: 'U001',
    type: 'PRONUNCIATION',
    spokenText: 'The schedule was tight.',
    expectedText: 'The schedule was tight.',
    sessionId: 'S002',
    sessionName: 'OOP Mock Interview',
    createdDate: '2024-05-16T14:30:00Z',
    occurredCount: 1,
    practicedCount: 0,
    isResolved: false,
    correctionNote: "Focus on 'sked-yool' (US) or 'shed-yool' (UK)."
  },
  {
    id: 'M004',
    userId: 'U001',
    type: 'HESITATION',
    spokenText: 'I um... think that... uh... classes are important.',
    expectedText: 'I think that classes are important.',
    sessionId: 'S002',
    sessionName: 'OOP Mock Interview',
    createdDate: '2024-05-16T14:45:00Z',
    occurredCount: 4,
    practicedCount: 2,
    isResolved: true
  }
];

export const DUMMY_MISTAKE_SUMMARY: MistakeSummary = {
  totalMistakes: 8,
  resolvedMistakes: 3,
  pendingPractice: 5,
  improvementPercent: 65
};

export const DUMMY_REPRACTICE: RepracticeSession = {
  id: 'RP001',
  userId: 'U001',
  status: 'PENDING',
  startedDate: '2024-05-16T15:00:00Z',
  utterances: [
    {
      id: 'RU001',
      mistakeId: 'M001',
      originalSpoken: 'I have work here for three years.',
      correctText: 'I have been working here for three years.',
      correctionNote: "Use 'have been working' for continuous past actions.",
      hintText: 'నేను మూడు సంవత్సరాలుగా ఇక్కడ పని చేస్తున్నాను.',
      attempts: [],
      isResolved: false
    },
    {
      id: 'RU002',
      mistakeId: 'M002',
      originalSpoken: 'He don\'t like coffee.',
      correctText: 'He doesn\'t like coffee.',
      correctionNote: "Use 'doesn't' for He/She/It.",
      hintText: 'అతనికి కాఫీ ఇష్టం ఉండదు.',
      attempts: [],
      isResolved: false
    }
  ]
};

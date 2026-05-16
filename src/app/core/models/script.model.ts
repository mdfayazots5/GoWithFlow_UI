// File: src/app/core/models/script.model.ts

export interface Script {
  id: string;
  scriptTitle: string;
  category: 'Grammar Drill' | 'Roleplay' | 'Interview' | 'Vocabulary' | 'Fluency Drill' | 'Repetition';
  grammarFocusTag: string;
  contextTag: string;
  complexityLevel: 1 | 2 | 3 | 4 | 5;
  targetAgeGroup: 'All' | 'Child (6-12)' | 'Teen (13-17)' | 'Adult (18+)';
  hintLanguage: string;
  active: boolean;
  uploadedDate: string;
  uploadedBy: string;
  version: number;
  utteranceCount: number;
  utterances: Utterance[];
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

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ValidationResult {
  isValid: boolean;
  rows: Utterance[];
  errors: string[];
}

export interface ScriptUploadResponse {
  success: boolean;
  scriptId: string;
  version: number;
}

export interface ScriptVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
}

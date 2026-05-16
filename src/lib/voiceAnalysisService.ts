import { VoiceAnalysis, GrammarError, PronunciationIssue } from '@/types';

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceAnalysisService {
  private recognition: any;
  private isRecording: boolean = false;
  private startTime: number = 0;
  private pauseCount: number = 0;
  private pauseTimings: number[] = [];

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public startRecording(onResult: (transcript: string) => void): void {
    if (!this.recognition || this.isRecording) return;

    this.isRecording = true;
    this.startTime = Date.now();
    this.pauseCount = 0;
    this.pauseTimings = [];
    this.lastConfidence = 1;

    this.recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let totalConfidence = 0;
      let resultCount = 0;

      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i][0].confidence > 0) {
          totalConfidence += event.results[i][0].confidence;
          resultCount++;
        }
      }
      
      this.lastConfidence = resultCount > 0 ? totalConfidence / resultCount : 0.8;
      onResult(fullTranscript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      this.isRecording = false;
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };

    this.recognition.start();
  }

  private lastConfidence: number = 0;

  public stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }

  public analyzeTranscript(
    spoken: string, 
    expected: string,
    sessionId: string,
    userId: string,
    turnIndex: number,
    utteranceId: number
  ): VoiceAnalysis {
    const spokenClean = spoken.toLowerCase().trim().replace(/[.,!?;]/g, '');
    const expectedClean = expected.toLowerCase().trim().replace(/[.,!?;]/g, '');
    
    const spokenWords = spokenClean.split(/\s+/).filter(Boolean);
    const expectedWords = expectedClean.split(/\s+/).filter(Boolean);

    // 1. Hesitation Detection
    const hesitations = ['um', 'uh', 'err', 'like', 'you know'];
    const foundHesitations = spokenWords.filter(w => hesitations.includes(w));

    // 2. Repeated Words
    const repeated = spokenWords.filter((w, i) => w === spokenWords[i - 1]);

    // 3. Word Match & Grammar Errors
    const grammarErrors: GrammarError[] = [];
    let matchCount = 0;
    
    const spokenSet = new Set(spokenWords);
    expectedWords.forEach((word, idx) => {
      if (spokenSet.has(word)) {
        matchCount++;
      } else {
        grammarErrors.push({
          expectedPhrase: word,
          spokenPhrase: '',
          errorType: 'MISSING_WORD',
          position: idx
        });
      }
    });

    // 4. Score Calculation
    // Fluency (0-100): word match ratio vs expected text
    const fluencyScore = (matchCount / (expectedWords.length || 1)) * 100;
    
    // Confidence (0-100): Web Speech API .confidence * 100
    const confidenceScore = this.lastConfidence * 100;
    
    // Penalties
    const hesitationPenalty = foundHesitations.length * 5;
    const repetitionPenalty = repeated.length * 5;
    
    const overallScore = Math.max(0, Math.min(100, (fluencyScore * 0.7 + confidenceScore * 0.3) - hesitationPenalty - repetitionPenalty));
    
    // 5. Speed Estimation (WPM)
    const durationMinutes = (Date.now() - this.startTime) / 60000;
    const wpm = Math.round(spokenWords.length / (durationMinutes || 0.1));

    return {
      sessionId,
      userId,
      turnIndex,
      utteranceId,
      transcribedText: spoken,
      expectedText: expected,
      fluencyScore: Math.round(fluencyScore),
      confidenceScore: Math.round(confidenceScore),
      speakingSpeedWPM: wpm,
      pauseCount: this.pauseCount,
      pauseTimings: this.pauseTimings,
      hesitationWords: foundHesitations,
      repeatedWords: repeated,
      grammarErrors,
      pronunciationIssues: [],
      overallScore: Math.round(overallScore),
      recordedAt: new Date().toISOString()
    };
  }

  public analyzeSpeech(
    spoken: string, 
    expected: string,
    userId: string,
    sessionId: string = 'solo',
    utteranceId: number = 0,
    turnIndex: number = 0
  ): VoiceAnalysis {
    return this.analyzeTranscript(spoken, expected, sessionId, userId, turnIndex, utteranceId);
  }
}

export const voiceAnalysisService = new VoiceAnalysisService();
export const voiceService = voiceAnalysisService;

// File: src/app/core/services/voice-analysis.service.ts
import { Injectable, signal } from '@angular/core';
import { Observable, Subject, of, delay } from 'rxjs';
import { environment } from '@env/environment';
import { VoiceAnalysis, VoiceMistake } from '@core/models/voice.model';

@Injectable({
  providedIn: 'root'
})
export class VoiceAnalysisService {
  private recognition: any;
  private interimTranscript = new Subject<string>();

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.interimTranscript.next(transcript);
      };
    }
  }

  startRecording(): Observable<string> {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already started');
      }
    }
    return this.interimTranscript.asObservable();
  }

  stopRecording(): string {
    if (this.recognition) {
      this.recognition.stop();
    }
    return ''; // The final transcript will be handled via the last observable emission normally, 
    // but we'll return a placeholder here as per instructions to stop and then analyze.
  }

  analyzeTranscript(spoken: string, expected: string): VoiceAnalysis {
    if (environment.isDemo) {
      return this.getMockAnalysis(spoken, expected);
    }

    const spokenClean = spoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const expectedClean = expected.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    const spokenWords = spokenClean.split(/\s+/);
    const expectedWords = expectedClean.split(/\s+/);

    // Simple word match score
    let matches = 0;
    expectedWords.forEach(word => {
      if (spokenWords.includes(word)) matches++;
    });

    const fluencyScore = Math.round((matches / expectedWords.length) * 100);
    const hesitations = spokenWords.filter(w => ['um', 'uh', 'err', 'like'].includes(w));
    
    // Confidence is hard to measure without native API support for it on all browsers,
    // so we'll simulate it based on hesitations.
    const confidenceScore = Math.max(0, 100 - (hesitations.length * 15));
    
    const mistakes: VoiceMistake[] = [];
    if (fluencyScore < 80) {
      mistakes.push({
        type: 'SKIP',
        severity: 'medium',
        expected: expected,
        actual: spoken
      });
    }

    return {
      transcript: spoken,
      expectedText: expected,
      fluencyScore,
      confidenceScore,
      speedWpm: Math.round(spokenWords.length / 0.1), // Mock speed
      hesitations,
      mistakes,
      isPassed: fluencyScore >= 80
    };
  }

  private getMockAnalysis(spoken: string, expected: string): VoiceAnalysis {
    return {
      transcript: spoken || "I have been working here for three years.",
      expectedText: expected,
      fluencyScore: 85,
      confidenceScore: 90,
      speedWpm: 120,
      hesitations: [],
      mistakes: [],
      isPassed: true
    };
  }

  // Placeholder for saving analysis if needed here, but usually handled in LiveSessionService
}

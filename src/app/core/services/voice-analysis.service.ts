import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
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
    return '';
  }

  analyzeTranscript(spoken: string, expected: string): VoiceAnalysis {
    const spokenClean = spoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
    const expectedClean = expected.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

    const spokenWords = spokenClean.split(/\s+/);
    const expectedWords = expectedClean.split(/\s+/);

    let matches = 0;
    expectedWords.forEach(word => {
      if (spokenWords.includes(word)) matches++;
    });

    const fluencyScore = Math.round((matches / expectedWords.length) * 100);
    const hesitations = spokenWords.filter(w => ['um', 'uh', 'err', 'like'].includes(w));
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
      speedWpm: Math.round(spokenWords.length / 0.1),
      hesitations,
      mistakes,
      isPassed: fluencyScore >= 80
    };
  }
}

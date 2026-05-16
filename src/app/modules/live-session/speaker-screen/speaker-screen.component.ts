// File: src/app/modules/live-session/speaker-screen/speaker-screen.component.ts
import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState, VoiceAnalysis } from '@core/models/voice.model';
import { LucideAngularModule, Mic, CheckCircle2, ChevronRight, XCircle, RotateCcw, Eye, EyeOff, FastForward } from 'lucide-angular';
import { VoiceAnalysisService } from '@core/services/voice-analysis.service';
import { LiveSessionService } from '../live-session.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-speaker-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-12 animate-in slide-in-from-bottom-10 duration-700 pb-10">
      <!-- Top Indicator -->
      <div class="space-y-4">
         <div class="flex justify-between items-center px-1">
            <span class="text-xs font-black uppercase tracking-widest text-[#E07B39] italic">YOUR TURN TO SPEAK</span>
            <span class="text-xs font-black text-white/40 italic">Turn {{ turnState.turnIndex }} of {{ turnState.totalTurns }}</span>
         </div>
         <div class="flex gap-1.5 h-1.5">
            @for (i of [].constructor(turnState.totalTurns); track $index; let j = $index) {
              <div 
                class="flex-1 rounded-full transition-all duration-500"
                [class.bg-[#3D5A99]]="j < turnState.turnIndex"
                [class.bg-white/10]="j >= turnState.turnIndex"
              ></div>
            }
         </div>
      </div>

      <!-- Utterance Card -->
      <div class="space-y-8">
         <div class="space-y-6">
            <div class="flex justify-start">
               <span class="px-4 py-1.5 bg-[#E07B39] text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-[#E07B39]/20">
                  {{ turnState.utterance.grammarTag }}
               </span>
            </div>

            <div class="space-y-4">
              <h1 class="text-4xl md:text-5xl font-black text-white italic leading-[1.1] tracking-tight">
                 @for (word of words(); track $index; let k = $index) {
                   <span [class.text-[#E07B39]]="word.toLowerCase() === turnState.utterance.focusWord?.toLowerCase()">{{ word }} </span>
                 }
              </h1>
              @if (turnState.utterance.pronunciationNote) {
                 <p class="text-sm font-bold text-white/40 italic flex items-center gap-2">
                    <i-lucide [img]="NoteIcon" size="14"></i-lucide>
                    {{ turnState.utterance.pronunciationNote }}
                 </p>
              }
            </div>
         </div>

         <!-- Hint Area -->
         <div class="space-y-4">
            <button 
              (click)="showHint.set(!showHint())"
              class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic transition-all"
              [class.text-[#E07B39]]="showHint()"
              [class.text-white/40]="!showHint()"
            >
               <i-lucide [img]="showHint() ? EyeHideIcon : EyeIcon" size="14"></i-lucide>
               {{ showHint() ? 'HIDE HINT' : 'SHOW TELUGU HINT' }}
            </button>
            
            @if (showHint()) {
              <div class="p-6 bg-white/5 border border-white/10 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                 <p class="text-xl font-bold text-[#E07B39] italic leading-relaxed">{{ turnState.utterance.hintText }}</p>
              </div>
            }
         </div>
      </div>

      <!-- Transcription Area -->
      @if (isRecording() || analysis()) {
        <div class="min-h-[60px] p-6 bg-white/5 rounded-3xl border-2 border-white/5 relative">
           <div class="absolute -top-3 left-6 px-3 bg-[#1A1A2E] text-[8px] font-black uppercase tracking-widest italic text-white/40">Transcription</div>
           
           @if (isRecording()) {
             <p class="text-lg font-bold text-white/60 italic animate-pulse">{{ interimTranscript() || 'Listening...' }}</p>
           } @else if (analysis()) {
             <p class="text-lg font-bold text-white italic">
                @for (word of spokenWords(); track $index; let m = $index) {
                   <span class="inline-block mr-1" [class.text-gw-error]="word.isError">{{ word.text }}</span>
                }
             </p>
           }
        </div>
      }

      <!-- Voice Interaction -->
      <div class="flex flex-col items-center gap-8 py-4">
         @if (!analysis()) {
           <div class="relative">
              @if (isRecording()) {
                <div class="absolute inset-0 bg-[#2E7D32]/20 rounded-full animate-ping"></div>
              }
              <button 
                (click)="isRecording() ? stopRecording() : startRecording()"
                class="w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10"
                [class.bg-[#2E7D32]]="isRecording()"
                [class.bg-[#3D5A99]]="!isRecording()"
                [class.scale-110]="isRecording()"
                [class.shadow-[#2E7D32]/40]="isRecording()"
                [class.shadow-[#3D5A99]/40]="!isRecording()"
              >
                 <i-lucide [img]="MicIcon" size="40" class="text-white"></i-lucide>
              </button>
           </div>
           <p class="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
              {{ isRecording() ? 'TAP TO ANALYZE' : 'TAP TO RECORD' }}
           </p>
         } @else {
           <!-- ANALYSIS FEEDBACK STRIP -->
           <div class="w-full grid grid-cols-3 gap-2 bg-white/5 p-4 rounded-3xl border border-white/10 animate-in zoom-in duration-500">
              <div class="text-center space-y-1">
                 <span class="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Fluency</span>
                 <p class="text-xl font-black italic" [class.text-gw-success]="(analysis()?.fluencyScore || 0) >= 80" [class.text-gw-warning]="(analysis()?.fluencyScore || 0) < 80">
                    {{ analysis()?.fluencyScore }}%
                 </p>
              </div>
              <div class="text-center space-y-1 border-x border-white/10">
                 <span class="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Confid.</span>
                 <p class="text-xl font-black italic text-white">{{ analysis()?.confidenceScore }}%</p>
              </div>
              <div class="text-center space-y-1">
                 <span class="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Speed</span>
                 <p class="text-xl font-black italic text-white">{{ analysis()?.speedWpm }}<span class="text-[10px]">wpm</span></p>
              </div>
           </div>

           <div class="w-full space-y-4">
              <button 
                (click)="onConfirm()"
                class="w-full h-16 bg-[#3D5A99] text-white font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-[#3D5A99]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                DONE SPEAKING
                <i-lucide [img]="CheckIcon" size="20"></i-lucide>
              </button>

              <div class="flex gap-4">
                 @if (turnState.reReadAllowed && turnState.reReadCount < turnState.maxReReads) {
                 <button
                    (click)="onReRead()"
                    class="flex-1 h-12 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                 >
                    <i-lucide [img]="RetryIcon" size="14"></i-lucide>
                    RE-READ
                 </button>
                 }
                 <button 
                    (click)="onConfirm()"
                    class="flex-1 h-12 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                 >
                    <i-lucide [img]="SkipIcon" size="14"></i-lucide>
                    SKIP
                 </button>
              </div>
           </div>
         }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SpeakerScreenComponent {
  @Input({ required: true }) turnState!: TurnState;
  @Output() turnShifted = new EventEmitter<void>();

  private voiceService = inject(VoiceAnalysisService);
  private liveSessionService = inject(LiveSessionService);
  private toast = inject(ToastService);

  readonly MicIcon = Mic;
  readonly NoteIcon = CheckCircle2;
  readonly EyeIcon = Eye;
  readonly EyeHideIcon = EyeOff;
  readonly CheckIcon = ChevronRight;
  readonly RetryIcon = RotateCcw;
  readonly SkipIcon = FastForward;

  isRecording = signal(false);
  interimTranscript = signal('');
  analysis = signal<VoiceAnalysis | null>(null);
  showHint = signal(false);
  
  words = signal<string[]>([]);
  spokenWords = signal<{ text: string, isError: boolean }[]>([]);

  ngOnChanges() {
    if (this.turnState) {
      this.words.set(this.turnState.utterance.englishText.split(' '));
      this.resetRecording();
    }
  }

  startRecording() {
    this.isRecording.set(true);
    this.interimTranscript.set('');
    this.voiceService.startRecording().subscribe(res => {
      this.interimTranscript.set(res);
    });
  }

  stopRecording() {
    this.isRecording.set(false);
    this.voiceService.stopRecording();
    this.performAnalysis(this.interimTranscript());
  }

  performAnalysis(transcript: string) {
    const result = this.voiceService.analyzeTranscript(transcript, this.turnState.utterance.englishText);
    this.analysis.set(result);
    
    // Compute diff for visuals
    const expected = this.turnState.utterance.englishText.toLowerCase().split(' ');
    const spoken = transcript.toLowerCase().split(' ');
    
    const mapped = spoken.map(word => ({
      text: word,
      isError: !expected.includes(word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""))
    }));
    this.spokenWords.set(mapped);
  }

  resetRecording() {
    this.analysis.set(null);
    this.isRecording.set(false);
    this.interimTranscript.set('');
  }

  onConfirm() {
    const a = this.analysis();
    const score = a?.fluencyScore || 0;
    const analysisPayload = {
      sessionId: this.turnState.sessionId,
      turnIndex: this.turnState.turnIndex,
      utteranceId: this.turnState.utterance.sequenceId,
      transcribedText: this.interimTranscript(),
      expectedText: this.turnState.utterance.englishText,
      fluencyScore: a?.fluencyScore || 0,
      confidenceScore: a?.confidenceScore || 0,
      speakingSpeedWpm: a?.speedWpm || 0,
      pauseCount: 0,
      hesitationWords: a?.hesitations || [],
      repeatedWords: [],
      grammarErrors: (a?.mistakes || []).filter(m => m.type === 'GRAMMAR').map(m => ({
        expectedPhrase: m.expected || '', spokenPhrase: m.actual || '', errorType: m.type, position: 0
      })),
      pronunciationIssues: (a?.mistakes || []).filter(m => m.type === 'PRONUNCIATION').map(m => ({
        word: m.word || '', expectedPhonetic: m.expected || '', issueNote: ''
      })),
      overallScore: score
    };
    this.liveSessionService.saveVoiceAnalysis(this.turnState.sessionId, analysisPayload).subscribe(() => {
      this.liveSessionService.shiftTurn(this.turnState.sessionId, {
        sessionId: this.turnState.sessionId,
        memberId: localStorage.getItem('gwf_userId'),
        turnIndex: this.turnState.turnIndex,
        analysisScore: score
      }).subscribe(() => {
        this.turnShifted.emit();
      });
    });
  }

  onReRead() {
    this.liveSessionService.requestReRead(this.turnState.sessionId).subscribe(() => {
      this.resetRecording();
    });
  }
}

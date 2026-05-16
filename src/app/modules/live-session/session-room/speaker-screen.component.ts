import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mic, MicOff, Check, RotateCcw, Volume2 } from 'lucide-angular';
import { TurnState, TurnService } from '@core/services/turn.service';

@Component({
  selector: 'app-speaker-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-500">
      <!-- Speaker Card -->
      <div class="text-center space-y-4">
         <span class="text-[10px] font-black uppercase tracking-[0.4em] text-ls-accent">Your Turn To Speak</span>
         <h1 class="text-4xl md:text-6xl font-black italic text-white tracking-tighter leading-tight drop-shadow-2xl">
            "{{ state.utterance.englishText }}"
         </h1>
      </div>

      <!-- Hint Section -->
      <div class="card bg-white/5 border-white/10 backdrop-blur-xl p-8 space-y-4">
         <div class="flex items-center gap-2 text-ls-accent text-[10px] font-black uppercase tracking-widest">
            <i-lucide [img]="VolumeIcon" size="14"></i-lucide>
            Context: {{ state.utterance.contextTag }} • {{ state.utterance.grammarTag }}
         </div>
         <p class="text-2xl font-bold italic text-white/50 leading-relaxed">
            {{ state.utterance.hintText }}
         </p>
      </div>

      <!-- Controls -->
      <div class="flex flex-col items-center gap-8">
         <div class="relative">
            <button 
              (click)="toggleRecording()"
              [class.bg-ls-error]="isRecording"
              [class.bg-ls-primary]="!isRecording"
              class="w-24 h-24 rounded-[40px] flex items-center justify-center text-white shadow-2xl transition-all active:scale-90"
            >
               <i-lucide [img]="isRecording ? MicOffIcon : MicIcon" size="40"></i-lucide>
            </button>
            <div *ngIf="isRecording" class="absolute inset-0 bg-ls-error rounded-[40px] animate-ping opacity-20"></div>
         </div>

         <div *ngIf="analysisResult" class="flex flex-col items-center gap-6 animate-in slide-in-from-top-4">
            <div class="flex items-center gap-4">
               <div class="text-center">
                  <p class="text-[8px] font-black uppercase tracking-widest text-[#EAEAEA]/40">Fluency</p>
                  <p class="text-3xl font-black italic">{{ analysisResult.fluency }}%</p>
               </div>
               <div class="w-px h-8 bg-white/10"></div>
               <div class="text-center">
                  <p class="text-[8px] font-black uppercase tracking-widest text-[#EAEAEA]/40">Confidence</p>
                  <p class="text-3xl font-black italic">{{ analysisResult.confidence }}%</p>
               </div>
            </div>

            <div class="flex gap-4">
               <button (click)="resetAnalysis()" class="px-8 h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[#EAEAEA] flex items-center gap-2 hover:bg-white/10 transition-all">
                  <i-lucide [img]="ResetIcon" size="18"></i-lucide>
                  Retry
               </button>
               <button (click)="submitTurn()" class="px-8 h-14 bg-ls-success text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-ls-success/20 active:scale-95 transition-all">
                  <i-lucide [img]="CheckIcon" size="18"></i-lucide>
                  Confirm Turn
               </button>
            </div>
         </div>
      </div>
    </div>
  `,
  styles: []
})
export class SpeakerScreenComponent {
  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;
  readonly CheckIcon = Check;
  readonly ResetIcon = RotateCcw;
  readonly VolumeIcon = Volume2;

  @Input() state!: TurnState;
  @Output() completed = new EventEmitter<void>();
  @Output() sessionEnded = new EventEmitter<void>();

  isRecording = false;
  analysisResult: any = null;

  constructor(private turnService: TurnService) {}

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (!this.isRecording) {
      // Simulate analysis end
      this.analyzeVoice();
    }
  }

  analyzeVoice() {
    this.analysisResult = {
      fluency: 88,
      confidence: 94,
      transcribedText: "I have been working here for five years."
    };

    this.turnService.submitVoiceAnalysis(this.state.sessionId, this.analysisResult).subscribe();
  }

  resetAnalysis() {
    this.analysisResult = null;
    this.turnService.requestReRead(this.state.sessionId).subscribe();
  }

  submitTurn() {
    this.turnService.shiftTurn(this.state.sessionId).subscribe(res => {
      // If turnIndex equals totalTurns, it's the last turn
      if (res && res.turnIndex >= res.totalTurns) {
        this.sessionEnded.emit();
      } else {
        this.completed.emit();
      }
    });
    this.analysisResult = null;
  }
}

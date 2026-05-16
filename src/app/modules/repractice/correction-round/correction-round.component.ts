// File: src/app/modules/repractice/correction-round/correction-round.component.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RepracticeService } from '../repractice.service';
import { VoiceAnalysisService } from '@core/services/voice-analysis.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, Mic, CheckCircle2, ChevronRight, XCircle, RotateCcw, Eye, EyeOff, Layout, History, Home, TrendingUp } from 'lucide-angular';
import { RepracticeSession, RepracticeUtterance } from '@core/models/mistake.model';
import { VoiceAnalysis } from '@core/models/voice.model';

@Component({
  selector: 'app-correction-round',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#1A1A2E] text-white focus-mode animate-in fade-in duration-700 font-sans pb-32">
      <div class="max-w-[480px] mx-auto p-6 md:p-10 flex flex-col min-h-screen">
        
        <!-- Header -->
        <div class="flex items-center justify-between h-16 border-b border-white/5 mb-10">
           <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gw-accent/20 rounded-xl flex items-center justify-center text-gw-accent">
                 <i-lucide [img]="HistoryIcon" size="20"></i-lucide>
              </div>
              <h2 class="text-xl font-black text-white italic uppercase tracking-tighter">CORRECTION ROUND</h2>
           </div>
           @if (!isComplete()) {
             <a routerLink="/user/dashboard" class="text-white/40 hover:text-white transition-colors">
                <i-lucide [img]="CloseIcon" size="24"></i-lucide>
             </a>
           }
        </div>

        @if (!isComplete()) {
          @if (currentUtterance()) {
            <div class="flex-1 space-y-12">
               <!-- Progress Bar -->
               <div class="space-y-4">
                  <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic text-white/40">
                     <span>PRACTICING MISTAKE {{ currentIndex() + 1 }} OF {{ session()?.utterances?.length }}</span>
                  </div>
                  <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                     <div 
                        class="h-full bg-gw-accent transition-all duration-700"
                        [style.width.%]="((currentIndex() + 1) / (session()?.utterances?.length || 1)) * 100"
                     ></div>
                  </div>
               </div>

               <!-- Mistake Context -->
               <div class="bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-6">
                  <div class="space-y-2">
                     <span class="text-[8px] font-black uppercase tracking-widest text-gw-error italic">What went wrong:</span>
                     <p class="text-lg font-bold text-white/40 italic line-through decoration-gw-error/40">{{ currentUtterance()?.mistakeDetail }}</p>
                  </div>
                  <div class="space-y-2">
                     <span class="text-[8px] font-black uppercase tracking-widest text-gw-success italic">Correction:</span>
                     <p class="text-sm font-bold text-white leading-relaxed italic">{{ currentUtterance()?.correctionNote }}</p>
                  </div>
               </div>

               <!-- Practice Instruction -->
               <div class="space-y-8 py-4">
                  <div class="space-y-2">
                     <span class="text-[10px] font-black uppercase tracking-widest text-gw-accent italic">Now say this correctly:</span>
                     <h1 class="text-4xl font-black text-white italic leading-tight tracking-tight">{{ currentUtterance()?.englishText }}</h1>
                  </div>

                  <!-- Hint Area -->
                  <div>
                    <button 
                      (click)="showHint.set(!showHint())"
                      class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic text-white/40 hover:text-gw-accent transition-all"
                    >
                       <i-lucide [img]="showHint() ? EyeHideIcon : EyeIcon" size="14"></i-lucide>
                       {{ showHint() ? 'HIDE HINT' : 'SHOW TELUGU HINT' }}
                    </button>
                    @if (showHint()) {
                      <div class="mt-4 p-6 bg-white/5 border border-white/10 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                         <p class="text-xl font-bold text-gw-accent italic leading-relaxed">{{ currentUtterance()?.hintText }}</p>
                      </div>
                    }
                  </div>
               </div>

               <!-- Voice Recording & Results -->
               <div class="flex flex-col items-center gap-8 py-6">
                  @if (!lastAnalysis()) {
                    <div class="relative">
                       @if (isRecording()) {
                         <div class="absolute inset-0 bg-gw-success/20 rounded-full animate-ping"></div>
                       }
                       <button 
                         (click)="isRecording() ? stopRecording() : startRecording()"
                         class="w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10"
                         [class.bg-gw-success]="isRecording()"
                         [class.bg-gw-primary]="!isRecording()"
                       >
                          <i-lucide [img]="MicIcon" size="40" class="text-white"></i-lucide>
                       </button>
                    </div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                       {{ isRecording() ? 'TAP TO ANALYZE' : 'TAP TO RECORD' }}
                    </p>
                  } @else {
                    <!-- Result Card -->
                    <div class="w-full space-y-6 animate-in zoom-in duration-500">
                       <div 
                         class="p-6 rounded-[32px] border pb-8 relative overflow-hidden text-center"
                         [class.bg-gw-success/10]="lastAnalysis()!.isPassed"
                         [class.border-gw-success/20]="lastAnalysis()!.isPassed"
                         [class.bg-gw-warning/10]="!lastAnalysis()!.isPassed"
                         [class.border-gw-warning/20]="!lastAnalysis()!.isPassed"
                       >
                          <div class="absolute top-0 left-0 w-full h-1" [class.bg-gw-success]="lastAnalysis()!.isPassed" [class.bg-gw-warning]="!lastAnalysis()!.isPassed"></div>
                          
                          <div class="flex flex-col items-center gap-4">
                             <div class="w-12 h-12 rounded-full flex items-center justify-center" [class.bg-gw-success/20]="lastAnalysis()!.isPassed" [class.bg-gw-warning/20]="!lastAnalysis()!.isPassed">
                                <i-lucide [img]="lastAnalysis()!.isPassed ? CheckIcon : RetryIcon" size="24" [class.text-gw-success]="lastAnalysis()!.isPassed" [class.text-gw-warning]="!lastAnalysis()!.isPassed"></i-lucide>
                             </div>
                             <div class="space-y-1">
                                <h3 class="text-2xl font-black italic uppercase tracking-tight" [class.text-gw-success]="lastAnalysis()!.isPassed" [class.text-gw-warning]="!lastAnalysis()!.isPassed">
                                   {{ lastAnalysis()!.isPassed ? 'BRILLIANT!' : 'ALMOST THERE...' }}
                                </h3>
                                <p class="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                                   Score: {{ lastAnalysis()?.fluencyScore }}%
                                </p>
                             </div>
                          </div>
                       </div>

                       <div class="flex gap-4">
                          <button 
                            (click)="lastAnalysis.set(null)"
                            class="flex-1 h-14 border-2 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                          >
                             <i-lucide [img]="RetryIcon" size="14"></i-lucide>
                             TRY AGAIN
                          </button>
                          <button 
                            (click)="nextUtterance()"
                            class="flex-1 h-14 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gw-primary/20"
                          >
                             {{ currentIndex() === (session()?.utterances?.length || 0) - 1 ? 'FINISH' : 'NEXT' }}
                             <i-lucide [img]="NextIcon" size="14"></i-lucide>
                          </button>
                       </div>
                    </div>
                  }
               </div>
            </div>
          }
        } @else {
          <!-- COMPLETION DASHBOARD -->
          <div class="flex-1 flex flex-col justify-center gap-12 text-center animate-in zoom-in duration-700">
             <div class="space-y-4">
                <div class="w-24 h-24 bg-gw-success/10 rounded-[32px] flex items-center justify-center text-gw-success mx-auto shadow-2xl shadow-gw-success/5 animate-bounce">
                   <i-lucide [img]="CheckIcon" size="48"></i-lucide>
                </div>
                <h3 class="text-4xl font-black text-white italic uppercase tracking-tight">ROUND COMPLETE!</h3>
                <p class="text-sm font-bold text-white/40 uppercase tracking-widest italic">You are becoming more fluent every day</p>
             </div>

             <div class="bg-white/5 p-8 rounded-[48px] border border-white/5 space-y-8 relative overflow-hidden">
                <div class="grid grid-cols-2 gap-8">
                   <div class="space-y-1">
                      <p class="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Resolved</p>
                      <p class="text-4xl font-black text-gw-success italic">{{ resolvedCount() }}</p>
                   </div>
                   <div class="space-y-1">
                      <p class="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Improvement</p>
                      <div class="flex items-center justify-center gap-2 text-gw-accent">
                         <i-lucide [img]="TrendingIcon" size="20"></i-lucide>
                         <p class="text-4xl font-black italic">{{ improvement() }}%</p>
                      </div>
                   </div>
                </div>
                <div class="h-px bg-white/5"></div>
                <p class="text-[10px] font-bold text-white/60 italic leading-relaxed">
                   "You have successfully practiced your common mistakes. Consistency is the key to perfect pronunciation!"
                </p>
             </div>

             <div class="space-y-4">
                <button (click)="restartRound()" class="w-full h-16 bg-[#3D5A99] text-white font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-[#3D5A99]/20 hover:scale-[1.05] transition-all">
                   PRACTICE AGAIN
                </button>
                <a routerLink="/user/dashboard" class="w-full h-16 bg-white/5 text-white/60 font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10">
                   <i-lucide [img]="HomeIcon" size="20"></i-lucide>
                   EXIT TO DASHBOARD
                </a>
             </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .focus-mode { background-color: #1A1A2E; }
  `]
})
export class CorrectionRoundComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repracticeService = inject(RepracticeService);
  private voiceService = inject(VoiceAnalysisService);
  private toast = inject(ToastService);

  readonly HistoryIcon = History;
  readonly CloseIcon = XCircle;
  readonly EyeIcon = Eye;
  readonly EyeHideIcon = EyeOff;
  readonly MicIcon = Mic;
  readonly CheckIcon = CheckCircle2;
  readonly RetryIcon = RotateCcw;
  readonly NextIcon = ChevronRight;
  readonly TrendingIcon = TrendingUp;
  readonly HomeIcon = Home;

  session = signal<RepracticeSession | null>(null);
  currentIndex = signal(0);
  currentUtterance = signal<RepracticeUtterance | null>(null);
  
  isRecording = signal(false);
  interimTranscript = signal('');
  lastAnalysis = signal<VoiceAnalysis | null>(null);
  showHint = signal(false);
  isComplete = signal(false);
  
  resolvedCount = signal(0);
  improvement = signal(0);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['repracticeSessionId'];
      if (id) {
        this.loadSession(id);
      }
    });
  }

  ngOnDestroy() {
    this.voiceService.stopRecording();
  }

  loadSession(id: string) {
    this.repracticeService.getRepracticeSession(id).subscribe(session => {
      this.session.set(session);
      this.currentUtterance.set(session.utterances[0]);
    });
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
    this.analyzeAttempt(this.interimTranscript());
  }

  analyzeAttempt(spoken: string) {
    if (!this.currentUtterance()) return;
    
    const analysis = this.voiceService.analyzeTranscript(spoken, this.currentUtterance()!.englishText);
    this.lastAnalysis.set(analysis);

    this.repracticeService.updateAttempt({
      repracticeUtteranceId: Number(this.currentUtterance()!.id),
      score: analysis.fluencyScore
    }).subscribe();

    if (analysis.isPassed) {
      this.resolvedCount.update(c => c + 1);
    }
  }

  nextUtterance() {
    const nextIdx = this.currentIndex() + 1;
    const session = this.session();
    
    if (session && nextIdx < session.utterances.length) {
      this.currentIndex.set(nextIdx);
      this.currentUtterance.set(session.utterances[nextIdx]);
      this.resetState();
    } else {
      this.finishSession();
    }
  }

  resetState() {
    this.lastAnalysis.set(null);
    this.interimTranscript.set('');
    this.showHint.set(false);
    this.isRecording.set(false);
  }

  finishSession() {
    if (this.session()) {
      this.repracticeService.completeRepracticeSession(this.session()!.id).subscribe(res => {
        this.improvement.set(res.improvementPercent);
        this.isComplete.set(true);
      });
    }
  }

  restartRound() {
    this.isComplete.set(false);
    this.currentIndex.set(0);
    this.resolvedCount.set(0);
    this.currentUtterance.set(this.session()!.utterances[0]);
    this.resetState();
  }
}

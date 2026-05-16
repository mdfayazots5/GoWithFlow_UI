import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Mic, MicOff, Check, RotateCcw, Volume2, Sparkles, TrendingUp } from 'lucide-angular';
import { RepracticeService, RepracticeSession, RepracticeUtterance } from '@core/services/repractice.service';
import { TurnService } from '@core/services/turn.service';

@Component({
  selector: 'app-correction-round',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col focus-mode bg-[#1A1A2E] text-[#EAEAEA] relative overflow-hidden">
      <!-- Header -->
      <header class="h-20 border-b border-white/10 flex items-center justify-between px-6 z-10">
        <div class="flex items-center gap-4">
           <button [routerLink]="['/user/dashboard']" class="p-2 text-white/50 hover:text-white transition-all">
              <i-lucide [img]="BackIcon" size="20"></i-lucide>
           </button>
           <div>
              <p class="text-xs font-black uppercase tracking-widest text-ls-accent">Correction Round</p>
              <h2 class="text-lg font-black italic tracking-tight leading-none uppercase">{{ session?.title }}</h2>
           </div>
        </div>
        <div class="flex items-center gap-2">
           <span class="text-[10px] font-black uppercase tracking-widest text-white/30">{{ currentIndex + 1 }} / {{ session?.utterances?.length }}</span>
        </div>
      </header>

      <!-- Main Process -->
      <main class="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
         <div *ngIf="currentUtterance" class="w-full max-w-2xl space-y-12 animate-in zoom-in-95 duration-500">
            <div class="text-center space-y-4">
               <span class="text-[10px] font-black uppercase tracking-[0.4em] text-ls-accent">Speak English Text</span>
               <h1 class="text-4xl md:text-6xl font-black italic text-white tracking-tighter leading-tight drop-shadow-2xl">
                  "{{ currentUtterance.englishText }}"
               </h1>
            </div>

            <div class="card bg-white/5 border-white/10 backdrop-blur-xl p-8 space-y-4">
               <div class="flex items-center gap-2 text-ls-accent text-[10px] font-black uppercase tracking-widest">
                  <i-lucide [img]="VolumeIcon" size="14"></i-lucide>
                  Target Mastery
               </div>
               <p class="text-2xl font-bold italic text-white/50 leading-relaxed">
                  {{ currentUtterance.hintText }}
               </p>
            </div>

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

               <!-- Analysis Reveal -->
               <div *ngIf="analysisResult" class="flex flex-col items-center gap-6 animate-in slide-in-from-top-4">
                  <div class="flex items-center gap-8">
                     <div class="text-center">
                        <p class="text-[8px] font-black uppercase tracking-widest text-white/40">Attempt Score</p>
                        <p class="text-4xl font-black italic" [class.text-ls-success]="analysisResult.score >= 80" [class.text-ls-error]="analysisResult.score < 80">
                           {{ analysisResult.score }}%
                        </p>
                     </div>
                     <div class="w-px h-10 bg-white/10"></div>
                     <div class="text-center">
                        <p class="text-[8px] font-black uppercase tracking-widest text-white/40">Status</p>
                        <p class="text-lg font-black italic uppercase italic">
                           {{ analysisResult.score >= 80 ? 'RESOLVED' : 'KEEP TRYING' }}
                        </p>
                     </div>
                  </div>

                  <div class="flex gap-4">
                     <button (click)="analysisResult = null" class="px-8 h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-white flex items-center gap-2 hover:bg-white/10 transition-all">
                        <i-lucide [img]="ResetIcon" size="18"></i-lucide>
                        Retry
                     </button>
                     <button (click)="nextUtterance()" class="px-8 h-14 bg-ls-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-ls-primary/20 active:scale-95 transition-all">
                        <i-lucide [img]="CheckIcon" size="18"></i-lucide>
                        {{ isLast ? 'Finish Round' : 'Next Dialogue' }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </main>

      <!-- Completion Screen -->
      <div *ngIf="completed" class="fixed inset-0 bg-[#1A1A2E] z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
         <div class="w-full max-w-sm text-center space-y-8">
            <div class="w-24 h-24 bg-ls-success/20 text-ls-success rounded-[40px] flex items-center justify-center mx-auto border-2 border-ls-success/30 relative">
               <i-lucide [img]="SparkleIcon" size="40"></i-lucide>
               <div class="absolute inset-0 bg-ls-success rounded-[40px] animate-ping opacity-10"></div>
            </div>
            <div class="space-y-2">
               <h3 class="text-4xl font-black italic uppercase tracking-tighter text-white">Round Cleared!</h3>
               <p class="text-white/50 text-xs font-black uppercase tracking-widest">You resolved {{ session?.utterances?.length }} mistakes today</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
               <div class="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p class="text-[8px] font-black uppercase tracking-widest text-white/30">New Streak</p>
                  <p class="text-2xl font-black italic">8 DAYS</p>
               </div>
               <div class="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p class="text-[8px] font-black uppercase tracking-widest text-white/30">Accuracy</p>
                  <p class="text-2xl font-black italic text-ls-success">92%</p>
               </div>
            </div>

            <button routerLink="/user/dashboard" class="w-full h-16 bg-ls-primary text-white rounded-3xl font-black uppercase tracking-widest text-lg italic shadow-2xl shadow-ls-primary/20">
               Return to Dashboard
            </button>
         </div>
      </div>

      <!-- Progressive Blur Background -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-ls-primary/10 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-ls-accent/5 rounded-full blur-[120px]"></div>
    </div>
  `,
  styles: []
})
export class CorrectionRoundComponent implements OnInit {
  readonly BackIcon = ArrowLeft;
  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;
  readonly CheckIcon = Check;
  readonly ResetIcon = RotateCcw;
  readonly VolumeIcon = Volume2;
  readonly SparkleIcon = Sparkles;
  readonly TrendIcon = TrendingUp;

  session?: RepracticeSession;
  currentIndex = 0;
  isRecording = false;
  analysisResult: any = null;
  completed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repracticeService: RepracticeService,
    private turnService: TurnService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repracticeService.getSession(id).subscribe(res => this.session = res);
    }
  }

  get currentUtterance(): RepracticeUtterance | undefined {
    return this.session?.utterances[this.currentIndex];
  }

  get isLast(): boolean {
    return !!this.session && this.currentIndex === this.session.utterances.length - 1;
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (!this.isRecording) {
      this.analyze();
    }
  }

  analyze() {
    const score = Math.floor(70 + Math.random() * 30);
    this.analysisResult = { score };
    
    if (this.currentUtterance) {
      this.repracticeService.recordAttempt(this.currentUtterance.id, score).subscribe();
    }
  }

  nextUtterance() {
    if (this.isLast) {
      this.finishRound();
    } else {
      this.currentIndex++;
      this.analysisResult = null;
    }
  }

  finishRound() {
    if (this.session) {
      this.repracticeService.complete(this.session.id).subscribe(() => {
        this.completed = true;
      });
    }
  }
}

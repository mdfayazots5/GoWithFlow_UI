import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ThumbsUp, MessageSquare, AlertCircle, Sparkles, RotateCcw } from 'lucide-angular';
import { TurnState, TurnService } from '@core/services/turn.service';
import { WebsocketService } from '@core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listener-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="w-full max-w-xl space-y-12 animate-in slide-in-from-bottom-10 duration-700">
      <!-- Re-read Notice -->
      <div *ngIf="showReReadNotice" class="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4">
         <div class="px-6 py-3 bg-ls-accent text-white rounded-full flex items-center gap-3 shadow-2xl shadow-ls-accent/40 font-black italic uppercase tracking-widest text-sm">
            <i-lucide [img]="ResetIcon" size="18" class="animate-spin duration-700"></i-lucide>
            Speaker is re-reading...
         </div>
      </div>

      <!-- Waiting Visual -->
      <div class="flex flex-col items-center gap-8 text-center">
         <div class="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-ls-primary border border-white/10 relative">
            <i-lucide [img]="SparkleIcon" size="40" class="animate-pulse"></i-lucide>
            <div class="absolute -right-2 -top-2 w-6 h-6 bg-ls-accent text-white rounded-full flex items-center justify-center">
               <span class="text-[8px] font-black italic">!</span>
            </div>
         </div>
         
         <div class="space-y-2">
            <h2 class="text-3xl font-black italic uppercase tracking-tighter text-white">Listening Mode</h2>
            <p class="text-xs font-black uppercase tracking-[0.3em] text-white/30">
               <span class="text-ls-accent">{{ state.utterance.speakerLabel }}</span> is speaking now
            </p>
         </div>
      </div>

      <!-- Current Utterance Preview -->
      <div class="card bg-white/5 border-white/10 backdrop-blur-md p-8 text-center border-dashed">
         <p class="text-2xl font-bold italic text-white/20">
            "{{ state.utterance.englishText }}"
         </p>
      </div>

      <!-- Interaction Pad -->
      <div class="space-y-4">
         <p class="text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Send Quick Feedback</p>
         <div class="grid grid-cols-3 gap-4">
            <button 
              (click)="sendFeedback('Good')"
              class="h-20 bg-ls-bg/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-ls-success/20 hover:border-ls-success/30 transition-all group"
            >
               <i-lucide [img]="LikeIcon" size="24" class="text-ls-success group-hover:scale-110 transition-all"></i-lucide>
               <span class="text-[8px] font-black uppercase tracking-widest text-[#EAEAEA]/50">Good!</span>
            </button>

            <button 
               (click)="sendFeedback('Mistake')"
               class="h-20 bg-ls-bg/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-ls-accent/20 hover:border-ls-accent/30 transition-all group"
            >
               <i-lucide [img]="AlertIcon" size="24" class="text-ls-accent group-hover:shake transition-all"></i-lucide>
               <span class="text-[8px] font-black uppercase tracking-widest text-[#EAEAEA]/50">Correction</span>
            </button>

            <button 
               (click)="sendFeedback('Unclear')"
               class="h-20 bg-ls-bg/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all group"
            >
               <i-lucide [img]="MessageIcon" size="24" class="text-blue-400 group-hover:-translate-y-1 transition-all"></i-lucide>
               <span class="text-[8px] font-black uppercase tracking-widest text-[#EAEAEA]/50">Unclear</span>
            </button>
         </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }
    .group-hover\\:shake {
      animation: shake 0.2s infinite;
    }
  `]
})
export class ListenerScreenComponent implements OnInit, OnDestroy {
  readonly LikeIcon = ThumbsUp;
  readonly AlertIcon = AlertCircle;
  readonly MessageIcon = MessageSquare;
  readonly SparkleIcon = Sparkles;
  readonly ResetIcon = RotateCcw;

  @Input() state!: TurnState;
  showReReadNotice = false;
  private subs = new Subscription();

  constructor(
    private turnService: TurnService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.subs.add(this.wsService.on('RE_READ_REQUESTED').subscribe(() => {
      this.showReReadNotice = true;
      setTimeout(() => this.showReReadNotice = false, 3000);
    }));
  }

  sendFeedback(tag: string) {
    this.turnService.submitListenerFeedback(this.state.sessionId, {
      turnIndex: this.state.turnIndex,
      targetUserId: this.state.activeMemberId,
      feedbackTag: tag
    }).subscribe();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}

// File: src/app/modules/live-session/listener-screen/listener-screen.component.ts
import { Component, Input, inject, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState } from '@core/models/voice.model';
import { LucideAngularModule, Mic, ThumbsUp, HelpCircle, AlertTriangle, MessageCircle, Info } from 'lucide-angular';
import { LiveSessionService } from '../live-session.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-listener-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-16 animate-in fade-in duration-700">
      <!-- Speaker Indicator -->
      <div class="flex flex-col items-center gap-6">
         <div class="relative">
            <div class="absolute inset-0 bg-[#3D5A99]/20 rounded-full animate-pulse-slow"></div>
            <div class="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-gw-primary p-1 bg-[#1A1A2E] relative z-10">
               <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + turnState.activeMemberName" class="w-full h-full object-cover rounded-2xl">
               <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-gw-primary rounded-full flex items-center justify-center border-4 border-[#1A1A2E]">
                  <i-lucide [img]="MicIcon" size="14" class="text-white"></i-lucide>
               </div>
            </div>
         </div>
         
         <div class="text-center space-y-2">
            <h3 class="text-2xl font-black text-white italic uppercase tracking-tight">{{ turnState.activeMemberName }} is speaking</h3>
            <p class="text-[10px] font-black uppercase tracking-widest text-[#E07B39] italic animate-pulse">Live Session Active</p>
         </div>
      </div>

      <!-- Current Sentence (Dimmed) -->
      <div class="p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
         <div class="flex justify-between items-center">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Currently Reading</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-white/20 italic">{{ turnState.utterance.grammarTag }}</span>
         </div>
         <p class="text-2xl font-black text-white/60 italic leading-relaxed tracking-tight">
            "{{ turnState.utterance.englishText }}"
         </p>
      </div>

      <!-- Quick Feedback Panel -->
      <div class="space-y-6">
         <p class="text-center text-[10px] font-black uppercase tracking-widest text-white/40 italic">Give Quick Feedback</p>
         <div class="grid grid-cols-2 gap-4">
            @for (action of feedbackActions; track action.label) {
              <button 
                (click)="sendFeedback(action.tag)"
                class="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border-2 border-transparent hover:border-gw-primary/20 hover:bg-white/10 active:scale-95 transition-all gap-2 group"
                [class.flash]="lastAction() === action.tag"
              >
                 <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-gw-primary/20 transition-all">
                    <i-lucide [img]="action.icon" size="20"></i-lucide>
                 </div>
                 <span class="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white text-center">{{ action.label }}</span>
              </button>
            }
         </div>
      </div>

      <!-- Turn Queue -->
      <div class="bg-[#12121A] p-6 rounded-3xl border border-white/5 flex items-center justify-between">
         <div class="flex items-center gap-3">
            <i-lucide [img]="InfoIcon" size="18" class="text-gw-primary"></i-lucide>
            <span class="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Waiting...</span>
         </div>
         <span class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic">Your turn is next</span>
      </div>

      @if (showReReadBanner) {
        <div class="p-4 bg-[#E07B39]/10 border border-[#E07B39]/30 rounded-2xl text-center animate-in fade-in duration-300">
          <span class="text-[10px] font-black uppercase tracking-widest text-[#E07B39] italic">Re-reading...</span>
        </div>
      }
      @if (listenerTagFlash) {
        <div class="p-4 bg-gw-primary/10 border border-gw-primary/30 rounded-2xl text-center animate-in fade-in duration-300">
          <span class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic">{{ listenerTagFlash }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 0.1; }
      50% { transform: scale(3); opacity: 0; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 3s infinite ease-out;
    }
    .flash {
      background-color: rgba(61, 90, 153, 0.4) !important;
      border-color: #3D5A99 !important;
    }
  `]
})
export class ListenerScreenComponent {
  @Input({ required: true }) turnState!: TurnState;
  @Input() showReReadBanner = false;
  @Input() listenerTagFlash: string | null = null;

  private liveSessionService = inject(LiveSessionService);
  private toast = inject(ToastService);

  readonly MicIcon = Mic;
  readonly InfoIcon = Info;
  
  lastAction = signal<string | null>(null);

  feedbackActions = [
    { label: 'GOOD', tag: 'Good', icon: ThumbsUp },
    { label: 'HESITATED', tag: 'Hesitated', icon: HelpCircle },
    { label: 'MISTAKE', tag: 'Mistake', icon: AlertTriangle },
    { label: 'UNCLEAR', tag: 'Unclear Pronunciation', icon: MessageCircle }
  ];

  sendFeedback(tag: string) {
    this.lastAction.set(tag);
    this.liveSessionService.submitListenerFeedback(this.turnState.sessionId, {
      sessionId: this.turnState.sessionId,
      turnIndex: this.turnState.turnIndex,
      targetUserId: this.turnState.activeMemberId,
      feedbackTag: tag
    }).subscribe(() => {
      setTimeout(() => this.lastAction.set(null), 300);
    });
  }
}

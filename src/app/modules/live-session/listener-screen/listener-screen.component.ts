// File: src/app/modules/live-session/listener-screen/listener-screen.component.ts
import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnState } from '@core/models/voice.model';
import { LucideAngularModule, Mic, ThumbsUp, HelpCircle, AlertTriangle, MessageCircle, Volume2 } from 'lucide-angular';
import { LiveSessionService } from '../live-session.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';

@Component({
  selector: 'app-listener-screen',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-5 pb-4 animate-in fade-in duration-500">

      <!-- Turn Progress -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-black uppercase tracking-widest text-white/30 italic">
            Turn {{ turnState.turnIndex }} of {{ turnState.totalTurns }}
          </span>
          <span class="px-2.5 py-1 bg-[#E07B39]/15 text-[#E07B39] text-[9px] font-black uppercase tracking-wider rounded-full italic">
            {{ turnState.utterance.grammarTag }}
          </span>
        </div>
        <div class="h-1 bg-white/8 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#3D5A99] rounded-full transition-all duration-700"
            [style.width.%]="(turnState.turnIndex / turnState.totalTurns) * 100">
          </div>
        </div>
      </div>

      <!-- Speaker Identity -->
      <div class="flex flex-col items-center gap-4 py-4">
        <div class="relative flex items-center justify-center w-32 h-32">
          <div class="absolute w-32 h-32 rounded-full border border-[#3D5A99]/20 ring-pulse-outer"></div>
          <div class="absolute w-24 h-24 rounded-full border border-[#3D5A99]/35 ring-pulse-inner"></div>
          <div class="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-[#3D5A99] relative z-10 shadow-2xl shadow-[#3D5A99]/30">
            <img
              [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + turnState.activeMemberName"
              class="w-full h-full object-cover"
            >
          </div>
          <div class="absolute bottom-1 right-1 z-20 w-7 h-7 bg-[#3D5A99] rounded-full flex items-center justify-center border-2 border-[#1A1A2E]">
            <i-lucide [img]="MicIcon" size="12" class="text-white"></i-lucide>
          </div>
        </div>

        <div class="text-center space-y-1.5">
          <h2 class="text-2xl font-black text-white italic uppercase tracking-tight leading-none">
            {{ turnState.activeMemberName }}
          </h2>
          <div class="flex items-center justify-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#E07B39] animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-[#E07B39] italic">Speaking Now</span>
          </div>
          @if (voiceBroadcast.isReceivingAudio()) {
            <div class="flex items-center justify-center gap-1.5 px-3 py-1 bg-[#34d399]/15 border border-[#34d399]/30 rounded-full animate-in fade-in duration-300">
              <i-lucide [img]="VolumeIcon" size="11" class="text-[#34d399]"></i-lucide>
              <span class="text-[9px] font-black uppercase tracking-widest text-[#34d399] italic">Live Audio</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse"></span>
            </div>
          }
        </div>

        <!-- Sound Wave -->
        <div class="flex items-end gap-1 h-6">
          <div class="w-1.5 rounded-full bg-[#3D5A99]/70 wave-bar" style="animation-delay:0ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/70 wave-bar" style="animation-delay:160ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/70 wave-bar" style="animation-delay:320ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/80 wave-bar" style="animation-delay:80ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/70 wave-bar" style="animation-delay:240ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/60 wave-bar" style="animation-delay:400ms"></div>
          <div class="w-1.5 rounded-full bg-[#3D5A99]/70 wave-bar" style="animation-delay:50ms"></div>
        </div>
      </div>

      <!-- Utterance Card -->
      <div class="bg-white/5 rounded-[24px] border border-white/8 p-5 space-y-3">
        <span class="text-[9px] font-black uppercase tracking-widest text-white/25 italic">Currently Reading</span>
        <p class="text-xl font-black text-white/75 italic leading-relaxed tracking-tight">
          "{{ turnState.utterance.englishText }}"
        </p>
      </div>

      <!-- Inline Banners -->
      @if (showReReadBanner) {
        <div class="flex items-center gap-3 px-4 py-3 bg-[#E07B39]/10 border border-[#E07B39]/25 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E07B39] animate-pulse flex-shrink-0"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-[#E07B39] italic">Speaker is re-reading this turn</span>
        </div>
      }
      @if (listenerTagFlash) {
        <div class="flex items-center justify-center gap-2 px-4 py-3 bg-[#3D5A99]/15 border border-[#3D5A99]/30 rounded-2xl animate-in zoom-in duration-300">
          <span class="text-[10px] font-black uppercase tracking-widest text-[#3D5A99] italic">Sent: {{ listenerTagFlash }}</span>
        </div>
      }

      <!-- Quick Feedback -->
      <div class="space-y-3">
        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 italic text-center">Give Quick Feedback</p>
        <div class="grid grid-cols-2 gap-2.5">
          @for (action of feedbackActions; track action.label) {
            <button
              type="button"
              (click)="sendFeedback(action.tag)"
              class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 active:scale-95 text-left"
              [style.borderColor]="lastAction() === action.tag ? action.color : 'rgba(255,255,255,0.07)'"
              [style.backgroundColor]="lastAction() === action.tag ? action.color + '2a' : 'rgba(255,255,255,0.04)'"
            >
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                [style.backgroundColor]="action.color + '20'"
                [style.color]="action.color"
              >
                <i-lucide [img]="action.icon" size="16"></i-lucide>
              </div>
              <span class="text-[10px] font-black uppercase tracking-wider text-white/55 leading-tight">{{ action.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Your Turn Is Next -->
      <div class="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#3D5A99]/20 to-transparent border border-[#3D5A99]/25">
        <span class="w-2 h-2 rounded-full bg-[#3D5A99] animate-pulse flex-shrink-0"></span>
        <span class="text-[10px] font-black uppercase tracking-widest text-white/35 italic">Waiting...</span>
        <div class="flex-1"></div>
        <span class="text-[11px] font-black uppercase tracking-widest text-[#3D5A99] italic">Your Turn Is Next →</span>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    @keyframes ring-out {
      0%   { transform: scale(0.85); opacity: 0.6; }
      100% { transform: scale(1.15); opacity: 0; }
    }
    .ring-pulse-outer {
      animation: ring-out 2.8s ease-out infinite;
    }
    .ring-pulse-inner {
      animation: ring-out 2.8s ease-out infinite 0.6s;
    }

    @keyframes wave {
      0%, 100% { height: 4px; }
      50%       { height: 22px; }
    }
    .wave-bar {
      animation: wave 1.2s ease-in-out infinite;
    }
  `]
})
export class ListenerScreenComponent {
  @Input({ required: true }) turnState!: TurnState;
  @Input() showReReadBanner = false;
  @Input() listenerTagFlash: string | null = null;

  private liveSessionService = inject(LiveSessionService);
  readonly voiceBroadcast = inject(VoiceBroadcastService);

  readonly MicIcon = Mic;
  readonly VolumeIcon = Volume2;

  lastAction = signal<string | null>(null);

  feedbackActions = [
    { label: 'GOOD',      tag: 'Good',                 icon: ThumbsUp,      color: '#34d399' },
    { label: 'HESITATED', tag: 'Hesitated',             icon: HelpCircle,    color: '#fbbf24' },
    { label: 'MISTAKE',   tag: 'Mistake',               icon: AlertTriangle, color: '#f87171' },
    { label: 'UNCLEAR',   tag: 'Unclear Pronunciation', icon: MessageCircle, color: '#818cf8' },
  ];

  sendFeedback(tag: string) {
    this.lastAction.set(tag);
    this.liveSessionService.submitListenerFeedbackRealtime(
      this.turnState.sessionId,
      tag,
      this.turnState.turnIndex
    ).subscribe({
      next: () => setTimeout(() => this.lastAction.set(null), 800),
      error: () => this.lastAction.set(null)
    });
  }
}

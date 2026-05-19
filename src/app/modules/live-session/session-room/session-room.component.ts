import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveSessionService } from '../live-session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { SpeakerScreenComponent } from '../speaker-screen/speaker-screen.component';
import { ListenerScreenComponent } from '../listener-screen/listener-screen.component';
import { LucideAngularModule, LogOut, Clock, Activity, RefreshCw } from 'lucide-angular';
import { TurnState } from '@core/models/voice.model';
import { catchError, of } from 'rxjs';

type TurnShiftEvent = {
  newActiveMemberId: string | number;
  slotIndex: number;
  turnIndex: number;
  nextUtterance: TurnState['utterance'];
};

@Component({
  selector: 'app-session-room',
  standalone: true,
  imports: [CommonModule, SpeakerScreenComponent, ListenerScreenComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[#1A1A2E] text-white flex flex-col focus-mode animate-in fade-in duration-700">
      <!-- Top Bar -->
      <div class="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#121221]">
         <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-lg bg-gw-primary/20 flex items-center justify-center text-gw-primary">
               <i-lucide [img]="ActivityIcon" size="18"></i-lucide>
            </div>
            <div class="hidden md:block">
               <h4 class="text-xs font-black uppercase tracking-widest italic leading-tight">{{ turnState()?.utterance?.contextTag || 'SESSION' }}</h4>
               <p class="text-[10px] font-bold text-white/40 italic uppercase tracking-tighter">{{ sessionName() }}</p>
            </div>
         </div>

         <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
               <i-lucide [img]="TimerIcon" size="14" class="text-gw-accent"></i-lucide>
               <span class="text-xs font-black italic tabular-nums">{{ sessionTime() }}</span>
            </div>

            <button (click)="confirmLeave()" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-gw-error hover:bg-gw-error/10 transition-all">
               <i-lucide [img]="LeaveIcon" size="20"></i-lucide>
            </button>
         </div>
      </div>

      <!-- Main Container: Speaker or Listener -->
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-[480px] mx-auto p-6 md:p-10 min-h-full flex flex-col justify-center">
           @if (isLoading()) {
             <div class="flex flex-col items-center gap-4 py-20">
                <div class="w-12 h-12 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs font-black uppercase tracking-widest italic text-white/40">Synchronizing session...</p>
             </div>
           } @else if (loadError()) {
             <div class="flex flex-col items-center gap-6 py-20 text-center">
                <div class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <i-lucide [img]="RetryIcon" size="24" class="text-red-400"></i-lucide>
                </div>
                <div>
                  <p class="text-sm font-black uppercase tracking-widest italic text-white/60 mb-2">Session Error</p>
                  <p class="text-xs text-white/30 italic leading-relaxed max-w-xs">{{ loadError() }}</p>
                </div>
                <button (click)="retryLoad()"
                  class="px-6 py-3 bg-gw-primary rounded-xl font-black text-[10px] uppercase tracking-widest italic text-white flex items-center gap-2 hover:opacity-90 transition-all active:scale-95">
                  <i-lucide [img]="RetryIcon" size="14"></i-lucide>
                  Retry
                </button>
             </div>
           } @else if (isSpeaker()) {
             <app-speaker-screen
               [turnState]="turnState()!"
               (turnShifted)="onTurnShifted()"
             ></app-speaker-screen>
           } @else {
             <app-listener-screen
               [turnState]="turnState()!"
               [showReReadBanner]="showReReadBanner()"
               [listenerTagFlash]="listenerTagFlash()"
             ></app-listener-screen>
           }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .focus-mode { font-family: 'Inter', sans-serif; }
  `]
})
export class SessionRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private liveSessionService = inject(LiveSessionService);
  private authService = inject(AuthService);
  private ws = inject(WebsocketService);

  readonly ActivityIcon = Activity;
  readonly TimerIcon = Clock;
  readonly LeaveIcon = LogOut;
  readonly RetryIcon = RefreshCw;

  turnState = signal<TurnState | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSpeaker = signal(false);
  sessionName = signal('Live Session');
  sessionTime = signal('00:00');
  showReReadBanner = signal(false);
  listenerTagFlash = signal<string | null>(null);

  private timeSeconds = 0;
  private timerInterval: any;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const sessionId = params['sessionId'];
      if (sessionId) {
        this.initSession(sessionId);
        this.startTimer(sessionId);
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.ws.disconnect();
  }

  private initSession(sessionId: string) {
    this.isLoading.set(true);
    const user = this.authService.currentUser;

    this.ws.connect(sessionId, user?.id || '', 'live-session');
    this.loadCurrentTurn(sessionId);

    this.ws.on('TURN_SHIFT').subscribe((shiftEvent: TurnShiftEvent) => {
      this.handleTurnShift(sessionId, shiftEvent);
    });

    this.ws.on('LISTENER_TAG').subscribe((tagData: { feedbackTag: string }) => {
      this.listenerTagFlash.set(tagData.feedbackTag);
      setTimeout(() => this.listenerTagFlash.set(null), 2000);
    });

    this.ws.on('RE_READ_REQUESTED').subscribe(() => {
      this.showReReadBanner.set(true);
      setTimeout(() => this.showReReadBanner.set(false), 5000);
    });

    this.ws.on('SESSION_ENDED').subscribe(() => {
      sessionStorage.removeItem(`gwf_session_start_${sessionId}`);
      this.router.navigate(['/session/report', sessionId]);
    });
  }

  private loadCurrentTurn(sessionId: string) {
    this.loadError.set(null);
    this.liveSessionService.getCurrentTurn(sessionId).pipe(
      catchError(err => {
        const msg = err?.error?.message || err?.error?.errors?.[0] || 'Failed to load session turn. Please retry.';
        this.loadError.set(msg);
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(state => {
      if (state) {
        this.updateState(state);
        this.isLoading.set(false);
      }
    });
  }

  retryLoad() {
    this.isLoading.set(true);
    this.loadError.set(null);
    const sessionId = this.turnState()?.sessionId ?? this.route.snapshot.params['sessionId'];
    if (sessionId) this.loadCurrentTurn(String(sessionId));
  }

  private updateState(state: TurnState) {
    this.turnState.set(state);
    this.isSpeaker.set(String(state.activeMemberId) === localStorage.getItem('gwf_userId'));
  }

  private handleTurnShift(sessionId: string, shiftEvent: TurnShiftEvent) {
    const currentState = this.turnState();

    if (currentState) {
      this.turnState.set({
        ...currentState,
        turnIndex: shiftEvent.turnIndex,
        activeMemberId: shiftEvent.newActiveMemberId,
        utterance: shiftEvent.nextUtterance,
        reReadAllowed: true,
        reReadCount: 0,
        maxReReads: 2
      });
      this.isSpeaker.set(String(shiftEvent.newActiveMemberId) === localStorage.getItem('gwf_userId'));
    }

    this.loadCurrentTurn(sessionId);
  }

  onTurnShifted() {
    this.isLoading.set(true);
    this.loadCurrentTurn(this.turnState()!.sessionId);
  }

  private startTimer(sessionId: string) {
    const storageKey = `gwf_session_start_${sessionId}`;
    const stored = sessionStorage.getItem(storageKey);

    if (stored) {
      this.timeSeconds = Math.floor((Date.now() - Number(stored)) / 1000);
    } else {
      sessionStorage.setItem(storageKey, String(Date.now()));
      this.timeSeconds = 0;
    }

    this.timerInterval = setInterval(() => {
      this.timeSeconds++;
      const mins = Math.floor(this.timeSeconds / 60);
      const secs = this.timeSeconds % 60;
      this.sessionTime.set(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
  }

  confirmLeave() {
    if (confirm('Are you sure you want to leave the live session?')) {
      const sessionId = this.route.snapshot.params['sessionId'];
      if (sessionId) sessionStorage.removeItem(`gwf_session_start_${sessionId}`);
      this.router.navigate(['/user/dashboard']);
    }
  }
}

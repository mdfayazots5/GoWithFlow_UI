import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveSessionService } from '../live-session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { SpeakerScreenComponent } from '../speaker-screen/speaker-screen.component';
import { ListenerScreenComponent } from '../listener-screen/listener-screen.component';
import { LucideAngularModule, LogOut, Clock, Activity, RefreshCw, Settings } from 'lucide-angular';
import { TurnState } from '@core/models/voice.model';
import { catchError, of } from 'rxjs';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';

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

         <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
               <i-lucide [img]="TimerIcon" size="14" class="text-gw-accent"></i-lucide>
               <span class="text-xs font-black italic tabular-nums">{{ sessionTime() }}</span>
            </div>

            <button (click)="showSettings.set(!showSettings())"
              [ngClass]="showSettings() ? 'bg-gw-primary text-white' : 'bg-white/5 text-white/40'"
              class="w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
              title="Session Preferences">
               <i-lucide [img]="SettingsIcon" size="18"></i-lucide>
            </button>

            <button (click)="confirmLeave()" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-gw-error hover:bg-gw-error/10 transition-all">
               <i-lucide [img]="LeaveIcon" size="20"></i-lucide>
            </button>
         </div>
      </div>

      <!-- Settings Panel -->
      @if (showSettings()) {
        <div class="border-b border-white/5 bg-[#121221]/90 backdrop-blur-xl px-6 py-5 animate-in slide-in-from-top-2 duration-200">
          <div class="max-w-[480px] mx-auto space-y-4">
            <p class="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">Session Preferences</p>
            <div class="grid grid-cols-1 gap-3">

              <!-- Auto-Start Mic -->
              <div class="flex items-center justify-between py-3 px-4 bg-white/4 rounded-2xl border border-white/8">
                <div>
                  <p class="text-xs font-black text-white/80 italic">Auto-Start Microphone</p>
                  <p class="text-[10px] text-white/35 mt-0.5">Mic starts automatically on your turn</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ defaultVoiceStarter: !sessionPrefs.prefs.defaultVoiceStarter })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.defaultVoiceStarter ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.defaultVoiceStarter"
                  aria-label="Toggle auto-start microphone"
                  type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.defaultVoiceStarter)"></span>
                </button>
              </div>

              <!-- Auto Submit on Stop -->
              <div class="flex items-center justify-between py-3 px-4 bg-white/4 rounded-2xl border border-white/8">
                <div>
                  <p class="text-xs font-black text-white/80 italic">Auto Submit on Stop</p>
                  <p class="text-[10px] text-white/35 mt-0.5">Skip "Done Speaking" — submits when you stop recording</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ autoSubmitOnStop: !sessionPrefs.prefs.autoSubmitOnStop })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.autoSubmitOnStop ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.autoSubmitOnStop"
                  aria-label="Toggle auto submit on stop"
                  type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.autoSubmitOnStop)"></span>
                </button>
              </div>

              <!-- Hear Speaker's Voice -->
              <div class="flex items-center justify-between py-3 px-4 bg-white/4 rounded-2xl border border-white/8">
                <div>
                  <p class="text-xs font-black text-white/80 italic">Hear Speaker's Voice</p>
                  <p class="text-[10px] text-white/35 mt-0.5">Receive live audio from the active speaker</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ listenVoiceBroadcast: !sessionPrefs.prefs.listenVoiceBroadcast })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.listenVoiceBroadcast ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.listenVoiceBroadcast"
                  aria-label="Toggle speaker voice playback"
                  type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.listenVoiceBroadcast)"></span>
                </button>
              </div>

              <!-- Show Re-Speak / Skip Buttons -->
              <div class="flex items-center justify-between py-3 px-4 bg-white/4 rounded-2xl border border-white/8">
                <div>
                  <p class="text-xs font-black text-white/80 italic">Show Re-Speak / Skip</p>
                  <p class="text-[10px] text-white/35 mt-0.5">Show quick action buttons while recording</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ showReReadSkipButtons: !sessionPrefs.prefs.showReReadSkipButtons })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.showReReadSkipButtons ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.showReReadSkipButtons"
                  aria-label="Toggle re-speak and skip buttons"
                  type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.showReReadSkipButtons)"></span>
                </button>
              </div>

            </div>
          </div>
        </div>
      }

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
  readonly sessionPrefs = inject(SessionPreferencesService);
  private voiceBroadcast = inject(VoiceBroadcastService);

  readonly ActivityIcon = Activity;
  readonly TimerIcon = Clock;
  readonly LeaveIcon = LogOut;
  readonly RetryIcon = RefreshCw;
  readonly SettingsIcon = Settings;

  turnState = signal<TurnState | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSpeaker = signal(false);
  sessionName = signal('Live Session');
  sessionTime = signal('00:00');
  showReReadBanner = signal(false);
  listenerTagFlash = signal<string | null>(null);
  showSettings = signal(false);

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
    this.voiceBroadcast.destroy();
    this.ws.disconnect();
  }

  private initSession(sessionId: string) {
    this.isLoading.set(true);
    const user = this.authService.currentUser;
    const myUserId = localStorage.getItem('gwf_userId') || '';

    this.voiceBroadcast.init(sessionId, myUserId);
    this.ws.connect(sessionId, user?.id || '', 'live-session');
    this.loadCurrentTurn(sessionId);

    this.ws.on('TURN_SHIFT').subscribe((shiftEvent: TurnShiftEvent) => {
      this.handleTurnShift(sessionId, shiftEvent);
    });

    this.ws.on('LISTENER_TAG').subscribe((tagData: { tag: string; fromUserId: number }) => {
      this.listenerTagFlash.set(tagData.tag);
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

    // WebRTC voice broadcast signaling
    this.ws.on('VOICE_BROADCAST_STARTED').subscribe(({ speakerId }: { speakerId: string }) => {
      this.voiceBroadcast.handleBroadcastStarted(speakerId);
    });

    this.ws.on('VOICE_STREAM_REQUESTED').subscribe(({ listenerUserId }: { listenerUserId: string }) => {
      if (this.isSpeaker()) {
        this.voiceBroadcast.createOfferForListener(listenerUserId);
      }
    });

    this.ws.on('WEBRTC_OFFER').subscribe(({ fromUserId, toUserId, offerJson }: { fromUserId: string; toUserId: string; offerJson: string }) => {
      if (toUserId === myUserId) {
        this.voiceBroadcast.handleOffer(fromUserId, offerJson);
      }
    });

    this.ws.on('WEBRTC_ANSWER').subscribe(({ fromUserId, toUserId, answerJson }: { fromUserId: string; toUserId: string; answerJson: string }) => {
      if (toUserId === myUserId) {
        this.voiceBroadcast.handleAnswer(fromUserId, answerJson);
      }
    });

    this.ws.on('ICE_CANDIDATE').subscribe(({ fromUserId, toUserId, candidateJson }: { fromUserId: string; toUserId: string; candidateJson: string }) => {
      if (toUserId === myUserId) {
        this.voiceBroadcast.handleIceCandidate(fromUserId, candidateJson);
      }
    });

    this.ws.on('VOICE_BROADCAST_STOPPED').subscribe(() => {
      this.voiceBroadcast.handleBroadcastStopped();
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

  getToggleThumbTransform(enabled: boolean) {
    return enabled ? 'translateX(1.25rem)' : 'translateX(0)';
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
      const navigate = () => this.router.navigate(['/user/dashboard']);
      this.liveSessionService.leaveSession(sessionId).subscribe({ next: navigate, error: navigate });
    }
  }
}

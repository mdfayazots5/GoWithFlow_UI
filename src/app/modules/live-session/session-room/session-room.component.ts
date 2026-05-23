import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveSessionService } from '../live-session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { SpeakerScreenComponent } from '../speaker-screen/speaker-screen.component';
import { ListenerScreenComponent } from '../listener-screen/listener-screen.component';
import { LucideAngularModule, LogOut, Clock, Activity, RefreshCw, Settings, X, AlertTriangle, Users } from 'lucide-angular';
import { TurnState, SessionSummary } from '@core/models/voice.model';
import { catchError, of } from 'rxjs';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';

type TurnShiftEvent = {
  newActiveMemberId: string | number;
  slotIndex: number;
  turnIndex: number;
  nextUtterance: TurnState['utterance'];
};

type PresenceToast = {
  id: number;
  type: 'joined' | 'left';
  name: string;
};

@Component({
  selector: 'app-session-room',
  standalone: true,
  imports: [CommonModule, SpeakerScreenComponent, ListenerScreenComponent, LucideAngularModule],
  template: `
    <div class="h-screen bg-[#1A1A2E] text-white flex flex-col focus-mode">

      <!-- Top Bar: fixed 52px, never scrolls -->
      <div class="flex-shrink-0 h-[52px] px-4 flex items-center justify-between border-b border-white/5 bg-[#121221]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-gw-primary/20 flex items-center justify-center text-gw-primary flex-shrink-0">
            <i-lucide [img]="ActivityIcon" size="16"></i-lucide>
          </div>
          <div class="hidden sm:block min-w-0">
            <h4 class="text-[10px] font-black uppercase tracking-widest italic leading-tight text-white/70 truncate max-w-[160px]">{{ turnState()?.utterance?.contextTag || 'SESSION' }}</h4>
            <p class="text-[9px] font-bold text-white/30 italic uppercase tracking-tighter truncate max-w-[160px]">{{ sessionName() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">

          <!-- ● Live indicator -->
          <div class="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span class="text-[10px] font-black italic text-emerald-400 uppercase tracking-wider">Live</span>
          </div>

          <div class="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <i-lucide [img]="TimerIcon" size="12" class="text-gw-accent"></i-lucide>
            <span class="text-[11px] font-black italic tabular-nums">{{ sessionTime() }}</span>
          </div>

          <button (click)="showSettings.set(!showSettings())"
            [ngClass]="showSettings() ? 'bg-gw-primary text-white' : 'bg-white/5 text-white/40'"
            class="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
            title="Session Preferences">
            <i-lucide [img]="SettingsIcon" size="16"></i-lucide>
          </button>

          <button (click)="confirmLeave()"
            class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-gw-error hover:bg-gw-error/10 transition-all">
            <i-lucide [img]="LeaveIcon" size="18"></i-lucide>
          </button>
        </div>
      </div>

      <!-- Speaker-Left Critical Alert Banner -->
      @if (speakerLeftAlert()) {
        <div class="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3
                    bg-amber-500/10 border-b border-amber-500/25
                    animate-in slide-in-from-top-1 duration-200">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <i-lucide [img]="AlertIcon" size="14" class="text-amber-400"></i-lucide>
            </div>
            <div class="min-w-0">
              <p class="text-[11px] font-black italic text-amber-400 leading-tight">
                The current speaker has left
              </p>
              <p class="text-[9px] font-bold uppercase tracking-wider text-amber-400/60">
                Waiting for the next turn to begin...
              </p>
            </div>
          </div>
          <button (click)="speakerLeftAlert.set(false)"
            class="w-6 h-6 flex items-center justify-center text-amber-400/50 hover:text-amber-400 transition-colors flex-shrink-0">
            <i-lucide [img]="CloseIcon" size="13"></i-lucide>
          </button>
        </div>
      }

      <!-- Settings Panel: collapsible, capped at 40vh so main content always visible -->
      @if (showSettings()) {
        <div class="flex-shrink-0 border-b border-white/5 bg-[#121221]/95 backdrop-blur-xl overflow-y-auto animate-in slide-in-from-top-2 duration-200"
             style="max-height: min(40vh, 260px)">
          <div class="max-w-[480px] mx-auto px-4 py-3 space-y-2.5">
            <p class="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">Session Preferences</p>
            <div class="grid grid-cols-1 gap-2">

              <!-- Auto-Start Mic -->
              <div class="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <div class="min-w-0 mr-3">
                  <p class="text-[11px] font-black text-white/80 italic">Auto-Start Microphone</p>
                  <p class="text-[10px] text-white/35 mt-0.5 leading-tight">Mic starts automatically on your turn</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ defaultVoiceStarter: !sessionPrefs.prefs.defaultVoiceStarter })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.defaultVoiceStarter ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.defaultVoiceStarter"
                  aria-label="Toggle auto-start microphone" type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.defaultVoiceStarter)"></span>
                </button>
              </div>

              <!-- Auto Submit on Stop -->
              <div class="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <div class="min-w-0 mr-3">
                  <p class="text-[11px] font-black text-white/80 italic">Auto Submit on Stop</p>
                  <p class="text-[10px] text-white/35 mt-0.5 leading-tight">Skip feedback — submits when you stop recording</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ autoSubmitOnStop: !sessionPrefs.prefs.autoSubmitOnStop })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.autoSubmitOnStop ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.autoSubmitOnStop"
                  aria-label="Toggle auto submit on stop" type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.autoSubmitOnStop)"></span>
                </button>
              </div>

              <!-- Hear Speaker's Voice -->
              <div class="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <div class="min-w-0 mr-3">
                  <p class="text-[11px] font-black text-white/80 italic">Hear Speaker's Voice</p>
                  <p class="text-[10px] text-white/35 mt-0.5 leading-tight">Receive live audio from the active speaker</p>
                </div>
                <button
                  (click)="sessionPrefs.update({ listenVoiceBroadcast: !sessionPrefs.prefs.listenVoiceBroadcast })"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                  [ngClass]="sessionPrefs.prefs.listenVoiceBroadcast ? 'bg-gw-primary' : 'bg-white/15'"
                  [attr.aria-pressed]="sessionPrefs.prefs.listenVoiceBroadcast"
                  aria-label="Toggle speaker voice playback" type="button">
                  <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 pointer-events-none"
                    [style.transform]="getToggleThumbTransform(sessionPrefs.prefs.listenVoiceBroadcast)"></span>
                </button>
              </div>

            </div>
          </div>
        </div>
      }

      <!-- Main Content: flex-1, no outer scroll, content fills remaining height -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <div class="max-w-[480px] mx-auto h-full px-4 py-3 flex flex-col justify-center">
          @if (isLoading()) {
            <div class="flex flex-col items-center gap-3">
              <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
              <p class="text-[11px] font-black uppercase tracking-widest italic text-white/40">Synchronizing session...</p>
            </div>
          } @else if (loadError()) {
            <div class="flex flex-col items-center gap-5 text-center">
              <div class="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <i-lucide [img]="RetryIcon" size="22" class="text-red-400"></i-lucide>
              </div>
              <div>
                <p class="text-sm font-black uppercase tracking-widest italic text-white/60 mb-1.5">Session Error</p>
                <p class="text-xs text-white/30 italic leading-relaxed max-w-xs">{{ loadError() }}</p>
              </div>
              <button (click)="retryLoad()"
                class="px-5 py-2.5 bg-gw-primary rounded-xl font-black text-[10px] uppercase tracking-widest italic text-white flex items-center gap-2 hover:opacity-90 transition-all active:scale-95">
                <i-lucide [img]="RetryIcon" size="13"></i-lucide>
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

      <!-- ── Presence Toasts (fixed, bottom-right, non-blocking) ── -->
      <div class="fixed bottom-5 right-4 flex flex-col gap-2 z-50 pointer-events-none"
           style="max-width: 260px; width: calc(100vw - 2rem)">
        @for (toast of presenceToasts(); track toast.id) {
          <div class="relative flex items-center gap-3 px-3.5 py-3 rounded-2xl border shadow-2xl
                      bg-[#0E0E1C]/95 backdrop-blur-xl overflow-hidden
                      animate-in slide-in-from-bottom-3 duration-300"
               [ngClass]="toast.type === 'left'
                 ? 'border-red-500/25'
                 : 'border-emerald-500/25'">

            <!-- Avatar initial bubble -->
            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0"
                 [ngClass]="toast.type === 'left'
                   ? 'bg-red-500/20 text-red-400'
                   : 'bg-emerald-500/20 text-emerald-400'">
              {{ getInitial(toast.name) }}
            </div>

            <div class="min-w-0">
              <p class="text-[11px] font-black text-white leading-tight truncate">{{ toast.name }}</p>
              <p class="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                 [ngClass]="toast.type === 'left' ? 'text-red-400/70' : 'text-emerald-400/70'">
                {{ toast.type === 'left' ? 'left the room' : 'joined the session' }}
              </p>
            </div>

            <!-- Coloured left-edge accent bar -->
            <div class="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                 [ngClass]="toast.type === 'left' ? 'bg-red-400/60' : 'bg-emerald-400/60'"></div>
          </div>
        }
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
  readonly CloseIcon = X;
  readonly AlertIcon = AlertTriangle;
  readonly UsersIcon = Users;

  // ── Core session state ──
  turnState = signal<TurnState | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSpeaker = signal(false);
  sessionName = signal('Live Session');
  sessionTime = signal('00:00');
  showReReadBanner = signal(false);
  listenerTagFlash = signal<string | null>(null);
  showSettings = signal(false);

  // ── Presence feature state ──
  presenceToasts = signal<PresenceToast[]>([]);
  speakerLeftAlert = signal(false);

  private memberNameMap = new Map<string, string>();
  private toastIdCounter = 0;

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

    // Seed name map with ourselves so we're never "unknown"
    if (myUserId && user) {
      const myName = (user as any).fullName || (user as any).name || '';
      if (myName) this.memberNameMap.set(myUserId, myName);
    }

    this.voiceBroadcast.init(sessionId, myUserId);
    this.ws.connect(sessionId, user?.id || '', 'live-session');
    this.loadCurrentTurn(sessionId);

    // ── Existing event listeners ──
    this.ws.on('TURN_SHIFT').subscribe((shiftEvent: TurnShiftEvent) => {
      this.speakerLeftAlert.set(false); // new speaker is active — clear the alert
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

    this.ws.on('SESSION_ENDED').subscribe((data: { sessionId: number; summary: SessionSummary }) => {
      // Persist elapsed time so the report page can display real duration
      sessionStorage.setItem(`gwf_session_duration_${sessionId}`, String(this.timeSeconds));
      sessionStorage.removeItem(`gwf_session_start_${sessionId}`);

      // Navigate with summary in router state — report page reads it without an extra API call
      this.router.navigate(['/session/report', sessionId], {
        state: { summary: data?.summary ?? null }
      });
    });

    // ── NEW: Member presence listeners ──

    this.ws.on('MEMBER_LEFT').subscribe((data: { userId: string | number; name?: string; slotIndex: number }) => {
      const userId = String(data.userId);

      // Resolve name: prefer our local map (set from MEMBER_JOINED), fall back to backend payload
      const resolvedName = this.memberNameMap.get(userId) || data.name || 'A participant';
      this.memberNameMap.delete(userId);

      // Check if the active speaker left — triggers the critical alert
      const currentActiveSpeaker = String(this.turnState()?.activeMemberId ?? '');
      const activeSpeakerLeft = userId === currentActiveSpeaker && userId !== myUserId;
      if (activeSpeakerLeft) {
        this.speakerLeftAlert.set(true);
      }

      this.pushPresenceToast('left', resolvedName);
    });

    this.ws.on('MEMBER_JOINED').subscribe((data: { userId: string | number; name: string; slotIndex: number }) => {
      const userId = String(data.userId);
      if (userId === myUserId) return; // don't toast for ourselves re-joining

      this.memberNameMap.set(userId, data.name);
      this.pushPresenceToast('joined', data.name);
    });

    // ── WebRTC voice broadcast signaling ──
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

  // ── Presence toast helpers ──

  private pushPresenceToast(type: 'joined' | 'left', name: string): void {
    const id = ++this.toastIdCounter;
    this.presenceToasts.update(toasts => [...toasts, { id, type, name }]);
    setTimeout(() => {
      this.presenceToasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 4000);
  }

  getInitial(name: string): string {
    return name?.trim()?.charAt(0)?.toUpperCase() || '?';
  }

  // ── Existing methods (unchanged) ──

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

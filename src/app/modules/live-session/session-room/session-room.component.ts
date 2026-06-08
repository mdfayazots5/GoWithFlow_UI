import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveSessionService } from '../live-session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { SpeakerScreenComponent } from '../speaker-screen/speaker-screen.component';
import { ListenerScreenComponent } from '../listener-screen/listener-screen.component';
import { LucideAngularModule, LogOut, Clock, Activity, RefreshCw, Settings, X, AlertTriangle, Users, Mic, Headphones } from 'lucide-angular';
import { TurnState, SessionSummary } from '@core/models/voice.model';
import { catchError, of } from 'rxjs';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { VoiceBroadcastService } from '@core/services/voice-broadcast.service';
import { SessionCapabilitiesService } from '@core/services/session-capabilities.service';
import { SessionService } from '@core/services/session.service';
import { AudioArchiveService } from '@core/services/audio-archive.service';

type TurnShiftEvent = {
  newActiveMemberId: string | number;
  newActiveMemberName: string;
  activeMemberAvatarUrl?: string | null;
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
          <div class="min-w-0">
            <h4 class="text-[11px] font-black uppercase tracking-widest italic leading-tight text-white/70 truncate max-w-[160px]">{{ turnState()?.utterance?.contextTag || 'SESSION' }}</h4>
            <p class="text-[11px] font-bold text-white/30 italic uppercase tracking-tighter truncate max-w-[120px]">{{ sessionName() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">

          <!-- ● Live indicator -->
          <div class="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span class="text-[11px] font-black italic text-emerald-400 uppercase tracking-wider">Live</span>
          </div>

          <div class="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <i-lucide [img]="TimerIcon" size="12" class="text-gw-accent"></i-lucide>
            <span class="text-[11px] font-black italic tabular-nums">{{ sessionTime() }}</span>
          </div>

          <button (click)="showSettings.set(!showSettings())"
            [ngClass]="showSettings() ? 'bg-gw-primary text-white' : 'bg-white/5 text-white/40'"
            class="w-11 h-11 rounded-xl flex items-center justify-center hover:opacity-80 transition-all"
            title="Session Preferences">
            <i-lucide [img]="SettingsIcon" size="16"></i-lucide>
          </button>

          <button (click)="confirmLeave()"
            class="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-gw-error hover:bg-gw-error/10 transition-all">
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
              <p class="text-[11px] font-bold uppercase tracking-wider text-amber-400/60">
                Waiting for the next turn to begin...
              </p>
            </div>
          </div>
          <button (click)="speakerLeftAlert.set(false)"
            class="w-11 h-11 flex items-center justify-center text-amber-400/50 hover:text-amber-400 transition-colors flex-shrink-0 rounded-lg">
            <i-lucide [img]="CloseIcon" size="15"></i-lucide>
          </button>
        </div>
      }

      <!-- Settings: bottom-sheet overlay — floats above content instead of pushing it -->
      @if (showSettings()) {
        <div class="fixed inset-0 z-[60] flex flex-col justify-end" (click)="showSettings.set(false)">
          <div class="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"></div>
          <div class="relative w-full max-w-[520px] mx-auto bg-[#121221] border-t border-white/10 rounded-t-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-4 duration-250"
               style="max-height: min(70vh, 460px); padding-bottom: max(20px, env(safe-area-inset-bottom, 20px))"
               (click)="$event.stopPropagation()">
            <!-- Grabber -->
            <div class="sticky top-0 pt-3 pb-2 flex justify-center bg-[#121221]">
              <span class="w-10 h-1 rounded-full bg-white/15"></span>
            </div>
          <div class="px-4 pb-3 space-y-2.5">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 italic">Session Preferences</p>
              <button (click)="showSettings.set(false)" class="w-9 h-9 -mr-1.5 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg" aria-label="Close settings">
                <i-lucide [img]="CloseIcon" size="16"></i-lucide>
              </button>
            </div>
            <div class="grid grid-cols-1 gap-2">

              <!-- Auto-Start Mic -->
              <div class="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <div class="min-w-0 mr-3">
                  <p class="text-[11px] font-black text-white/80 italic">Auto-Start Microphone</p>
                  <p class="text-[11px] text-white/35 mt-0.5 leading-tight">Mic starts automatically on your turn</p>
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
                  <p class="text-[11px] text-white/35 mt-0.5 leading-tight">Shows your score for 3s, then submits automatically</p>
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

              <!-- Hear Speaker's Voice — only on platforms that can actually receive peer audio (not native APK) -->
              @if (capabilities.canBroadcastVoice) {
              <div class="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                <div class="min-w-0 mr-3">
                  <p class="text-[11px] font-black text-white/80 italic">Hear Speaker's Voice</p>
                  <p class="text-[11px] text-white/35 mt-0.5 leading-tight">Receive live audio from the active speaker</p>
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
              }

            </div>
          </div>
          </div>
        </div>
      }

      <!-- Main Content: the single scroll region (3-zone grid: header / this stage / docked actions inside) -->
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="w-full max-w-[480px] md:max-w-[680px] lg:max-w-[760px] mx-auto px-4 md:px-6 pt-3 md:pt-5" style="padding-bottom: max(24px, env(safe-area-inset-bottom, 24px))">

          <!-- First-run orientation hint (dismissible, once per device) -->
          @if (showOrientation() && !isLoading() && !loadError()) {
            <div class="mb-3 flex items-start gap-3 px-4 py-3 rounded-2xl bg-gw-primary/10 border border-gw-primary/25 animate-in slide-in-from-top-2 duration-300">
              <div class="w-8 h-8 rounded-xl bg-gw-primary/20 flex items-center justify-center text-gw-primary flex-shrink-0">
                <i-lucide [img]="isSpeaker() ? MicIcon : HeadphonesIcon" size="15"></i-lucide>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-bold text-white/85 leading-snug">
                  {{ isSpeaker() ? "It's your turn — read the line aloud. Your mic may start automatically." : "Listen to the speaker. You'll be prompted automatically when it's your turn." }}
                </p>
              </div>
              <button (click)="dismissOrientation()" class="w-8 h-8 -mr-1 -mt-1 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors rounded-lg flex-shrink-0" aria-label="Dismiss tip">
                <i-lucide [img]="CloseIcon" size="15"></i-lucide>
              </button>
            </div>
          }

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
                class="px-5 py-2.5 bg-gw-primary rounded-xl font-black text-[11px] uppercase tracking-widest italic text-white flex items-center gap-2 hover:opacity-90 transition-all active:scale-95">
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

      <!-- Leave confirmation — in-app sheet (replaces native confirm()) -->
      @if (showLeaveConfirm()) {
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-5" (click)="showLeaveConfirm.set(false)">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"></div>
          <div class="relative w-full max-w-[360px] bg-[#161628] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
               (click)="$event.stopPropagation()">
            <div class="w-12 h-12 rounded-2xl bg-gw-error/15 flex items-center justify-center text-gw-error mb-4">
              <i-lucide [img]="LeaveIcon" size="22"></i-lucide>
            </div>
            <h3 class="text-base font-bold text-white mb-1.5">Leave this session?</h3>
            <p class="text-[13px] text-white/45 leading-snug mb-5">You can rejoin while the session is still live, but you'll miss any turns in between.</p>
            <div class="flex gap-3">
              <button (click)="showLeaveConfirm.set(false)" type="button"
                class="flex-1 h-12 rounded-xl border border-white/15 text-[13px] font-bold text-white/70 hover:bg-white/5 active:scale-95 transition-all">
                Stay
              </button>
              <button (click)="doLeave()" type="button"
                class="flex-1 h-12 rounded-xl bg-gw-error text-white text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all">
                Leave
              </button>
            </div>
          </div>
        </div>
      }

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
              <p class="text-[11px] font-bold uppercase tracking-wider mt-0.5"
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
  readonly capabilities = inject(SessionCapabilitiesService);
  private voiceBroadcast = inject(VoiceBroadcastService);
  private sessionService = inject(SessionService);
  private audioArchiveSvc = inject(AudioArchiveService);

  readonly ActivityIcon = Activity;
  readonly TimerIcon = Clock;
  readonly LeaveIcon = LogOut;
  readonly RetryIcon = RefreshCw;
  readonly SettingsIcon = Settings;
  readonly CloseIcon = X;
  readonly AlertIcon = AlertTriangle;
  readonly UsersIcon = Users;
  readonly MicIcon = Mic;
  readonly HeadphonesIcon = Headphones;

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
  showLeaveConfirm = signal(false);
  showOrientation = signal(false);
  private readonly ORIENTATION_KEY = 'gwf_session_room_seen';

  // ── Presence feature state ──
  presenceToasts = signal<PresenceToast[]>([]);
  speakerLeftAlert = signal(false);

  private memberNameMap = new Map<string, string>();
  private toastIdCounter = 0;

  /** Set when SESSION_ENDED is received. Prevents loadCurrentTurn and onTurnShifted
   *  from firing after navigation is already in progress. */
  private _sessionEnded = false;

  private timeSeconds = 0;
  private timerInterval: any;

  ngOnInit() {
    // First-run orientation hint — shown once per device until dismissed.
    try {
      this.showOrientation.set(localStorage.getItem(this.ORIENTATION_KEY) !== 'true');
    } catch {
      this.showOrientation.set(false);
    }

    this.route.params.subscribe(params => {
      const sessionId = params['sessionId'];
      if (sessionId) {
        this.initSession(sessionId);
        this.startTimer(sessionId);
      }
    });
  }

  dismissOrientation() {
    this.showOrientation.set(false);
    try { localStorage.setItem(this.ORIENTATION_KEY, 'true'); } catch { /* non-fatal */ }
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

    // Re-derive the host "Record Session" flag from the server on every entry into the room.
    // AudioArchiveService.sessionRecordingEnabled is a root-singleton normally set only in the
    // lobby; a mid-session page reload / deep-link into /live-session bypasses the lobby and would
    // otherwise leave it false, silently stopping turn-clip capture for the consolidated recording.
    // Best-effort: a failed lookup leaves the existing flag (and personal-archive consent) untouched.
    this.sessionService.getLobbyState(sessionId).subscribe({
      next: state => this.audioArchiveSvc.setSessionRecordingEnabled(state.recordingEnabled === true),
      error: () => { /* non-fatal — keep whatever the lobby/consent already set */ }
    });

    // ── Existing event listeners ──
    this.ws.on('TURN_SHIFT').subscribe((shiftEvent: TurnShiftEvent) => {
      if (this._sessionEnded) return;
      console.log('[Session] TURN_SHIFT received', {
        sessionId,
        newTurnIndex: shiftEvent.turnIndex,
        newSpeakerId: shiftEvent.newActiveMemberId,
        newSpeakerName: shiftEvent.newActiveMemberName
      });
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
      console.log('[Session] SESSION_ENDED received', { sessionId, totalTurns: data?.summary?.totalTurns });
      this._sessionEnded = true;

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
    // Do not reload if the session has already ended — navigation is in progress.
    if (this._sessionEnded) return;

    this.loadError.set(null);
    this.liveSessionService.getCurrentTurn(sessionId).pipe(
      catchError(err => {
        if (this._sessionEnded) return of(null); // session ended while request was in flight
        const msg = err?.error?.message || err?.error?.errors?.[0] || 'Failed to load session turn. Please retry.';
        this.loadError.set(msg);
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(state => {
      if (state && !this._sessionEnded) {
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
    const current = this.turnState();
    // Only push a new turnState reference when the turn actually changes.
    // handleTurnShift already sets an optimistic state for the same turn; the subsequent
    // loadCurrentTurn() API confirmation for that same turn must not fire a second
    // ngOnChanges in SpeakerScreenComponent, which would re-arm auto-start mid-recording.
    if (!current || String(current.sessionId) !== String(state.sessionId) || state.turnIndex > current.turnIndex) {
      this.turnState.set(state);
    }
    this.isSpeaker.set(String(state.activeMemberId) === localStorage.getItem('gwf_userId'));
  }

  private handleTurnShift(sessionId: string, shiftEvent: TurnShiftEvent) {
    if (this._sessionEnded) return;

    const currentState = this.turnState();
    const myUserId = localStorage.getItem('gwf_userId');
    const willSpeak = String(shiftEvent.newActiveMemberId) === myUserId;

    console.log('[Session] handleTurnShift — applying optimistic update', {
      from: currentState?.turnIndex,
      to: shiftEvent.turnIndex,
      nextSpeaker: shiftEvent.newActiveMemberName,
      iAmSpeaker: willSpeak
    });

    if (currentState) {
      this.turnState.set({
        ...currentState,
        turnIndex: shiftEvent.turnIndex,
        activeMemberId: shiftEvent.newActiveMemberId,
        activeMemberName: shiftEvent.newActiveMemberName,
        activeMemberAvatarUrl: shiftEvent.activeMemberAvatarUrl ?? null,
        utterance: shiftEvent.nextUtterance,
        reReadAllowed: true,
        reReadCount: 0,
        maxReReads: 2,
        // isFacilitatorTurn defaults false in the optimistic update; the canonical
        // loadCurrentTurn() response immediately follows and sets the correct value.
        isFacilitatorTurn: false
      });
      this.isSpeaker.set(willSpeak);
    }

    this.loadCurrentTurn(sessionId);
  }

  onTurnShifted() {
    if (this._sessionEnded) return;
    // Do NOT set isLoading=true here. handleTurnShift already applied the optimistic
    // state update and called loadCurrentTurn when TURN_SHIFT arrived. Setting loading
    // here would destroy and recreate SpeakerScreenComponent, cancelling its auto-start
    // timers and forcing a second 700ms delay before recording can begin.
    // Instead, just confirm canonical state — updateState's guard skips re-render
    // when the turn index hasn't changed since the optimistic update.
    console.log('[Session] onTurnShifted — confirming canonical state');
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
    this.showLeaveConfirm.set(true);
  }

  doLeave() {
    this.showLeaveConfirm.set(false);
    const sessionId = this.route.snapshot.params['sessionId'];
    if (sessionId) sessionStorage.removeItem(`gwf_session_start_${sessionId}`);
    const navigate = () => this.router.navigate(['/user/dashboard']);
    this.liveSessionService.leaveSession(sessionId).subscribe({ next: navigate, error: navigate });
  }
}

// File: src/app/modules/session/lobby/lobby.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { ToastService } from '@core/services/toast.service';
import { AudioArchiveService } from '@core/services/audio-archive.service';
import {
  LucideAngularModule,
  Copy,
  CheckCircle2,
  Circle,
  Play,
  LogOut,
  User,
  Loader2,
  Clock,
  Layers,
  Star,
  Zap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Shield
} from 'lucide-angular';
import { LobbyState, LobbyMember } from '@core/models/session.model';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UserAvatarComponent],
  templateUrl: './lobby.component.html',
  styles: [`
    :host { display: block; }
    .lobby-session-name { font-size: clamp(18px, 5vw, 28px); }
    .lobby-join-code    { font-size: clamp(20px, 5.5vw, 28px); }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private wsService = inject(WebsocketService);
  private toast          = inject(ToastService);
  private router         = inject(Router);
  private audioArchiveSvc = inject(AudioArchiveService);

  readonly CopyIcon = Copy;
  readonly CheckIcon = CheckCircle2;
  readonly EmptyIcon = Circle;
  readonly UserIcon = User;
  readonly StarIcon = Star;
  readonly ZapIcon = Zap;
  readonly ScriptIcon = BookOpen;
  readonly LayersIcon = Layers;
  readonly ClockIcon = Clock;
  readonly UpIcon = ChevronUp;
  readonly DownIcon = ChevronDown;
  readonly PlayIcon = Play;
  readonly LeaveIcon = LogOut;
  readonly LoaderIcon = Loader2;
  readonly ShieldIcon = Shield;

  state = signal<LobbyState | null>(null);
  isStarting = signal(false);
  isReady = signal(false);
  isHost = signal(false);
  showScript = signal(false);
  currentUserId = signal(localStorage.getItem('gwf_userId') ?? '');
  audioConsentEnabled = signal(this.audioArchiveSvc.getConsent());

  slots = computed(() => {
    const max = this.state()?.session?.maxMembers ?? this.state()?.members?.length ?? 0;
    return Array.from({ length: Math.max(max, 1) }, (_, i) => i + 1);
  });

  memberCount = computed(() => this.state()?.members?.length ?? 0);

  /** Phase 17: AI session — recording isn't captured for AI turns, so the toggle is hidden. */
  aiEnabled = computed(() => this.state()?.aiEnabled === true);

  hasEnoughPlayers = computed(() => this.memberCount() >= 2);

  allReady = computed(() => {
    const members = this.state()?.members ?? [];
    return members.length >= 2 && members.every(m => m.ready);
  });

  lobbyStatusLabel = computed(() => {
    if (this.allReady()) {
      return 'All ready';
    }

    if (this.hasEnoughPlayers()) {
      return 'Waiting for players to get ready';
    }

    return 'Waiting for players';
  });


  private sessionId = '';
  private hasLeft = false;
  private startStatusPollHandle: ReturnType<typeof setTimeout> | null = null;
  private startStatusPollAttempts = 0;

  private sessionActivePollHandle: any = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = params['sessionId'];
      if (this.sessionId) {
        this.loadLobby(this.sessionId);
        const userId = localStorage.getItem('gwf_userId') ?? '';
        this.wsService.connect(this.sessionId, userId, 'session');
        this.subscribeToLobbyEvents();
        this.announceJoin(this.sessionId, userId);
        this.startSessionActivePoll();
      }
    });
  }

  ngOnDestroy() {
    this.clearStartStatusPoll();
    this.stopSessionActivePoll();
    // Do not call leaveSession on destroy — a page reload would prematurely mark the
    // member as left and abandon the session. The backend grace window (20 s) handles
    // genuine disconnects; explicit leave is only issued via leaveSession().
    this.wsService.disconnect();
  }

  /**
   * Announce this client's presence to the session group via the JoinLobby hub method.
   * This is what triggers the backend's MEMBER_JOINED broadcast so members already in
   * the lobby (notably the HOST) refresh their roster. connect() only adds this
   * connection to the group — it does NOT announce the join. Without this call the host
   * never learns a guest joined and stays stuck at "1/2" even after the guest is ready.
   */
  private announceJoin(sessionId: string, userId: string) {
    this.wsService.emit('JoinLobby', sessionId, userId)
      .then(() => console.log('[Lobby] JoinLobby announced', { sessionId, userId }))
      .catch(err => console.error('[Lobby] JoinLobby failed — roster fallback poll will cover it', err));
  }

  // Polls every 3s as a SignalR fallback. Two jobs:
  //  1. Catch SESSION_STARTED if the realtime event is missed → navigate to the room.
  //  2. Keep the lobby roster + readiness fresh even if MEMBER_JOINED/MEMBER_READY were
  //     missed (e.g. host connected before the guest, or a dropped SignalR frame). This
  //     is the self-healing safety net behind the JoinLobby fix.
  private startSessionActivePoll() {
    this.sessionActivePollHandle = setInterval(() => {
      if (this.hasLeft || !this.sessionId) {
        this.stopSessionActivePoll();
        return;
      }
      // loadLobby() handles ACTIVE→navigate and COMPLETED/ABANDONED→dashboard internally,
      // and otherwise refreshes the member list + readiness. Reusing it keeps one canonical
      // refresh path and makes the roster converge within 3s regardless of SignalR health.
      this.loadLobby(this.sessionId);
    }, 3000);
  }

  private stopSessionActivePoll() {
    if (this.sessionActivePollHandle) {
      clearInterval(this.sessionActivePollHandle);
      this.sessionActivePollHandle = null;
    }
  }

  private subscribeToLobbyEvents() {
    this.wsService.on('MEMBER_JOINED').subscribe(() => this.loadLobby(this.sessionId));

    this.wsService.on('MEMBER_READY').subscribe((data: any) => {
      console.log('[Lobby] MEMBER_READY received', data);
      const known = this.state()?.members?.some(m => String(m.userId) === String(data.userId));
      if (!known) {
        // Readiness arrived for a member not yet in our roster (MEMBER_JOINED missed or
        // out of order). Pull the full lobby so the member appears AND shows ready —
        // otherwise the update below would silently no-op and the count stays stale.
        this.loadLobby(this.sessionId);
        return;
      }
      this.state.update(s => {
        if (!s) return s;
        const members = s.members.map(m =>
          String(m.userId) === String(data.userId) ? { ...m, ready: data.isReady ?? true } : m
        );
        return { ...s, members };
      });
    });

    this.wsService.on('SESSION_STARTED').subscribe(() => {
      this.clearStartStatusPoll();
      if (!this.hasLeft) {
        this.hasLeft = true;
        this.navigateToLiveSession(this.sessionId);
      }
    });

    this.wsService.on('MEMBER_LEFT').subscribe((data: any) => {
      this.state.update(s => {
        if (!s) return s;
        const members = s.members.filter(m => String(m.userId) !== String(data.userId));
        return { ...s, members };
      });
    });

    // Refresh lobby when an invited user accepts and joins
    this.wsService.on('INVITATION_RESPONDED').subscribe(() => this.loadLobby(this.sessionId));
  }

  loadLobby(sessionId: string) {
    this.sessionService.getLobbyState(sessionId).subscribe(state => {
      const status = state.session?.status;

      if (status === 'ACTIVE') {
        if (!this.hasLeft) {
          this.hasLeft = true;
          this.navigateToLiveSession(sessionId);
        }
        return;
      }

      if (status === 'COMPLETED' || status === 'ABANDONED') {
        this.hasLeft = true;
        this.router.navigate(['/user/dashboard']);
        this.toast.error('This session has already ended.');
        return;
      }

      this.state.set(state);
      const userId = localStorage.getItem('gwf_userId');
      const myMember = state.members.find(m => String(m.userId) === userId);
      if (myMember) {
        this.isReady.set(myMember.ready);
        this.isHost.set(myMember.isHost);
      }

      // Phase 16: propagate the host's session-level recording decision to every participant
      // so all clients capture + upload their turn audio for the consolidated recording.
      this.audioArchiveSvc.setSessionRecordingEnabled(state.recordingEnabled);
      if (!this.isHost()) {
        // Guests reflect the host's choice in the passive "being recorded" notice.
        this.audioConsentEnabled.set(state.recordingEnabled);
      }
    });
  }

  getMemberAtSlot(slotIndex: number): LobbyMember | undefined {
    return this.state()?.members.find(m => m.slotIndex === slotIndex);
  }

  isMe(member: LobbyMember): boolean {
    return String(member.userId) === this.currentUserId();
  }

  hideImg(event: Event) {
    (event.target as HTMLElement).style.display = 'none';
  }

  copyCode() {
    if (this.state()?.session) {
      navigator.clipboard.writeText(this.state()!.session.joinCode);
      this.toast.success('Code copied!');
    }
  }

  toggleAudioConsent() {
    const newValue = !this.audioConsentEnabled();
    this.audioConsentEnabled.set(newValue);
    this.audioArchiveSvc.setConsent(newValue);
    this.audioArchiveSvc.setSessionRecordingEnabled(newValue);

    // Phase 16: host toggle also persists the session-level recording flag on the backend,
    // so the server knows to consolidate this session's audio into one recording on completion.
    if (this.isHost() && this.sessionId) {
      this.sessionService.setRecordingEnabled(this.sessionId, newValue).subscribe({
        error: () => {
          // Revert UI + local consent if the server rejected the change.
          this.audioConsentEnabled.set(!newValue);
          this.audioArchiveSvc.setConsent(!newValue);
          this.toast.error('Could not update session recording. Please try again.');
        }
      });
    }
  }

  toggleReady() {
    const next = !this.isReady();
    const userId = localStorage.getItem('gwf_userId') ?? '';
    // Use the hub method so MEMBER_READY is broadcast to ALL clients (including the host)
    // in a single round-trip. REST-only updates the DB but never broadcasts to the group.
    this.wsService.emit('SetReady', this.sessionId, userId, next)
      .then(() => this.isReady.set(next))
      .catch(() => {
        // Hub unavailable — fall back to REST; host sees change only on their next poll
        this.sessionService.updateReadyStatus({
          sessionId: Number(this.state()!.session.id),
          isReady: next
        }).subscribe(() => {
          this.isReady.set(next);
          this.loadLobby(this.sessionId);
        });
      });
  }

  startSession() {
    this.isStarting.set(true);
    this.startStartStatusPoll();
    this.wsService.emit('StartSession', this.sessionId)
      .then(() => {
        this.clearStartStatusPoll();
        if (!this.hasLeft) {
          this.hasLeft = true;
          this.navigateToLiveSession(this.sessionId);
        }
      })
      .catch((err) => {
        this.reconcileStartFailure(err);
      });
  }

  leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
      this.hasLeft = true;
      this.sessionService.leaveSession(this.sessionId).subscribe(() => {
        this.wsService.disconnect();
        this.router.navigate(['/user/dashboard']);
      });
    }
  }

  private startStartStatusPoll() {
    this.clearStartStatusPoll();
    this.startStatusPollAttempts = 0;

    const poll = () => {
      if (this.isStarting() === false || !this.sessionId) {
        return;
      }

      this.startStatusPollAttempts += 1;

      this.sessionService.getLobbyState(this.sessionId).subscribe({
        next: (state) => {
          const status = state.session?.status;

          if (status === 'ACTIVE') {
            this.clearStartStatusPoll();
            if (!this.hasLeft) {
              this.hasLeft = true;
              this.navigateToLiveSession(this.sessionId);
            }
            return;
          }

          if (this.startStatusPollAttempts >= 10) {
            this.clearStartStatusPoll();
            this.isStarting.set(false);
            this.toast.error('Session start is taking longer than expected. Please refresh the lobby state.');
            return;
          }

          this.startStatusPollHandle = setTimeout(poll, 1000);
        },
        error: () => {
          if (this.startStatusPollAttempts >= 10) {
            this.clearStartStatusPoll();
            this.isStarting.set(false);
            this.toast.error('Unable to confirm whether the session started. Please refresh the lobby state.');
            return;
          }

          this.startStatusPollHandle = setTimeout(poll, 1000);
        }
      });
    };

    this.startStatusPollHandle = setTimeout(poll, 1500);
  }

  private clearStartStatusPoll() {
    if (this.startStatusPollHandle !== null) {
      clearTimeout(this.startStatusPollHandle);
      this.startStatusPollHandle = null;
    }

    this.startStatusPollAttempts = 0;
    this.isStarting.set(false);
  }

  private reconcileStartFailure(err: unknown) {
    this.sessionService.getLobbyState(this.sessionId).subscribe({
      next: (state) => {
        if (state.session?.status === 'ACTIVE') {
          this.clearStartStatusPoll();
          if (!this.hasLeft) {
            this.hasLeft = true;
            this.navigateToLiveSession(this.sessionId);
          }
          return;
        }

        this.clearStartStatusPoll();
        const msg = err instanceof Error ? err.message : 'Failed to start session.';
        this.toast.error(msg);
      },
      error: () => {
        this.clearStartStatusPoll();
        const msg = err instanceof Error ? err.message : 'Failed to start session.';
        this.toast.error(msg);
      }
    });
  }

  private navigateToLiveSession(sessionId: string) {
    // Use full page redirect — bypasses Angular Router lazy-load issues in
    // Capacitor WebView where navigateByUrl can silently fail or redirect to root.
    window.location.href = `/live-session/room/${sessionId}`;
  }
}

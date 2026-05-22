// File: src/app/modules/session/lobby/lobby.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { ToastService } from '@core/services/toast.service';
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

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './lobby.component.html',
  styles: [`:host { display: block; }`]
})
export class LobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private wsService = inject(WebsocketService);
  private toast = inject(ToastService);
  private router = inject(Router);

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

  slots = computed(() => {
    const max = this.state()?.session?.maxMembers ?? this.state()?.members?.length ?? 0;
    return Array.from({ length: Math.max(max, 1) }, (_, i) => i + 1);
  });

  memberCount = computed(() => this.state()?.members?.length ?? 0);

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

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = params['sessionId'];
      if (this.sessionId) {
        this.loadLobby(this.sessionId);
        const userId = localStorage.getItem('gwf_userId') ?? '';
        this.wsService.connect(this.sessionId, userId, 'session');
        this.subscribeToLobbyEvents();
      }
    });
  }

  ngOnDestroy() {
    this.clearStartStatusPoll();
    if (!this.hasLeft && this.sessionId) {
      this.sessionService.leaveSession(this.sessionId).subscribe();
    }
    this.wsService.disconnect();
  }

  private subscribeToLobbyEvents() {
    this.wsService.on('MEMBER_JOINED').subscribe(() => this.loadLobby(this.sessionId));

    this.wsService.on('MEMBER_READY').subscribe((data: any) => {
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

  toggleReady() {
    const next = !this.isReady();
    this.sessionService.updateReadyStatus({
      sessionId: Number(this.state()!.session.id),
      isReady: next
    }).subscribe(() => {
      this.isReady.set(next);
      this.loadLobby(this.sessionId);
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
    const targetUrl = `/live-session/room/${sessionId}`;

    void this.router.navigateByUrl(targetUrl)
      .then((navigated) => {
        if (navigated === false && window.location.pathname !== targetUrl) {
          window.location.assign(targetUrl);
        }
      })
      .catch(() => {
        if (window.location.pathname !== targetUrl) {
          window.location.assign(targetUrl);
        }
      });
  }
}

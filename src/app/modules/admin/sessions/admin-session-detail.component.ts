import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import {
  LucideAngularModule,
  ChevronLeft, Activity, User, Users, Calendar, Clock, TrendingUp, AlertTriangle,
  Headphones, Play, Pause, Download, Loader, AudioLines, AlertCircle, Mic,
} from 'lucide-angular';
import { SkeletonComponent, SkeletonCardComponent } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, SkeletonComponent, SkeletonCardComponent],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/sessions"
          class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (session()) {
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
              <i-lucide [img]="SessionIcon" size="22" class="text-gw-primary"></i-lucide>
            </div>
            <div>
              <h2 class="text-xl font-black text-gw-text">{{ session()!.sessionName }}</h2>
              <span class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                [class]="statusBgClass(session()!.status)">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  [class]="statusDotClass(session()!.status)"></span>
                {{ statusLabel(session()!.status) }}
              </span>
            </div>
          </div>
        } @else if (sessionLoading()) {
          <div class="flex items-center gap-4">
            <app-skeleton width="48px" height="48px" rounded="2xl" [block]="false"></app-skeleton>
            <div class="flex flex-col gap-2">
              <app-skeleton width="180px" height="20px" rounded="sm"></app-skeleton>
              <app-skeleton width="90px" height="12px" rounded="sm"></app-skeleton>
            </div>
          </div>
        }
      </div>

      @if (sessionLoading()) {
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <app-skeleton-card [avatar]="false" [bodyLines]="4"></app-skeleton-card>
            <app-skeleton-card [avatar]="true" [bodyLines]="3"></app-skeleton-card>
          </div>
          <div class="space-y-6">
            <app-skeleton-card [avatar]="false" [bodyLines]="5"></app-skeleton-card>
          </div>
        </div>
      }

      @if (!session() && !sessionLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="SessionIcon" size="28" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="font-black text-gw-text">Session not found</p>
          <a routerLink="/admin/sessions" class="text-sm font-bold text-gw-primary hover:underline">Back to Sessions</a>
        </div>
      }

      @if (session()) {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Left: Session Info + Recording Player -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Session Info -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Session Info</h3>
              </div>
              <div class="p-5 grid sm:grid-cols-2 gap-4">

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <span class="text-[11px] font-black text-gw-text-muted w-[16px] text-center flex-shrink-0">#</span>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Join Code</p>
                    <p class="text-sm font-bold text-gw-text tracking-widest mt-0.5">{{ session()!.joinCode || '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="UserIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Host</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ session()!.hostName || '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="UsersIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Members</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ session()!.memberCount }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="CalendarIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Date</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">
                      {{ session()!.sessionDate | date:'d MMM y, h:mm a' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="ClockIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Duration</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">
                      {{ session()!.durationMin > 0 ? session()!.durationMin + ' min' : '—' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="ScoreIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
                    <p class="text-sm font-bold mt-0.5" [class]="fluencyClass(session()!.avgFluency)">
                      {{ session()!.avgFluency > 0 ? (session()!.avgFluency | number:'1.0-1') + '%' : '—' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl sm:col-span-2">
                  <i-lucide [img]="MistakeIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Mistakes</p>
                    <p class="text-sm font-bold mt-0.5"
                      [class]="session()!.mistakeCount > 0 ? 'text-red-500' : 'text-gw-text'">
                      {{ session()!.mistakeCount }}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <!-- ── Session Recording (music-player style) ───────────────────── -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border flex items-center justify-between">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Session Recording</h3>
                @if (rec(); as r) {
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    [class]="recStatusClass(r.status)">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="recDotClass(r.status)"></span>
                    {{ recStatusLabel(r.status) }}
                  </span>
                }
              </div>

              <!-- Loading -->
              @if (recLoading()) {
                <div class="p-5">
                  <app-skeleton-card [avatar]="true" [bodyLines]="3"></app-skeleton-card>
                </div>
              }

              <!-- No recording -->
              @else if (!rec()) {
                <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                  <div class="w-14 h-14 rounded-2xl bg-gw-bg flex items-center justify-center">
                    <i-lucide [img]="RecordingsIcon" size="24" class="text-gw-text-muted"></i-lucide>
                  </div>
                  <p class="text-sm font-bold text-gw-text">No recording for this session</p>
                  <p class="text-xs text-gw-text-muted max-w-xs">Recording was not enabled by the host, or no audio was captured.</p>
                </div>
              }

              <!-- Ready → full player -->
              @else if (isReady() && rec()!.audioUrl) {
                <div class="p-5">
                  <!-- Hero -->
                  <div class="rounded-2xl p-5 bg-gradient-to-br from-gw-primary to-indigo-600 text-white relative overflow-hidden">
                    <div class="flex items-center gap-4">
                      <!-- Album art / equalizer -->
                      <div class="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                        @if (isPlaying()) {
                          <div class="flex items-end gap-1 h-7">
                            <span class="w-1 bg-white rounded-full eq-bar" style="animation-delay:0ms"></span>
                            <span class="w-1 bg-white rounded-full eq-bar" style="animation-delay:150ms"></span>
                            <span class="w-1 bg-white rounded-full eq-bar" style="animation-delay:300ms"></span>
                            <span class="w-1 bg-white rounded-full eq-bar" style="animation-delay:450ms"></span>
                          </div>
                        } @else {
                          <i-lucide [img]="WaveIcon" size="26" class="text-white"></i-lucide>
                        }
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-base font-black truncate">{{ session()!.sessionName }}</p>
                        <p class="text-xs text-white/70 mt-0.5">Full session · {{ rec()!.segmentCount || 0 }} turns · {{ (rec()!.format || 'm4a') | uppercase }}</p>
                        <div class="flex items-center gap-3 mt-2 text-[11px] text-white/80">
                          <span class="inline-flex items-center gap-1">
                            <i-lucide [img]="ClockIcon" size="12"></i-lucide>{{ formatTime(displayDuration()) }}
                          </span>
                          <span class="inline-flex items-center gap-1">
                            <i-lucide [img]="CalendarIcon" size="12"></i-lucide>{{ rec()!.createdAt | date:'d MMM y' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Scrubber -->
                    <div class="mt-5">
                      <input type="range" min="0" step="0.1"
                        [max]="displayDuration() || 0"
                        [value]="currentTime()"
                        (input)="seek(audioEl, $event)"
                        class="gw-scrubber w-full"
                        [style.--gw-pct.%]="progressPct()" />
                      <div class="flex items-center justify-between mt-1.5 text-[11px] font-bold text-white/80 tabular-nums">
                        <span>{{ formatTime(currentTime()) }}</span>
                        <span>{{ formatTime(displayDuration()) }}</span>
                      </div>
                    </div>

                    <!-- Controls -->
                    <div class="flex items-center justify-center gap-6 mt-3">
                      <button (click)="skip(audioEl, -10)" aria-label="Back 10 seconds"
                        class="text-white/80 hover:text-white transition-colors text-xs font-black w-11 h-11 flex items-center justify-center">−10s</button>
                      <button (click)="togglePlay(audioEl)"
                        [attr.aria-label]="isPlaying() ? 'Pause' : 'Play'"
                        class="w-16 h-16 rounded-full bg-white text-gw-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        <i-lucide [img]="isPlaying() ? PauseIcon : PlayIcon" size="28" [class]="isPlaying() ? '' : 'ml-0.5'"></i-lucide>
                      </button>
                      <button (click)="skip(audioEl, 10)" aria-label="Forward 10 seconds"
                        class="text-white/80 hover:text-white transition-colors text-xs font-black w-11 h-11 flex items-center justify-center">+10s</button>
                    </div>

                    <audio #audioEl [src]="rec()!.audioUrl" preload="metadata"
                      (loadedmetadata)="onMeta(audioEl)"
                      (timeupdate)="onTime(audioEl)"
                      (play)="isPlaying.set(true)"
                      (pause)="isPlaying.set(false)"
                      (ended)="onEnded()"
                      class="hidden"></audio>
                  </div>

                  <!-- Participants + download -->
                  <div class="mt-4 flex flex-wrap items-center gap-2">
                    @for (p of rec()!.participants ?? []; track p.userId) {
                      <span class="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 bg-gw-bg rounded-full">
                        <span class="w-5 h-5 rounded-full bg-gw-primary/15 text-gw-primary text-[10px] font-black flex items-center justify-center">
                          {{ initials(p.name) }}
                        </span>
                        <span class="text-xs font-bold text-gw-text">{{ p.name }}</span>
                        <span class="text-[10px] text-gw-text-muted">· {{ p.turns }}</span>
                      </span>
                    }
                    <a [href]="rec()!.audioUrl" target="_blank" rel="noopener" download
                      class="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gw-primary/10 text-gw-primary text-xs font-black hover:bg-gw-primary/20 transition-colors">
                      <i-lucide [img]="DownloadIcon" size="14"></i-lucide> Download
                    </a>
                  </div>
                </div>
              }

              <!-- Processing / pending -->
              @else if (isProcessing()) {
                <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                  <div class="w-14 h-14 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
                    <i-lucide [img]="LoaderIcon" size="24" class="text-gw-primary animate-spin"></i-lucide>
                  </div>
                  <p class="text-sm font-bold text-gw-text">Preparing the recording…</p>
                  <p class="text-xs text-gw-text-muted max-w-xs">We're merging this session's audio into one file. This usually takes a moment — refresh to check.</p>
                  <button (click)="reload()"
                    class="mt-1 px-4 py-2 rounded-xl bg-gw-primary text-white text-xs font-black active:scale-95 transition-transform">
                    Refresh
                  </button>
                </div>
              }

              <!-- Failed -->
              @else {
                <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                  <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                    <i-lucide [img]="AlertCircleIcon" size="24" class="text-red-500"></i-lucide>
                  </div>
                  <p class="text-sm font-bold text-gw-text">Recording couldn't be processed</p>
                  @if (rec()!.failureReason) {
                    <p class="text-xs text-gw-text-muted max-w-sm">{{ rec()!.failureReason }}</p>
                  }
                  @if (isNoSegmentsFailure()) {
                    <p class="text-xs text-gw-text-muted max-w-sm italic">
                      This usually isn't a server error — participants may have used an app version that
                      couldn't capture audio.
                    </p>
                  }
                  <button (click)="reload()"
                    class="mt-1 px-4 py-2 rounded-xl bg-gw-bg text-gw-text text-xs font-black active:scale-95 transition-transform">
                    Try again
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Right: Quick Stats -->
          <div class="space-y-4">
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Summary</h3>
              </div>
              <div class="p-5 space-y-3">
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Members</span>
                  <span class="text-sm font-black text-gw-text">{{ session()!.memberCount }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Duration</span>
                  <span class="text-sm font-black text-gw-text">
                    {{ session()!.durationMin > 0 ? session()!.durationMin + ' min' : '—' }}
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Avg Score</span>
                  <span class="text-sm font-black" [class]="fluencyClass(session()!.avgFluency)">
                    {{ session()!.avgFluency > 0 ? (session()!.avgFluency | number:'1.0-1') + '%' : '—' }}
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Mistakes</span>
                  <span class="text-sm font-black"
                    [class]="session()!.mistakeCount > 0 ? 'text-red-500' : 'text-gw-text'">
                    {{ session()!.mistakeCount }}
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Recording</span>
                  <span class="text-sm font-black" [class]="rec() ? 'text-gw-text' : 'text-gw-text-muted'">
                    {{ rec() ? recStatusLabel(rec()!.status) : 'None' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Equalizer bars (playing state) */
    .eq-bar {
      height: 30%;
      animation: gw-eq 0.9s ease-in-out infinite;
    }
    @keyframes gw-eq {
      0%, 100% { height: 25%; }
      50%      { height: 100%; }
    }

    /* Music-player scrubber */
    .gw-scrubber {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 9999px;
      background: linear-gradient(to right,
        #ffffff var(--gw-pct, 0%),
        rgba(255,255,255,0.28) var(--gw-pct, 0%));
      cursor: pointer;
    }
    .gw-scrubber::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px; height: 16px;
      border-radius: 9999px;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .gw-scrubber::-moz-range-thumb {
      width: 16px; height: 16px;
      border: none;
      border-radius: 9999px;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
  `]
})
export class AdminSessionDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly BackIcon       = ChevronLeft;
  readonly SessionIcon    = Activity;
  readonly UserIcon       = User;
  readonly UsersIcon      = Users;
  readonly CalendarIcon   = Calendar;
  readonly ClockIcon      = Clock;
  readonly ScoreIcon      = TrendingUp;
  readonly MistakeIcon    = AlertTriangle;
  readonly RecordingsIcon = Headphones;
  readonly PlayIcon       = Play;
  readonly PauseIcon      = Pause;
  readonly DownloadIcon   = Download;
  readonly LoaderIcon     = Loader;
  readonly WaveIcon       = AudioLines;
  readonly AlertCircleIcon = AlertCircle;
  readonly MicIcon        = Mic;

  session        = signal<any>(null);
  sessionLoading = signal(false);
  rec            = signal<any | null>(null);
  recLoading     = signal(false);

  // Player state
  isPlaying   = signal(false);
  currentTime = signal(0);
  duration    = signal(0);

  private sessionId: string | number | null = null;

  // Prefer real <audio> duration; fall back to the server-reported durationSecs.
  displayDuration = computed(() => this.duration() || Number(this.rec()?.durationSecs) || 0);
  progressPct     = computed(() => {
    const d = this.displayDuration();
    return d > 0 ? Math.min(100, (this.currentTime() / d) * 100) : 0;
  });

  isReady      = computed(() => (this.rec()?.status ?? '').toUpperCase() === 'READY');
  isProcessing = computed(() => ['PENDING_MERGE', 'PROCESSING', 'CAPTURING'].includes((this.rec()?.status ?? '').toUpperCase()));
  // "No audio segments" failures are almost always a capture-platform limitation (e.g. an older
  // app build that couldn't record), NOT a server/merge bug — surface a hint so admins don't misread it.
  isNoSegmentsFailure = computed(() => (this.rec()?.failureReason ?? '').toLowerCase().includes('no audio segments'));

  ngOnInit() {
    const state = history.state;
    if (state?.session) {
      this.session.set(state.session);
      this.sessionId = state.session.sessionId;
      this.loadRecording(state.session.sessionId);
    } else {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.sessionId = params['id'];
          this.loadSession(params['id']);
          this.loadRecording(params['id']);
        }
      });
    }
  }

  // Direct navigation / refresh: no router state, so fetch the session summary by id.
  loadSession(sessionId: string | number) {
    this.sessionLoading.set(true);
    this.adminService.getSession(sessionId).subscribe({
      next: s => { this.session.set(s); this.sessionLoading.set(false); },
      error: () => this.sessionLoading.set(false)
    });
  }

  loadRecording(sessionId: string | number) {
    this.recLoading.set(true);
    this.resetPlayer();
    this.adminService.getSessionRecording(sessionId).subscribe({
      next: r => { this.rec.set(r); this.recLoading.set(false); },
      error: () => this.recLoading.set(false)
    });
  }

  reload() {
    if (this.sessionId != null) this.loadRecording(this.sessionId);
  }

  // ── Player controls ────────────────────────────────────────────────
  togglePlay(audio: HTMLAudioElement) {
    if (audio.paused) { audio.play().catch(() => this.toast.error('Unable to play this recording.')); }
    else { audio.pause(); }
  }

  skip(audio: HTMLAudioElement, secs: number) {
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
  }

  seek(audio: HTMLAudioElement, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    audio.currentTime = value;
    this.currentTime.set(value);
  }

  onMeta(audio: HTMLAudioElement) {
    if (isFinite(audio.duration)) this.duration.set(audio.duration);
  }

  onTime(audio: HTMLAudioElement) {
    this.currentTime.set(audio.currentTime);
  }

  onEnded() {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  private resetPlayer() {
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
  }

  // ── Formatting helpers ─────────────────────────────────────────────
  formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  // ── Recording status styling ───────────────────────────────────────
  recStatusLabel(status: string): string {
    switch ((status ?? '').toUpperCase()) {
      case 'READY':         return 'Ready';
      case 'PROCESSING':    return 'Processing';
      case 'PENDING_MERGE': return 'Processing';
      case 'CAPTURING':     return 'Recording';
      case 'FAILED':        return 'Failed';
      default:              return status ?? '—';
    }
  }

  recStatusClass(status: string): string {
    switch ((status ?? '').toUpperCase()) {
      case 'READY':  return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-600';
      default:       return 'bg-orange-100 text-orange-600';
    }
  }

  recDotClass(status: string): string {
    switch ((status ?? '').toUpperCase()) {
      case 'READY':  return 'bg-green-500';
      case 'FAILED': return 'bg-red-400';
      default:       return 'bg-orange-400 animate-pulse';
    }
  }

  // ── Session status styling ─────────────────────────────────────────
  statusBgClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':   return 'bg-green-100 text-green-700';
      case 'ABANDONED':   return 'bg-red-100 text-red-600';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-600';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }

  statusDotClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':   return 'bg-green-500';
      case 'ABANDONED':   return 'bg-red-400';
      case 'IN_PROGRESS': return 'bg-orange-400';
      default:            return 'bg-gray-400';
    }
  }

  statusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':   return 'Completed';
      case 'ABANDONED':   return 'Abandoned';
      case 'IN_PROGRESS': return 'In Progress';
      default:            return status ?? '—';
    }
  }

  fluencyClass(score: number): string {
    const n = Number(score);
    if (!n || n <= 0) return 'text-gw-text-muted';
    if (n >= 80) return 'text-green-600';
    if (n >= 50) return 'text-orange-500';
    return 'text-red-500';
  }
}

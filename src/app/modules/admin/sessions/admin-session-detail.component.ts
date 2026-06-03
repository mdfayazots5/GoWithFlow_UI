import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import {
  LucideAngularModule,
  ChevronLeft, Activity, User, Users, Calendar, Clock, TrendingUp, AlertTriangle,
  Headphones, Play, Pause,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
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
              <span class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                [class]="statusBgClass(session()!.status)">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  [class]="statusDotClass(session()!.status)"></span>
                {{ statusLabel(session()!.status) }}
              </span>
            </div>
          </div>
        } @else {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        }
      </div>

      @if (!session()) {
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

          <!-- Left: Session Info + Recordings -->
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
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Join Code</p>
                    <p class="text-sm font-bold text-gw-text tracking-widest mt-0.5">{{ session()!.joinCode || '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="UserIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Host</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ session()!.hostName || '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="UsersIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Members</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ session()!.memberCount }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="CalendarIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Date</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">
                      {{ session()!.sessionDate | date:'d MMM y, h:mm a' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="ClockIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Duration</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">
                      {{ session()!.durationMin > 0 ? session()!.durationMin + ' min' : '—' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="ScoreIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
                    <p class="text-sm font-bold mt-0.5" [class]="fluencyClass(session()!.avgFluency)">
                      {{ session()!.avgFluency > 0 ? (session()!.avgFluency | number:'1.0-1') + '%' : '—' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl sm:col-span-2">
                  <i-lucide [img]="MistakeIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Mistakes</p>
                    <p class="text-sm font-bold mt-0.5"
                      [class]="session()!.mistakeCount > 0 ? 'text-red-500' : 'text-gw-text'">
                      {{ session()!.mistakeCount }}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <!-- Recordings -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Recordings</h3>
              </div>

              @if (recordingsLoading()) {
                <div class="flex items-center justify-center py-10 gap-2 text-gw-text-muted">
                  <div class="w-5 h-5 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm font-medium">Loading recordings...</span>
                </div>
              } @else if (recordings().length === 0) {
                <div class="flex items-center justify-center gap-2 py-10 text-gw-text-muted">
                  <i-lucide [img]="RecordingsIcon" size="16"></i-lucide>
                  <span class="text-sm font-medium italic">No audio recordings for this session.</span>
                </div>
              } @else {
                <div class="p-5 grid sm:grid-cols-2 gap-3">
                  @for (clip of recordings(); track clip.archiveId) {
                    <div class="bg-gw-bg rounded-xl p-4 space-y-3">
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-black text-gw-text truncate">{{ clip.userName }}</p>
                          <p class="text-[10px] text-gw-text-muted mt-0.5">Turn {{ clip.turnIndex }}</p>
                        </div>
                        <button
                          (click)="togglePlay(clip)"
                          class="w-9 h-9 flex items-center justify-center rounded-xl bg-gw-primary/10 text-gw-primary hover:bg-gw-primary/20 transition-colors flex-shrink-0">
                          <i-lucide [img]="playingClipId() === clip.archiveId ? PauseIcon : PlayIcon" size="16"></i-lucide>
                        </button>
                      </div>
                      @if (playingClipId() === clip.archiveId) {
                        <audio [src]="clip.audioUrl" controls autoplay
                          (ended)="playingClipId.set(null)"
                          class="w-full h-8 rounded-lg">
                        </audio>
                      }
                    </div>
                  }
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
                  <span class="text-xs font-bold text-gw-text-muted uppercase tracking-wider">Recordings</span>
                  <span class="text-sm font-black text-gw-text">{{ recordings().length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminSessionDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly BackIcon      = ChevronLeft;
  readonly SessionIcon   = Activity;
  readonly UserIcon      = User;
  readonly UsersIcon     = Users;
  readonly CalendarIcon  = Calendar;
  readonly ClockIcon     = Clock;
  readonly ScoreIcon     = TrendingUp;
  readonly MistakeIcon   = AlertTriangle;
  readonly RecordingsIcon = Headphones;
  readonly PlayIcon      = Play;
  readonly PauseIcon     = Pause;

  session          = signal<any>(null);
  recordings       = signal<any[]>([]);
  recordingsLoading = signal(false);
  playingClipId    = signal<number | null>(null);

  ngOnInit() {
    const state = history.state;
    if (state?.session) {
      this.session.set(state.session);
      this.loadRecordings(state.session.sessionId);
    } else {
      this.route.params.subscribe(params => {
        if (params['id']) this.loadRecordings(params['id']);
      });
    }
  }

  loadRecordings(sessionId: string | number) {
    this.recordingsLoading.set(true);
    this.adminService.getSessionRecordings(sessionId).subscribe({
      next: clips => { this.recordings.set(clips); this.recordingsLoading.set(false); },
      error: () => this.recordingsLoading.set(false)
    });
  }

  togglePlay(clip: any) {
    this.playingClipId.set(this.playingClipId() === clip.archiveId ? null : clip.archiveId);
  }

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

// File: src/app/modules/session/session-list/session-list.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  History, ChevronRight, RotateCcw,
  Zap, Users, Mic2, BookOpen, MessageSquare, Layout,
  Loader2, Trophy, CheckCircle2, XCircle, Clock, BarChart2
} from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { Session } from '@core/models/session.model';

const MODE_ICON: Record<string, any> = {
  'Grammar Drill':     MessageSquare,
  'Roleplay':          Users,
  'Mock Interview':    Layout,
  'Vocabulary Sprint': Zap,
  'Fluency Drill':     Mic2,
  'Repractice Round':  RotateCcw,
};

const MODE_COLOR: Record<string, string> = {
  'Grammar Drill':     '#3D5A99',
  'Roleplay':          '#E07B39',
  'Mock Interview':    '#5C35A8',
  'Vocabulary Sprint': '#F59E0B',
  'Fluency Drill':     '#2E7D32',
  'Repractice Round':  '#C62828',
};

const MODE_BG: Record<string, string> = {
  'Grammar Drill':     'rgba(61,90,153,0.08)',
  'Roleplay':          'rgba(224,123,57,0.08)',
  'Mock Interview':    'rgba(92,53,168,0.08)',
  'Vocabulary Sprint': 'rgba(245,158,11,0.08)',
  'Fluency Drill':     'rgba(46,125,50,0.08)',
  'Repractice Round':  'rgba(198,40,40,0.08)',
};

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-4 animate-in fade-in duration-500">

        <!-- ── Page Heading ─────────────────────────────────────── -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
            <i-lucide [img]="HistoryIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight">Session History</h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Your past practice records</p>
          </div>
        </div>

        <!-- ── Stat Cards (Progress-style 2×2 grid) ──────────────── -->
        @if (!loading()) {
          <div class="grid grid-cols-2 gap-3">

            <!-- Completed -->
            <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm
                        flex flex-col gap-3 relative overflow-hidden">
              <div class="absolute -right-3 -bottom-3 opacity-[0.06]">
                <i-lucide [img]="CheckIcon" size="72"></i-lucide>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style="background:#ECFDF5;">
                  <i-lucide [img]="CheckIcon" size="14" style="color:#2E7D32;"></i-lucide>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">Completed</span>
              </div>
              <p class="text-2xl font-black text-gw-text tracking-tight leading-none">{{ stats().completed }}</p>
            </div>

            <!-- Abandoned -->
            <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm
                        flex flex-col gap-3 relative overflow-hidden">
              <div class="absolute -right-3 -bottom-3 opacity-[0.06]">
                <i-lucide [img]="XIcon" size="72"></i-lucide>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style="background:rgba(198,40,40,0.08);">
                  <i-lucide [img]="XIcon" size="14" style="color:#C62828;"></i-lucide>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">Abandoned</span>
              </div>
              <p class="text-2xl font-black text-gw-text tracking-tight leading-none">{{ stats().abandoned }}</p>
            </div>

            <!-- In Progress -->
            <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm
                        flex flex-col gap-3 relative overflow-hidden">
              <div class="absolute -right-3 -bottom-3 opacity-[0.06]">
                <i-lucide [img]="ClockIcon" size="72"></i-lucide>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style="background:#EEF2FF;">
                  <i-lucide [img]="ClockIcon" size="14" style="color:#3D5A99;"></i-lucide>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">In Progress</span>
              </div>
              <p class="text-2xl font-black text-gw-text tracking-tight leading-none">{{ stats().inProgress }}</p>
            </div>

            <!-- Total -->
            <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm
                        flex flex-col gap-3 relative overflow-hidden">
              <div class="absolute -right-3 -bottom-3 opacity-[0.06]">
                <i-lucide [img]="BarIcon" size="72"></i-lucide>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style="background:rgba(92,53,168,0.08);">
                  <i-lucide [img]="BarIcon" size="14" style="color:#5C35A8;"></i-lucide>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">Total</span>
              </div>
              <p class="text-2xl font-black text-gw-text tracking-tight leading-none">{{ stats().total }}</p>
            </div>

          </div>
        } @else {
          <!-- Skeleton for stat cards while loading -->
          <div class="grid grid-cols-2 gap-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm animate-pulse space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-gw-bg rounded-lg shrink-0"></div>
                  <div class="h-2.5 bg-gw-bg rounded-lg flex-1"></div>
                </div>
                <div class="h-8 bg-gw-bg rounded-lg w-1/2"></div>
              </div>
            }
          </div>
        }

        <!-- ── Section Header ───────────────────────────────────── -->
        @if (!loading() && allItems().length > 0) {
          <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-secondary pl-3">
            All Sessions
          </h3>
        }

        <!-- ── Loading Skeletons (list) ─────────────────────────── -->
        @if (loading()) {
          <div class="grid gap-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex items-center gap-4 animate-pulse">
                <div class="w-12 h-12 bg-gw-bg rounded-2xl shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-gw-bg rounded-lg w-3/4"></div>
                  <div class="h-2.5 bg-gw-bg rounded-lg w-1/2"></div>
                  <div class="h-5 bg-gw-bg rounded-full w-20"></div>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <div class="h-7 w-12 bg-gw-bg rounded-lg"></div>
                  <div class="h-2.5 w-10 bg-gw-bg rounded-lg"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ── Empty State ──────────────────────────────────────── -->
        @else if (allItems().length === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                      flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="TrophyIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No sessions yet</p>
            <p class="text-xs text-gw-text-muted max-w-[200px]">
              Join a session to start tracking your progress.
            </p>
          </div>
        }

        <!-- ── Session Cards ────────────────────────────────────── -->
        @else {
          <div class="grid gap-3">
            @for (s of allItems(); track s.id) {
              <a [routerLink]="['/session/detail', s.id]"
                 class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4
                        flex items-center gap-4 no-underline
                        hover:border-gw-primary active:scale-[0.98]
                        transition-all duration-150">

                <!-- Mode icon -->
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                     [style.background]="modeBg(s.sessionMode)">
                  <i-lucide [img]="modeIcon(s.sessionMode)" size="20"
                            [style.color]="modeColor(s.sessionMode)"></i-lucide>
                </div>

                <!-- Session info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gw-text truncate leading-tight">
                    {{ s.sessionName }}
                  </p>
                  <p class="text-[11px] text-gw-text-muted mt-0.5">
                    {{ s.createdDate | date:'MMM d, yyyy' }}&nbsp;·&nbsp;{{ s.sessionDuration }} min
                    @if (s.mistakesCount) {
                      &nbsp;·&nbsp;<span style="color:#C62828;">{{ s.mistakesCount }} error{{ s.mistakesCount === 1 ? '' : 's' }}</span>
                    }
                  </p>
                  <span class="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                        [style.background]="statusBg(s.status)"
                        [style.color]="statusColor(s.status)">
                    {{ s.status | titlecase }}
                  </span>
                </div>

                <!-- Fluency score -->
                <div class="flex flex-col items-end gap-0.5 shrink-0">
                  @if (s.fluencyScore !== null && s.fluencyScore !== undefined) {
                    <span class="text-xl font-black leading-none"
                          [style.color]="scoreColor(s.fluencyScore!)">
                      {{ s.fluencyScore | number:'1.0-0' }}%
                    </span>
                    <span class="text-[10px] font-bold text-gw-text-muted uppercase tracking-widest">Fluency</span>
                  } @else {
                    <i-lucide [img]="ChevronIcon" size="18" class="text-gw-text-muted"></i-lucide>
                  }
                </div>

              </a>
            }
          </div>

          <!-- ── Load More ──────────────────────────────────────── -->
          @if (hasMore()) {
            <button (click)="loadMore()"
                    [disabled]="loadingMore()"
                    class="w-full py-3 rounded-2xl bg-white border border-gw-card-border
                           text-[11px] font-black uppercase tracking-widest text-gw-text-muted
                           hover:border-gw-primary hover:text-gw-primary transition-all
                           flex items-center justify-center gap-2 disabled:opacity-50">
              @if (loadingMore()) {
                <i-lucide [img]="LoaderIcon" size="14" class="animate-spin"></i-lucide>
                Loading...
              } @else {
                Load More
              }
            </button>
          }
        }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SessionListComponent implements OnInit {
  private sessionService = inject(SessionService);

  readonly HistoryIcon = History;
  readonly ChevronIcon = ChevronRight;
  readonly LoaderIcon  = Loader2;
  readonly TrophyIcon  = Trophy;
  readonly CheckIcon   = CheckCircle2;
  readonly XIcon       = XCircle;
  readonly ClockIcon   = Clock;
  readonly BarIcon     = BarChart2;

  loading     = signal(true);
  loadingMore = signal(false);

  allItems  = signal<Session[]>([]);
  private total = 0;
  private page  = 1;

  hasMore = computed(() => this.allItems().length < this.total);

  // Derived stats — update reactively whenever allItems changes
  stats = computed(() => {
    const items = this.allItems();
    return {
      completed:  items.filter(s => s.status === 'COMPLETED').length,
      abandoned:  items.filter(s => s.status === 'ABANDONED').length,
      inProgress: items.filter(s => s.status === 'LOBBY' || s.status === 'ACTIVE' || s.status === 'PAUSED').length,
      total:      this.total || items.length,
    };
  });

  ngOnInit() { this.load(); }

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.load(true);
  }

  private load(append = false) {
    this.sessionService.getSessionHistory().subscribe({
      next: (res: any) => {
        const items: Session[] = res.items ?? [];
        this.total = res.totalCount ?? res.total ?? items.length;
        this.allItems.update(prev => append ? [...prev, ...items] : items);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  modeIcon(mode: string)  { return MODE_ICON[mode]  ?? BookOpen; }
  modeColor(mode: string) { return MODE_COLOR[mode] ?? '#3D5A99'; }
  modeBg(mode: string)    { return MODE_BG[mode]    ?? 'rgba(61,90,153,0.08)'; }

  scoreBg(score: number): string {
    if (score >= 80) return 'rgba(46,125,50,0.10)';
    if (score >= 60) return 'rgba(245,158,11,0.10)';
    return 'rgba(198,40,40,0.10)';
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#2E7D32';
    if (score >= 60) return '#B45309';
    return '#C62828';
  }

  statusBg(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'rgba(46,125,50,0.10)';
      case 'ACTIVE':    return 'rgba(61,90,153,0.10)';
      case 'LOBBY':     return 'rgba(245,158,11,0.10)';
      case 'PAUSED':    return 'rgba(245,158,11,0.10)';
      case 'ABANDONED': return 'rgba(198,40,40,0.08)';
      default:          return 'rgba(100,116,139,0.08)';
    }
  }

  statusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return '#2E7D32';
      case 'ACTIVE':    return '#3D5A99';
      case 'LOBBY':     return '#B45309';
      case 'PAUSED':    return '#B45309';
      case 'ABANDONED': return '#C62828';
      default:          return '#64748B';
    }
  }
}

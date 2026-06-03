// File: src/app/modules/session/history/session-history.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  History, ChevronRight, FileText, RotateCcw,
  Zap, Users, Mic2, BookOpen, MessageSquare, Layout,
  CheckCircle2, Clock, AlertCircle, Loader2, Trophy
} from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { RouterLink } from '@angular/router';

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

const FILTERS = ['All', 'COMPLETED', 'LOBBY', 'ABANDONED'] as const;
type Filter = typeof FILTERS[number];

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

        <!-- ── Page Heading ─────────────────────────────────────── -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight leading-tight">Session History</h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Your past practice records</p>
          </div>
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
               style="background: rgba(61,90,153,0.08);">
            <i-lucide [img]="HistoryIcon" size="18" style="color:#3D5A99;"></i-lucide>
          </div>
        </div>

        <!-- ── Filter Tabs ───────────────────────────────────────── -->
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          @for (f of filters; track f) {
            <button (click)="setFilter(f)"
                    class="shrink-0 h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest
                           transition-all border"
                    [class.bg-gw-primary]="activeFilter() === f"
                    [class.text-white]="activeFilter() === f"
                    [class.border-gw-primary]="activeFilter() === f"
                    [class.bg-white]="activeFilter() !== f"
                    [class.text-gw-text-muted]="activeFilter() !== f"
                    [class.border-gw-card-border]="activeFilter() !== f">
              {{ f === 'All' ? 'All' : f | titlecase }}
            </button>
          }
        </div>

        <!-- ── Loading Skeletons ────────────────────────────────── -->
        @if (loading()) {
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-[76px] bg-white rounded-2xl border border-gw-card-border animate-pulse"></div>
          }
        }

        <!-- ── Empty State ──────────────────────────────────────── -->
        @else if (items().length === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                      flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="TrophyIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No sessions yet</p>
            <p class="text-xs text-gw-text-muted">
              {{ activeFilter() === 'All' ? 'Join a session to start tracking your progress.' : 'No ' + (activeFilter() | titlecase) + ' sessions found.' }}
            </p>
          </div>
        }

        <!-- ── Session List ─────────────────────────────────────── -->
        @else {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="divide-y divide-gw-bg">
              @for (s of items(); track s.id) {
                <div class="flex items-center gap-3.5 px-4 py-3.5
                            hover:bg-gw-bg/50 transition-colors">

                  <!-- Mode icon -->
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       [style.background]="modeBg(s.sessionMode)">
                    <i-lucide [img]="modeIcon(s.sessionMode)" size="18"
                              [style.color]="modeColor(s.sessionMode)"></i-lucide>
                  </div>

                  <!-- Meta -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate leading-tight">
                      {{ s.sessionName }}
                    </p>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="text-[10px] font-semibold text-gw-text-muted">
                        {{ s.createdDate | date:'MMM d, yyyy' }}
                      </span>
                      <span class="text-[10px] font-semibold text-gw-text-muted">·</span>
                      <span class="text-[10px] font-semibold text-gw-text-muted">
                        {{ s.sessionDuration }} min
                      </span>
                      @if (s.mistakesCount) {
                        <span class="text-[10px] font-semibold text-gw-text-muted">·</span>
                        <span class="text-[10px] font-semibold"
                              style="color:#C62828;">
                          {{ s.mistakesCount }} error{{ s.mistakesCount === 1 ? '' : 's' }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Score + status -->
                  <div class="flex flex-col items-end gap-1.5 shrink-0">
                    @if (s.fluencyScore !== null && s.fluencyScore !== undefined) {
                      <span class="text-[11px] font-black px-2 py-0.5 rounded-lg"
                            [style.background]="scoreBg(s.fluencyScore)"
                            [style.color]="scoreColor(s.fluencyScore)">
                        {{ s.fluencyScore | number:'1.0-0' }}%
                      </span>
                    }
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          [style.background]="statusBg(s.status)"
                          [style.color]="statusColor(s.status)">
                      {{ s.status | titlecase }}
                    </span>
                  </div>

                  <!-- Navigate -->
                  <a [routerLink]="['/session/detail', s.id]"
                     class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                            text-gw-text-muted hover:text-gw-primary hover:bg-gw-primary/10
                            transition-all no-underline">
                    <i-lucide [img]="ChevronIcon" size="16"></i-lucide>
                  </a>

                </div>
              }
            </div>
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
  styles: [`:host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SessionHistoryComponent implements OnInit {
  readonly HistoryIcon = History;
  readonly ChevronIcon = ChevronRight;
  readonly ReviewIcon  = FileText;
  readonly LoaderIcon  = Loader2;
  readonly TrophyIcon  = Trophy;

  readonly filters = FILTERS;

  loading     = signal(true);
  loadingMore = signal(false);
  activeFilter = signal<Filter>('All');

  private allItems = signal<any[]>([]);
  private page     = 1;
  private pageSize = 20;
  private total    = 0;

  items   = computed(() => this.allItems());
  hasMore = computed(() => this.allItems().length < this.total);

  constructor(private sessionService: SessionService) {}

  ngOnInit() {
    this.load();
  }

  setFilter(f: Filter) {
    if (this.activeFilter() === f) return;
    this.activeFilter.set(f);
    this.page = 1;
    this.allItems.set([]);
    this.loading.set(true);
    this.load();
  }

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.load(true);
  }

  private load(append = false) {
    const filter = this.activeFilter() === 'All' ? undefined : this.activeFilter();
    this.sessionService.getSessionHistory(filter).subscribe({
      next: (res: any) => {
        const incoming = res.items ?? [];
        this.total = res.totalCount ?? res.total ?? incoming.length;
        this.allItems.update(prev => append ? [...prev, ...incoming] : incoming);
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
      case 'COMPLETED':  return 'rgba(46,125,50,0.10)';
      case 'ACTIVE':     return 'rgba(61,90,153,0.10)';
      case 'LOBBY':      return 'rgba(245,158,11,0.10)';
      case 'ABANDONED':  return 'rgba(198,40,40,0.08)';
      default:           return 'rgba(100,116,139,0.08)';
    }
  }

  statusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':  return '#2E7D32';
      case 'ACTIVE':     return '#3D5A99';
      case 'LOBBY':      return '#B45309';
      case 'ABANDONED':  return '#C62828';
      default:           return '#64748B';
    }
  }
}

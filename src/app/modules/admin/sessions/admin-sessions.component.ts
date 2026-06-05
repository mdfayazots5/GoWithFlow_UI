import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  LucideAngularModule,
  Activity, CheckCircle2, TrendingUp,
  Search, X, Eye,
} from 'lucide-angular';
import { Router } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { AdminLoadMoreComponent } from '@shared/components/admin-load-more/admin-load-more.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';

const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Completed',   value: 'COMPLETED' },
  { label: 'Abandoned',   value: 'ABANDONED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
] as const;

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, AdminLoadMoreComponent],
  template: `
    <div class="max-w-lg mx-auto space-y-4">

      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center shrink-0">
          <i-lucide [img]="SessionIcon" size="20" class="text-gw-primary"></i-lucide>
        </div>
        <div class="min-w-0">
          <h1 class="text-lg font-black text-gw-text tracking-tight leading-tight">Session History</h1>
          <p class="text-[11px] text-gw-text-muted font-semibold">
            {{ loading() ? 'Loading...' : totalCount() + ' sessions recorded' }}
          </p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-2.5">
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-gw-text leading-none">{{ totalCount() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Total</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-green-600 leading-none">{{ completedCount() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Completed</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-blue-500 leading-none">{{ avgFluencyDisplay() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Avg Score</p>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <i-lucide [img]="SearchIcon" size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
        <input [formControl]="searchControl" type="text" placeholder="Search session or host..."
          class="w-full h-11 bg-white border border-gw-card-border rounded-2xl pl-10 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary outline-none transition-all shadow-sm">
      </div>

      <!-- Status pills -->
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        @for (f of statusFilters; track f.value) {
          <button (click)="setStatus(f.value)"
            class="shrink-0 h-8 px-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border"
            [class]="status() === f.value ? 'bg-gw-primary text-white border-gw-primary' : 'bg-white text-gw-text-muted border-gw-card-border'">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Date range -->
      <div class="grid grid-cols-2 gap-2.5">
        <input [formControl]="fromControl" type="date"
          class="h-11 bg-white border border-gw-card-border rounded-2xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary outline-none transition-all shadow-sm">
        <input [formControl]="toControl" type="date"
          class="h-11 bg-white border border-gw-card-border rounded-2xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary outline-none transition-all shadow-sm">
      </div>

      @if (hasActiveFilters()) {
        <button (click)="clearFilters()"
          class="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-[11px] font-black uppercase tracking-widest text-gw-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
          <i-lucide [img]="XIcon" size="13"></i-lucide>
          Clear filters
        </button>
      }

      <!-- Loading Skeletons -->
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="h-[72px] bg-white rounded-2xl border border-gw-card-border animate-pulse"></div>
        }
      }

      <!-- Empty State -->
      @else if (sessions().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="SessionIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">No sessions found</p>
          <p class="text-xs text-gw-text-muted">
            {{ hasActiveFilters() ? 'Try adjusting your filters' : 'No sessions recorded yet' }}
          </p>
        </div>
      }

      <!-- Session List -->
      @else {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="divide-y divide-gw-bg">
            @for (row of sessions(); track row.sessionId) {
              <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gw-bg/50 transition-colors">

                <!-- Icon -->
                <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
                  <i-lucide [img]="SessionIcon" size="16" class="text-gw-primary"></i-lucide>
                </div>

                <!-- Meta -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gw-text truncate leading-tight">{{ row.sessionName }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-[11px] font-semibold text-gw-text-muted">{{ row.memberCount }} member{{ row.memberCount !== 1 ? 's' : '' }}</span>
                    @if (row.joinCode) {
                      <span class="text-[11px] font-black text-gw-primary tracking-widest">{{ row.joinCode }}</span>
                    }
                    <span class="text-[11px] font-semibold text-gw-text-muted">{{ row.sessionDate | date:'MMM d, y' }}</span>
                    @if (row.avgFluency > 0) {
                      <span class="text-[11px] font-black" [class]="fluencyTextClass(row.avgFluency)">{{ row.avgFluency | number:'1.0-0' }}%</span>
                    }
                  </div>
                </div>

                <!-- Status + action -->
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide"
                    [class]="statusBgClass(row.status)">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(row.status)"></span>
                    {{ statusLabel(row.status) }}
                  </span>
                  <button (click)="viewDetails(row)" title="View details"
                    class="w-9 h-9 flex items-center justify-center rounded-lg text-gw-primary hover:bg-gw-primary/10 transition-colors">
                    <i-lucide [img]="ViewIcon" size="15"></i-lucide>
                  </button>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Standardized pager -->
        <app-admin-load-more
          [loading]="loadingMore()" [hasMore]="hasMore()"
          [loaded]="sessions().length" [total]="totalCount()"
          (more)="loadMore()"></app-admin-load-more>
      }
    </div>
  `,
  styles: [`:host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AdminSessionsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);
  private router       = inject(Router);

  readonly SessionIcon   = Activity;
  readonly CompletedIcon = CheckCircle2;
  readonly ScoreIcon     = TrendingUp;
  readonly SearchIcon    = Search;
  readonly XIcon         = X;
  readonly ViewIcon      = Eye;

  readonly statusFilters = STATUS_FILTERS;

  sessions    = signal<any[]>([]);
  loading     = signal(false);
  loadingMore = signal(false);
  totalCount  = signal(0);
  status      = signal('');

  private page     = 0;
  private pageSize = 15;

  searchControl = new FormControl('');
  fromControl   = new FormControl('');
  toControl     = new FormControl('');

  // Stats from loaded rows
  completedCount = computed(() =>
    this.sessions().filter(s => s.status === 'COMPLETED').length
  );

  avgFluencyDisplay = computed(() => {
    const withScore = this.sessions().filter(s => Number(s.avgFluency) > 0);
    if (!withScore.length) return '—';
    const avg = withScore.reduce((sum, s) => sum + Number(s.avgFluency), 0) / withScore.length;
    return avg.toFixed(0) + '%';
  });

  hasMore() {
    return this.sessions().length < this.totalCount();
  }

  ngOnInit() {
    this.load();

    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.refresh());

    this.fromControl.valueChanges.pipe(debounceTime(600)).subscribe(() => this.refresh());
    this.toControl.valueChanges.pipe(debounceTime(600)).subscribe(() => this.refresh());
  }

  load(append = false) {
    this.adminService.getSessionHistory({
      searchTerm: this.searchControl.value || undefined,
      status:     this.status() || undefined,
      fromDate:   this.fromControl.value   || undefined,
      toDate:     this.toControl.value     || undefined,
      pageNumber: this.page + 1,
      pageSize:   this.pageSize,
    }).subscribe({
      next: res => {
        const incoming = res.items || [];
        this.sessions.update(prev => append ? [...prev, ...incoming] : incoming);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.toast.error('Failed to load session history');
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  private refresh() {
    this.page = 0;
    this.sessions.set([]);
    this.loading.set(true);
    this.load();
  }

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.load(true);
  }

  setStatus(value: string) {
    if (this.status() === value) return;
    this.status.set(value);
    this.refresh();
  }

  viewDetails(session: any) {
    this.router.navigate(['/admin/sessions', session.sessionId], { state: { session } });
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.fromControl.setValue('',   { emitEvent: false });
    this.toControl.setValue('',     { emitEvent: false });
    this.status.set('');
    this.refresh();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.status() ||
      this.fromControl.value   ||
      this.toControl.value
    );
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

  fluencyTextClass(score: number): string {
    const n = Number(score);
    if (!n || n <= 0) return 'text-gw-text-muted';
    if (n >= 80)      return 'text-green-600';
    if (n >= 50)      return 'text-orange-500';
    return 'text-red-500';
  }
}

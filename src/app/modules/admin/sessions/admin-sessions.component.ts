import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  LucideAngularModule,
  Activity, CheckCircle2, TrendingUp,
  Search, Users, Calendar, Clock,
  X, Eye, AlertTriangle, User,
} from 'lucide-angular';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-admin-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatPaginatorModule],
  template: `

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  Session Detail Side Panel                                  -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    @if (selectedSession()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedSession.set(null)">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div
          class="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
          (click)="$event.stopPropagation()">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 class="text-base font-black text-gw-text uppercase tracking-wider">Session Details</h2>
            <button
              (click)="selectedSession.set(null)"
              class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="18"></i-lucide>
            </button>
          </div>

          <!-- Session Identity -->
          <div class="px-6 py-5 border-b border-gray-100">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center mb-4">
              <i-lucide [img]="SessionIcon" size="22" class="text-gw-primary"></i-lucide>
            </div>
            <h3 class="text-base font-black text-gw-text leading-snug">{{ selectedSession()!.sessionName }}</h3>
            <span
              class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              [class]="statusBgClass(selectedSession()!.status)">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                [class]="statusDotClass(selectedSession()!.status)"></span>
              {{ statusLabel(selectedSession()!.status) }}
            </span>
          </div>

          <!-- Session Info Grid -->
          <div class="px-6 py-5 space-y-3">
            <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Info</p>
            <div class="space-y-2.5">

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <span class="text-[11px] font-black text-gw-text-muted flex-shrink-0 w-[15px] text-center">#</span>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Session Code</p>
                  <p class="text-sm font-bold text-gw-text tracking-widest">{{ selectedSession()!.joinCode }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="UserIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Host</p>
                  <p class="text-sm font-bold text-gw-text">{{ selectedSession()!.hostName || '—' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="UsersIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Members</p>
                  <p class="text-sm font-bold text-gw-text">{{ selectedSession()!.memberCount }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="CalendarIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Date</p>
                  <p class="text-sm font-bold text-gw-text">
                    {{ selectedSession()!.sessionDate | date:'d MMM y, h:mm a' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="ClockIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Duration</p>
                  <p class="text-sm font-bold text-gw-text">
                    {{ selectedSession()!.durationMin > 0 ? selectedSession()!.durationMin + ' min' : '—' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="ScoreIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
                  <p class="text-sm font-bold"
                    [class]="fluencyTextClass(selectedSession()!.avgFluency)">
                    {{ selectedSession()!.avgFluency > 0
                        ? (selectedSession()!.avgFluency | number:'1.0-1') + '%'
                        : '—' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="MistakeIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Mistakes</p>
                  <p class="text-sm font-bold"
                    [class]="selectedSession()!.mistakeCount > 0 ? 'text-red-500' : 'text-gw-text'">
                    {{ selectedSession()!.mistakeCount }}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  Main Content                                               -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div class="space-y-5">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="SessionIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-lg font-black text-gw-text uppercase tracking-wide">Session History</h1>
            <p class="text-xs text-gw-text-muted font-medium">
              {{ loading() ? 'Loading...' : totalCount() + ' sessions recorded' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-4">

        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="SessionIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ totalCount() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Total</p>
          </div>
        </div>

        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="CompletedIcon" size="20" class="text-green-600"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ completedCount() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Completed</p>
          </div>
        </div>

        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="ScoreIcon" size="20" class="text-blue-500"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ avgFluencyDisplay() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Avg Score</p>
          </div>
        </div>

      </div>

      <!-- Filter Bar -->
      <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">

        <!-- Search -->
        <div class="relative flex-1 min-w-[180px]">
          <i-lucide [img]="SearchIcon" size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
          <input
            [formControl]="searchControl"
            type="text"
            placeholder="Search session or host..."
            class="w-full h-10 bg-gw-bg border border-transparent rounded-xl pl-9 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all">
        </div>

        <!-- Status -->
        <div class="relative">
          <select
            [formControl]="statusControl"
            class="h-10 bg-gw-bg border border-transparent rounded-xl pl-3 pr-8 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABANDONED">Abandoned</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
          <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gw-text-muted">&#8964;</span>
        </div>

        <!-- From Date -->
        <input
          [formControl]="fromControl"
          type="date"
          class="h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">

        <!-- To Date -->
        <input
          [formControl]="toControl"
          type="date"
          class="h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">

        <!-- Clear (only when filters active) -->
        @if (hasActiveFilters()) {
          <button
            (click)="clearFilters()"
            class="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-bold text-gw-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
            <i-lucide [img]="XIcon" size="14"></i-lucide>
            Clear
          </button>
        }

      </div>

      <!-- Table Card -->
      <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

        <!-- Loading -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-8 h-8 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-gw-text-muted">Loading sessions...</p>
          </div>
        }

        <!-- Empty State -->
        @else if (sessions().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="SessionIcon" size="28" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="text-center">
              <p class="font-black text-gw-text">No sessions found</p>
              <p class="text-sm text-gw-text-muted mt-1">
                {{ hasActiveFilters() ? 'Try adjusting your filters' : 'No sessions recorded yet' }}
              </p>
            </div>
            @if (hasActiveFilters()) {
              <button (click)="clearFilters()" class="text-sm font-bold text-gw-primary hover:underline">
                Clear filters
              </button>
            }
          </div>
        }

        <!-- Table -->
        @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gw-card-border">
                  <th class="px-5 py-3.5 text-left   text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Session</th>
                  <th class="px-4 py-3.5 text-left   text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Code</th>
                  <th class="px-4 py-3.5 text-left   text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Host</th>
                  <th class="px-4 py-3.5 text-left   text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Date</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Duration</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Score</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Status</th>
                  <th class="px-4 py-3.5 text-right  text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of sessions(); track row.sessionId) {
                  <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors group">

                    <!-- Session Name + Members -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
                          <i-lucide [img]="SessionIcon" size="15" class="text-gw-primary"></i-lucide>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-gw-text truncate">{{ row.sessionName }}</p>
                          <p class="text-[11px] text-gw-text-muted font-medium">
                            {{ row.memberCount }} member{{ row.memberCount !== 1 ? 's' : '' }}
                          </p>
                        </div>
                      </div>
                    </td>

                    <!-- Session Code -->
                    <td class="px-4 py-4 hidden sm:table-cell">
                      <span class="text-xs font-black text-gw-primary bg-gw-primary/10 px-2.5 py-1 rounded-lg tracking-widest">
                        {{ row.joinCode || '—' }}
                      </span>
                    </td>

                    <!-- Host -->
                    <td class="px-4 py-4 hidden md:table-cell">
                      <span class="text-sm font-medium text-gw-text">{{ row.hostName || '—' }}</span>
                    </td>

                    <!-- Date -->
                    <td class="px-4 py-4 hidden lg:table-cell">
                      <span class="text-xs font-medium text-gw-text-muted whitespace-nowrap">
                        {{ row.sessionDate | date:'d MMM y' }}
                      </span>
                    </td>

                    <!-- Duration -->
                    <td class="px-4 py-4 text-center hidden lg:table-cell">
                      <span class="text-sm font-bold text-gw-text">
                        {{ row.durationMin > 0 ? row.durationMin + ' min' : '—' }}
                      </span>
                    </td>

                    <!-- Fluency Score -->
                    <td class="px-4 py-4 text-center">
                      <span class="text-sm font-black" [class]="fluencyTextClass(row.avgFluency)">
                        {{ row.avgFluency > 0 ? (row.avgFluency | number:'1.0-1') + '%' : '—' }}
                      </span>
                    </td>

                    <!-- Status Badge -->
                    <td class="px-4 py-4 text-center">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                        [class]="statusBgClass(row.status)">
                        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          [class]="statusDotClass(row.status)"></span>
                        {{ statusLabel(row.status) }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-4 text-right">
                      <div class="flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          (click)="viewDetails(row)"
                          title="View Details"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gw-primary hover:bg-gw-primary/10 transition-colors">
                          <i-lucide [img]="ViewIcon" size="15"></i-lucide>
                        </button>
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-5 py-3.5 border-t border-gw-card-border bg-gw-bg/30">
            <p class="text-xs font-medium text-gw-text-muted">
              Showing {{ currentPage() * currentSize() + 1 }}–{{ pageEnd() }} of {{ totalCount() }}
            </p>
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="currentSize()"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPageChange($event)"
              class="!bg-transparent">
            </mat-paginator>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-paginator { background: transparent; }
    .mat-mdc-paginator-container { padding: 0; min-height: unset; }
  `]
})
export class AdminSessionsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  // ── Icon references ─────────────────────────────────────────────
  readonly SessionIcon   = Activity;
  readonly CompletedIcon = CheckCircle2;
  readonly ScoreIcon     = TrendingUp;
  readonly SearchIcon    = Search;
  readonly UsersIcon     = Users;
  readonly CalendarIcon  = Calendar;
  readonly ClockIcon     = Clock;
  readonly XIcon         = X;
  readonly ViewIcon      = Eye;
  readonly MistakeIcon   = AlertTriangle;
  readonly UserIcon      = User;

  // ── State ────────────────────────────────────────────────────────
  sessions        = signal<any[]>([]);
  loading         = signal(false);
  totalCount      = signal(0);
  currentPage     = signal(0);
  currentSize     = signal(20);
  selectedSession = signal<any | null>(null);

  // ── Form controls ────────────────────────────────────────────────
  searchControl = new FormControl('');
  statusControl = new FormControl('');
  fromControl   = new FormControl('');
  toControl     = new FormControl('');

  // ── Computed stats (from current page items) ─────────────────────
  completedCount = computed(() =>
    this.sessions().filter(s => s.status === 'COMPLETED').length
  );

  avgFluencyDisplay = computed(() => {
    const withScore = this.sessions().filter(s => Number(s.avgFluency) > 0);
    if (!withScore.length) return '—';
    const avg = withScore.reduce((sum, s) => sum + Number(s.avgFluency), 0) / withScore.length;
    return avg.toFixed(0) + '%';
  });

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    this.load();

    // debounced search
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.currentPage.set(0); this.load(); });

    // immediate on status change
    this.statusControl.valueChanges
      .subscribe(() => { this.currentPage.set(0); this.load(); });

    // debounced date range
    this.fromControl.valueChanges.pipe(debounceTime(600))
      .subscribe(() => { this.currentPage.set(0); this.load(); });

    this.toControl.valueChanges.pipe(debounceTime(600))
      .subscribe(() => { this.currentPage.set(0); this.load(); });
  }

  // ── Data ─────────────────────────────────────────────────────────
  load(page = this.currentPage(), size = this.currentSize()) {
    this.loading.set(true);
    this.adminService.getSessionHistory({
      searchTerm: this.searchControl.value || undefined,
      status:     this.statusControl.value || undefined,
      fromDate:   this.fromControl.value   || undefined,
      toDate:     this.toControl.value     || undefined,
      pageNumber: page + 1,
      pageSize:   size,
    }).subscribe({
      next: res => {
        this.sessions.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load session history');
        this.loading.set(false);
      }
    });
  }

  onPageChange(e: PageEvent) {
    this.currentPage.set(e.pageIndex);
    this.currentSize.set(e.pageSize);
    this.load(e.pageIndex, e.pageSize);
  }

  viewDetails(session: any) {
    this.selectedSession.set(session);
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.fromControl.setValue('',   { emitEvent: false });
    this.toControl.setValue('',     { emitEvent: false });
    this.currentPage.set(0);
    this.load();
  }

  // ── Helpers ──────────────────────────────────────────────────────
  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.statusControl.value ||
      this.fromControl.value   ||
      this.toControl.value
    );
  }

  pageEnd(): number {
    return Math.min((this.currentPage() + 1) * this.currentSize(), this.totalCount());
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

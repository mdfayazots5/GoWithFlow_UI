import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Download, Eye, TrendingUp, TrendingDown, ChartBar, Users, FileText, TriangleAlert, Calendar } from 'lucide-angular';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatPaginatorModule],
  template: `
    <div class="space-y-5">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="ReportIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-lg font-black text-gw-text uppercase tracking-wide">Reports</h1>
            <p class="text-xs text-gw-text-muted font-medium">
              {{ loading() ? 'Loading...' : totalCount() + ' users tracked' }}
            </p>
          </div>
        </div>
        <button (click)="exportReport()"
          class="flex items-center gap-2 h-10 px-4 bg-gw-accent text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity">
          <i-lucide [img]="DownloadIcon" size="15"></i-lucide>
          Export Excel
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
        <div class="flex flex-wrap gap-3 items-end">

          <!-- Date From -->
          <div class="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Date From</label>
            <input type="date" [formControl]="dateFrom"
              class="h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">
          </div>

          <!-- Date To -->
          <div class="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Date To</label>
            <input type="date" [formControl]="dateTo"
              class="h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">
          </div>

          <!-- User Filter -->
          <div class="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">User</label>
            <select [formControl]="userFilter"
              class="h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              <option value="">All Users</option>
              @for (u of userList(); track u.id) {
                <option [value]="u.id">{{ u.name }}</option>
              }
            </select>
          </div>

          <!-- Filter / Clear buttons -->
          <div class="flex gap-2 flex-shrink-0">
            <button (click)="applyFilters()"
              class="h-10 px-5 bg-gw-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
              Apply
            </button>
            <button (click)="clearFilters()"
              class="h-10 px-4 border-2 border-gray-200 text-gw-text-muted font-black text-xs uppercase tracking-widest rounded-xl hover:border-gray-300 transition-all">
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Avg Fluency -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
            <div class="w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center">
              <i-lucide [img]="BarIcon" size="15" class="text-gw-primary"></i-lucide>
            </div>
          </div>
          <p class="text-2xl font-black text-gw-text">{{ avgFluency() | number:'1.0-1' }}%</p>
          <p class="text-[10px] text-gw-text-muted mt-1">Across all users</p>
        </div>

        <!-- Total Sessions -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Total Sessions</p>
            <div class="w-8 h-8 rounded-xl bg-gw-accent/10 flex items-center justify-center">
              <i-lucide [img]="CalendarIcon" size="15" class="text-gw-accent"></i-lucide>
            </div>
          </div>
          <p class="text-2xl font-black text-gw-text">{{ totalSessions() }}</p>
          <p class="text-[10px] text-gw-text-muted mt-1">All time</p>
        </div>

        <!-- Most Improved -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Most Improved</p>
            <div class="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <i-lucide [img]="TrendUpIcon" size="15" class="text-green-600"></i-lucide>
            </div>
          </div>
          <p class="text-base font-black text-gw-text truncate">{{ mostImproved() || '—' }}</p>
          <p class="text-[10px] text-gw-text-muted mt-1">Highest improvement</p>
        </div>

        <!-- Top Struggled Tag -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Top Struggle</p>
            <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <i-lucide [img]="AlertIcon" size="15" class="text-red-500"></i-lucide>
            </div>
          </div>
          @if (topStruggleTag()) {
            <span class="inline-block px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-black">
              {{ topStruggleTag() }}
            </span>
          } @else {
            <p class="text-base font-black text-gw-text">—</p>
          }
          <p class="text-[10px] text-gw-text-muted mt-1">Most common mistake</p>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-8 h-8 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-gw-text-muted">Loading reports...</p>
          </div>
        }

        @else if (reports().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="ReportIcon" size="28" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="text-center">
              <p class="font-black text-gw-text">No reports found</p>
              <p class="text-sm text-gw-text-muted mt-1">Try adjusting the filters</p>
            </div>
          </div>
        }

        @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gw-card-border">
                  <th class="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">User</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Sessions</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Avg Score</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Common Mistake</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Improvement</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Last Session</th>
                  <th class="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of reports(); track row.userId) {
                  <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors group">

                    <!-- User -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center text-xs font-black text-gw-primary flex-shrink-0">
                          {{ initials(row.fullName) }}
                        </div>
                        <div>
                          <p class="text-sm font-bold text-gw-text">{{ row.fullName }}</p>
                          <p class="text-[11px] text-gw-text-muted font-medium">ID: {{ row.userId }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Sessions -->
                    <td class="px-4 py-4 text-center hidden sm:table-cell">
                      <span class="text-sm font-black text-gw-text">{{ row.totalSessions }}</span>
                    </td>

                    <!-- Avg Score -->
                    <td class="px-4 py-4 text-center">
                      <span class="text-sm font-black"
                        [class]="row.avgFluencyScore >= 70 ? 'text-green-600' : row.avgFluencyScore >= 40 ? 'text-gw-warning' : 'text-gw-text-muted'">
                        {{ row.avgFluencyScore | number:'1.0-1' }}%
                      </span>
                    </td>

                    <!-- Common Mistake -->
                    <td class="px-4 py-4 hidden lg:table-cell">
                      @if (row.mostCommonMistakeType && row.mostCommonMistakeType !== '—') {
                        <span class="text-xs font-bold text-gw-text-muted bg-gw-bg px-2.5 py-1 rounded-lg">
                          {{ row.mostCommonMistakeType }}
                        </span>
                      } @else {
                        <span class="text-xs text-gw-text-muted">—</span>
                      }
                    </td>

                    <!-- Improvement -->
                    <td class="px-4 py-4 text-center hidden md:table-cell">
                      <div class="inline-flex items-center gap-1">
                        <i-lucide [img]="row.improvementPercent >= 0 ? TrendUpIcon : TrendDownIcon" size="12"
                          [class]="row.improvementPercent >= 0 ? 'text-green-500' : 'text-red-500'"></i-lucide>
                        <span class="text-sm font-black"
                          [class]="row.improvementPercent >= 0 ? 'text-green-600' : 'text-red-500'">
                          {{ row.improvementPercent | number:'1.0-1' }}%
                        </span>
                      </div>
                    </td>

                    <!-- Last Session -->
                    <td class="px-4 py-4 hidden lg:table-cell">
                      <span class="text-xs font-medium text-gw-text-muted">
                        {{ row.lastSessionDate ? (row.lastSessionDate | date:'d MMM y') : '—' }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-4 text-right">
                      <button
                        (click)="viewFullReport(row.userId)"
                        title="View full report"
                        [disabled]="row.totalSessions === 0"
                        class="flex items-center gap-1.5 h-8 px-3 text-xs font-black rounded-lg border transition-colors ml-auto"
                        [class]="row.totalSessions > 0
                          ? 'text-gw-primary border-gw-primary/30 hover:bg-gw-primary/10 opacity-70 group-hover:opacity-100'
                          : 'text-gw-text-muted border-gray-200 cursor-not-allowed opacity-40'">
                        <i-lucide [img]="ViewIcon" size="12"></i-lucide>
                        {{ row.totalSessions > 0 ? 'View' : 'No Data' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-5 py-3.5 border-t border-gw-card-border bg-gw-bg/30">
            <p class="text-xs font-medium text-gw-text-muted">
              Showing {{ currentPage() * currentPageSize() + 1 }}–{{ pageEnd() }} of {{ totalCount() }}
            </p>
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="currentPageSize()"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              class="!bg-transparent"
            ></mat-paginator>
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
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);
  private router       = inject(Router);
  private toast        = inject(ToastService);

  readonly DownloadIcon = Download;
  readonly ViewIcon     = Eye;
  readonly TrendUpIcon  = TrendingUp;
  readonly TrendDownIcon = TrendingDown;
  readonly BarIcon      = ChartBar;
  readonly ReportIcon   = FileText;
  readonly AlertIcon    = TriangleAlert;
  readonly CalendarIcon = Calendar;

  reports         = signal<any[]>([]);
  loading         = signal(false);
  totalCount      = signal(0);
  currentPage     = signal(0);
  currentPageSize = signal(10);
  userList        = signal<{ id: string; name: string }[]>([]);

  dateFrom   = new FormControl('');
  dateTo     = new FormControl('');
  userFilter = new FormControl('');

  // Computed stats from loaded rows
  avgFluency    = computed(() => {
    const items = this.reports();
    if (!items.length) return 0;
    return items.reduce((s, r) => s + r.avgFluencyScore, 0) / items.length;
  });

  totalSessions = computed(() =>
    this.reports().reduce((s, r) => s + r.totalSessions, 0)
  );

  mostImproved = computed(() => {
    const items = this.reports();
    if (!items.length) return '';
    const best = items.reduce((a, b) => b.improvementPercent > a.improvementPercent ? b : a);
    return best.improvementPercent > 0 ? best.fullName : '';
  });

  topStruggleTag = computed(() => {
    const freq: Record<string, number> = {};
    for (const r of this.reports()) {
      const t = r.mostCommonMistakeType;
      if (t && t !== '—') freq[t] = (freq[t] || 0) + 1;
    }
    const entries = Object.entries(freq);
    if (!entries.length) return '';
    return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
  });

  pageEnd() {
    return Math.min((this.currentPage() + 1) * this.currentPageSize(), this.totalCount());
  }

  ngOnInit() {
    this.loadReports();
    this.loadUsers();
  }

  loadReports(page = this.currentPage(), size = this.currentPageSize()) {
    this.loading.set(true);
    this.adminService.getReports({
      pageNumber: page + 1,
      pageSize:   size,
      dateFrom:   this.dateFrom.value || undefined,
      dateTo:     this.dateTo.value   || undefined,
      userId:     this.userFilter.value || undefined,
    }).subscribe({
      next: (res: any) => {
        this.reports.set(res.items || []);
        this.totalCount.set(res.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load reports');
        this.loading.set(false);
      }
    });
  }

  loadUsers() {
    this.adminService.getUsers({ page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        this.userList.set((res.items || []).map((u: any) => ({ id: u.id, name: u.name })));
      },
      error: () => {}
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.loadReports(event.pageIndex, event.pageSize);
  }

  applyFilters() {
    this.currentPage.set(0);
    this.loadReports(0);
  }

  clearFilters() {
    this.dateFrom.setValue('');
    this.dateTo.setValue('');
    this.userFilter.setValue('');
    this.currentPage.set(0);
    this.loadReports(0);
  }

  viewFullReport(userId: number) {
    this.router.navigate(['/admin/reports/user', userId]);
  }

  exportReport() {
    this.adminService.exportReports({
      dateFrom: this.dateFrom.value || undefined,
      dateTo:   this.dateTo.value   || undefined,
      userId:   this.userFilter.value || undefined,
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `GoWithFlow_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Export downloaded');
      },
      error: () => this.toast.error('Export failed')
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

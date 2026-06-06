import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Download, Eye, TrendingUp, TrendingDown, ChartBar, FileText, TriangleAlert, Calendar } from 'lucide-angular';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { AdminLoadMoreComponent } from '@shared/components/admin-load-more/admin-load-more.component';
import { SkeletonListComponent } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, UserAvatarComponent, AdminLoadMoreComponent, SkeletonListComponent],
  template: `
    <div class="max-w-lg mx-auto space-y-4">

      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center shrink-0">
            <i-lucide [img]="ReportIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-black text-gw-text tracking-tight leading-tight">Reports</h1>
            <p class="text-[11px] text-gw-text-muted font-semibold">
              {{ loading() ? 'Loading...' : totalCount() + ' users tracked' }}
            </p>
          </div>
        </div>
        <button (click)="exportReport()"
          class="flex items-center gap-2 h-10 px-4 bg-gw-accent text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0">
          <i-lucide [img]="DownloadIcon" size="15"></i-lucide>
          Export
        </button>
      </div>

      <!-- Summary Stats (top) -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
            <i-lucide [img]="BarIcon" size="14" class="text-gw-primary"></i-lucide>
          </div>
          <p class="text-2xl font-black text-gw-text">{{ avgFluency() | number:'1.0-1' }}%</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Sessions</p>
            <i-lucide [img]="CalendarIcon" size="14" class="text-gw-accent"></i-lucide>
          </div>
          <p class="text-2xl font-black text-gw-text">{{ totalSessions() }}</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Most Improved</p>
            <i-lucide [img]="TrendUpIcon" size="14" class="text-green-600"></i-lucide>
          </div>
          <p class="text-sm font-black text-gw-text truncate">{{ mostImproved() || '—' }}</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Top Struggle</p>
            <i-lucide [img]="AlertIcon" size="14" class="text-red-500"></i-lucide>
          </div>
          @if (topStruggleTag()) {
            <span class="inline-block px-2 py-0.5 bg-red-100 text-red-600 rounded-lg text-xs font-black truncate max-w-full">{{ topStruggleTag() }}</span>
          } @else {
            <p class="text-sm font-black text-gw-text">—</p>
          }
        </div>
      </div>

      <!-- Filters (below summary) -->
      <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">From</label>
            <input type="date" [formControl]="dateFrom"
              class="h-11 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">To</label>
            <input type="date" [formControl]="dateTo"
              class="h-11 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all">
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">User</label>
          <select [formControl]="userFilter"
            class="h-11 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer">
            <option value="">All Users</option>
            @for (u of userList(); track u.id) {
              <option [value]="u.id">{{ u.name }}</option>
            }
          </select>
        </div>
        <div class="flex gap-2">
          <button (click)="applyFilters()"
            class="flex-1 h-10 bg-gw-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
            Apply
          </button>
          <button (click)="clearFilters()"
            class="h-10 px-4 border-2 border-gray-200 text-gw-text-muted font-black text-[11px] uppercase tracking-widest rounded-xl hover:border-gray-300 transition-all">
            Clear
          </button>
        </div>
      </div>

      <!-- Loading Skeletons -->
      @if (loading()) {
        <app-skeleton-list [rows]="6"></app-skeleton-list>
      }

      <!-- Empty State -->
      @else if (reports().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="ReportIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">No reports found</p>
          <p class="text-xs text-gw-text-muted">Try adjusting the filters</p>
        </div>
      }

      <!-- Reports List -->
      @else {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="divide-y divide-gw-bg">
            @for (row of reports(); track row.userId) {
              <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gw-bg/50 transition-colors">

                <app-user-avatar [name]="row.fullName" [avatarUrl]="row.avatarUrl" size="sm"></app-user-avatar>

                <!-- Meta -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gw-text truncate leading-tight">{{ row.fullName }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-[11px] font-semibold text-gw-text-muted">{{ row.totalSessions }} sessions</span>
                    <span class="text-[11px] font-semibold text-gw-text-muted">·</span>
                    <span class="inline-flex items-center gap-1 text-[11px] font-black"
                      [class]="row.improvementPercent >= 0 ? 'text-green-600' : 'text-red-500'">
                      <i-lucide [img]="row.improvementPercent >= 0 ? TrendUpIcon : TrendDownIcon" size="11"></i-lucide>
                      {{ row.improvementPercent | number:'1.0-1' }}%
                    </span>
                  </div>
                </div>

                <!-- Score + action -->
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span class="text-[11px] font-black px-2 py-0.5 rounded-lg"
                    [class]="row.avgFluencyScore >= 70 ? 'bg-green-100 text-green-700' : row.avgFluencyScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'">
                    {{ row.avgFluencyScore | number:'1.0-0' }}%
                  </span>
                  <button (click)="viewFullReport(row.userId)" [disabled]="row.totalSessions === 0"
                    class="flex items-center gap-1 h-7 px-2.5 text-[11px] font-black rounded-lg border transition-colors"
                    [class]="row.totalSessions > 0
                      ? 'text-gw-primary border-gw-primary/30 hover:bg-gw-primary/10'
                      : 'text-gw-text-muted border-gray-200 cursor-not-allowed opacity-50'">
                    <i-lucide [img]="ViewIcon" size="12"></i-lucide>
                    {{ row.totalSessions > 0 ? 'View' : 'No Data' }}
                  </button>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Standardized pager -->
        <app-admin-load-more
          [loading]="loadingMore()" [hasMore]="hasMore()"
          [loaded]="reports().length" [total]="totalCount()"
          (more)="loadMore()"></app-admin-load-more>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
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
  loading         = signal(true);
  loadingMore     = signal(false);
  totalCount      = signal(0);
  userList        = signal<{ id: string; name: string }[]>([]);

  private page     = 0;
  private pageSize = 15;

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

  hasMore() {
    return this.reports().length < this.totalCount();
  }

  ngOnInit() {
    this.loadReports();
    this.loadUsers();
  }

  loadReports(append = false) {
    this.adminService.getReports({
      pageNumber: this.page + 1,
      pageSize:   this.pageSize,
      dateFrom:   this.dateFrom.value || undefined,
      dateTo:     this.dateTo.value   || undefined,
      userId:     this.userFilter.value || undefined,
    }).subscribe({
      next: (res: any) => {
        const incoming = res.items || [];
        this.reports.update(prev => append ? [...prev, ...incoming] : incoming);
        this.totalCount.set(res.totalCount || 0);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.toast.error('Failed to load reports');
        this.loading.set(false);
        this.loadingMore.set(false);
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

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.loadReports(true);
  }

  applyFilters() {
    this.page = 0;
    this.reports.set([]);
    this.loading.set(true);
    this.loadReports();
  }

  clearFilters() {
    this.dateFrom.setValue('');
    this.dateTo.setValue('');
    this.userFilter.setValue('');
    this.applyFilters();
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

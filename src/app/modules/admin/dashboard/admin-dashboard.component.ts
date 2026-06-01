import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Users, Activity, FileText, AlertTriangle,
  BarChart2, UserPlus, ArrowRight, TrendingUp,
  LayoutDashboard,
} from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `

    <div class="space-y-5">

      <!-- ══════════════════════════════════════════════════════════ -->
      <!--  Page Header                                               -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="DashboardIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-lg font-black text-gw-text uppercase tracking-wide">Dashboard</h1>
            <p class="text-xs text-gw-text-muted font-medium">{{ today | date:'EEEE, d MMM y' }}</p>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!--  KPI Stats                                                 -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Total Users -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="UsersIcon" size="20" class="text-blue-600"></i-lucide>
          </div>
          <div>
            @if (loading()) {
              <div class="w-12 h-7 bg-gw-bg rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-2xl font-black text-gw-text leading-none">{{ stats()?.totalUsers ?? 0 }}</p>
            }
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Total Users</p>
          </div>
        </div>

        <!-- Active Sessions Today -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="SessionIcon" size="20" class="text-green-600"></i-lucide>
          </div>
          <div>
            @if (loading()) {
              <div class="w-10 h-7 bg-gw-bg rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-2xl font-black text-gw-text leading-none">{{ stats()?.activeSessions ?? 0 }}</p>
            }
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Sessions Today</p>
          </div>
        </div>

        <!-- Total Scripts -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="ScriptIcon" size="20" class="text-orange-500"></i-lucide>
          </div>
          <div>
            @if (loading()) {
              <div class="w-10 h-7 bg-gw-bg rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-2xl font-black text-gw-text leading-none">{{ stats()?.totalScripts ?? 0 }}</p>
            }
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Total Scripts</p>
          </div>
        </div>

        <!-- Total Mistakes -->
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="MistakeIcon" size="20" class="text-red-500"></i-lucide>
          </div>
          <div>
            @if (loading()) {
              <div class="w-12 h-7 bg-gw-bg rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-2xl font-black text-gw-text leading-none">{{ stats()?.totalMistakes ?? 0 }}</p>
            }
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Mistakes Logged</p>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!--  Main Grid — Activity + Focus Areas                        -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        <!-- ── Latest Activity (2/3 width) ── -->
        <div class="lg:col-span-2 bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gw-card-border">
            <div>
              <h2 class="text-sm font-black text-gw-text uppercase tracking-wide">Latest Activity</h2>
              <p class="text-[11px] text-gw-text-muted font-medium mt-0.5">Most recent practice sessions</p>
            </div>
            <a routerLink="/admin/sessions"
              class="flex items-center gap-1.5 text-xs font-black text-gw-primary hover:opacity-70 transition-opacity uppercase tracking-widest">
              View all
              <i-lucide [img]="ArrowIcon" size="13"></i-lucide>
            </a>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="flex flex-col items-center justify-center py-14 gap-3">
              <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm font-medium text-gw-text-muted">Loading activity...</p>
            </div>
          }

          <!-- Empty -->
          @else if (recentActivity().length === 0) {
            <div class="flex flex-col items-center justify-center py-14 gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="SessionIcon" size="26" class="text-gw-text-muted"></i-lucide>
              </div>
              <div class="text-center">
                <p class="font-black text-gw-text">No sessions yet</p>
                <p class="text-sm text-gw-text-muted mt-1">Sessions will appear once users start practising</p>
              </div>
            </div>
          }

          <!-- Table -->
          @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gw-card-border">
                    <th class="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">User</th>
                    <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Session</th>
                    <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Date</th>
                    <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Score</th>
                    <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of recentActivity(); track $index) {
                    <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors">

                      <!-- User -->
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-gw-primary flex items-center justify-center flex-shrink-0">
                            <span class="text-[10px] font-black text-white leading-none">{{ initials(row.userName) }}</span>
                          </div>
                          <span class="text-sm font-bold text-gw-text">{{ row.userName }}</span>
                        </div>
                      </td>

                      <!-- Session -->
                      <td class="px-4 py-3.5 hidden sm:table-cell">
                        <span class="text-sm font-medium text-gw-text-muted">{{ row.sessionName }}</span>
                      </td>

                      <!-- Date -->
                      <td class="px-4 py-3.5 hidden md:table-cell">
                        <span class="text-xs font-medium text-gw-text-muted whitespace-nowrap">
                          {{ row.sessionDate | date:'d MMM, h:mm a' }}
                        </span>
                      </td>

                      <!-- Score -->
                      <td class="px-4 py-3.5 text-center">
                        <span class="text-sm font-black" [class]="fluencyClass(row.fluencyScore)">
                          {{ row.fluencyScore > 0 ? (row.fluencyScore | number:'1.0-1') + '%' : '—' }}
                        </span>
                      </td>

                      <!-- Status -->
                      <td class="px-4 py-3.5 text-center">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                          [class]="statusBgClass(row.status)">
                          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            [class]="statusDotClass(row.status)"></span>
                          {{ statusLabel(row.status) }}
                        </span>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- ── Focus Areas (1/3 width) ── -->
        <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gw-card-border">
            <div>
              <h2 class="text-sm font-black text-gw-text uppercase tracking-wide">Focus Areas</h2>
              <p class="text-[11px] text-gw-text-muted font-medium mt-0.5">Where users struggle most</p>
            </div>
            <div class="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <i-lucide [img]="TrendIcon" size="15" class="text-orange-500"></i-lucide>
            </div>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="flex flex-col items-center justify-center py-14 gap-3">
              <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }

          <!-- Empty -->
          @else if (weakAreas().length === 0) {
            <div class="flex flex-col items-center justify-center py-14 gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="TrendIcon" size="26" class="text-gw-text-muted"></i-lucide>
              </div>
              <div class="text-center">
                <p class="font-black text-gw-text">No data yet</p>
                <p class="text-sm text-gw-text-muted mt-1">Error trends appear after sessions run</p>
              </div>
            </div>
          }

          <!-- Focus list -->
          @else {
            <div>
              @for (area of weakAreas(); track area.tag; let i = $index) {
                <div class="px-5 py-3.5" [class.border-t]="i > 0" [class.border-gw-card-border]="i > 0">

                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-[10px] font-black text-gw-text-muted w-5 flex-shrink-0">#{{ i + 1 }}</span>
                      <span class="text-sm font-bold text-gw-text truncate">{{ area.tag }}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {{ area.count }} users
                      </span>
                      <span class="text-[11px] font-black text-gw-text-muted w-8 text-right">
                        {{ area.percentage }}%
                      </span>
                    </div>
                  </div>

                  <!-- Progress bar -->
                  <div class="h-1.5 bg-gw-bg rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="area.percentage"
                      [class]="area.percentage >= 70
                        ? 'bg-red-400'
                        : area.percentage >= 40
                          ? 'bg-orange-400'
                          : 'bg-gw-primary'">
                    </div>
                  </div>

                </div>
              }
            </div>
          }

        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!--  Quick Access                                              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-3">Quick Access</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <a routerLink="/admin/scripts/upload"
            class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
              <i-lucide [img]="ScriptIcon" size="18" class="text-gw-primary"></i-lucide>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-gw-text">Upload Script</p>
              <p class="text-xs text-gw-text-muted font-medium hidden sm:block">Add new practice material</p>
            </div>
            <i-lucide [img]="ArrowIcon" size="15" class="text-gw-text-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform"></i-lucide>
          </a>

          <a routerLink="/admin/reports"
            class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i-lucide [img]="ReportsIcon" size="18" class="text-blue-600"></i-lucide>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-gw-text">Analytics & Reports</p>
              <p class="text-xs text-gw-text-muted font-medium hidden sm:block">View detailed performance data</p>
            </div>
            <i-lucide [img]="ArrowIcon" size="15" class="text-gw-text-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform"></i-lucide>
          </a>

          <a routerLink="/admin/users"
            class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i-lucide [img]="InviteIcon" size="18" class="text-green-600"></i-lucide>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-gw-text">Invite User</p>
              <p class="text-xs text-gw-text-muted font-medium hidden sm:block">Register a new team member</p>
            </div>
            <i-lucide [img]="ArrowIcon" size="15" class="text-gw-text-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform"></i-lucide>
          </a>

        </div>
      </div>

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  // ── Icons ────────────────────────────────────────────────────────
  readonly DashboardIcon = LayoutDashboard;
  readonly UsersIcon     = Users;
  readonly SessionIcon   = Activity;
  readonly ScriptIcon    = FileText;
  readonly MistakeIcon   = AlertTriangle;
  readonly TrendIcon     = TrendingUp;
  readonly ReportsIcon   = BarChart2;
  readonly InviteIcon    = UserPlus;
  readonly ArrowIcon     = ArrowRight;

  // ── State ────────────────────────────────────────────────────────
  readonly today = new Date();

  stats          = signal<{ totalUsers: number; activeSessions: number; totalScripts: number; totalMistakes: number } | null>(null);
  recentActivity = signal<any[]>([]);
  weakAreas      = signal<any[]>([]);
  loading        = signal(true);

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    this.adminService.getDashboard().subscribe({
      next: data => {
        this.stats.set(data.stats);
        this.recentActivity.set(data.recentActivity);
        this.weakAreas.set(data.weakAreas ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────
  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  statusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':   return 'Completed';
      case 'ABANDONED':   return 'Abandoned';
      case 'IN_PROGRESS': return 'In Progress';
      default:            return status ?? '—';
    }
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

  fluencyClass(score: number): string {
    if (!score || score <= 0) return 'text-gw-text-muted';
    if (score >= 80)          return 'text-green-600';
    if (score >= 50)          return 'text-orange-500';
    return 'text-red-500';
  }
}

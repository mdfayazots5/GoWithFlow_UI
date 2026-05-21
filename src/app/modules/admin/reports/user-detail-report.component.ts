import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, ChevronLeft, BarChart2, TrendingUp, Save, FileText, Flame, AlertTriangle } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-user-detail-report',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MatTableModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/reports"
          class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (loading()) {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        } @else if (header()) {
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center text-base font-black text-gw-primary">
              {{ initials(header()!.fullName) }}
            </div>
            <div>
              <h2 class="text-xl font-black text-gw-text">{{ header()!.fullName }}</h2>
              <div class="flex items-center gap-4 mt-0.5">
                <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">
                  <i-lucide [img]="FlameIcon" size="12" class="text-orange-400"></i-lucide>
                  {{ header()!.dailyStreakCount }} Day Streak
                </span>
                <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">
                  <i-lucide [img]="SessionIcon" size="12" class="text-gw-accent"></i-lucide>
                  {{ header()!.totalSessions }} Sessions
                </span>
                <span class="text-[10px] font-black uppercase tracking-widest text-gw-success">
                  {{ header()!.avgScore | number:'1.0-1' }}% Avg Score
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (!loading() && !header()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="ReportIcon" size="28" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="font-black text-gw-text">No report data found</p>
          <p class="text-sm text-gw-text-muted">This user has not completed any sessions yet.</p>
        </div>
      }

      @if (!loading() && header()) {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Main: Session History + Weekly Trend -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Session History -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Session History</h3>
              </div>
              @if (sessionHistory().length === 0) {
                <div class="flex items-center justify-center py-10 text-sm text-gw-text-muted">No sessions recorded yet.</div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gw-card-border">
                        <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Date</th>
                        <th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Script</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Duration</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Fluency</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Mistakes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of sessionHistory(); track row.sessionId) {
                        <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors">
                          <td class="px-5 py-3.5 text-xs font-medium text-gw-text-muted">{{ row.date | date:'d MMM y' }}</td>
                          <td class="px-4 py-3.5 text-sm font-bold text-gw-text">{{ row.sessionName }}</td>
                          <td class="px-4 py-3.5 text-center text-xs text-gw-text-muted hidden sm:table-cell">{{ row.duration }} min</td>
                          <td class="px-4 py-3.5 text-center text-sm font-black text-gw-success">{{ row.fluencyScore | number:'1.0-1' }}%</td>
                          <td class="px-4 py-3.5 text-center text-sm font-black text-red-500">{{ row.mistakeCount }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- Weekly Score Trend -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Weekly Score Trend</h3>
              </div>
              @if (weeklyScores().length === 0) {
                <div class="flex items-center justify-center py-10 text-sm text-gw-text-muted">No weekly data available yet.</div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gw-card-border">
                        <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Week</th>
                        <th class="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</th>
                        <th class="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (w of weeklyScores(); track w.weekLabel; let i = $index) {
                        <tr class="border-b border-gw-card-border/50 last:border-0 hover:bg-gw-bg/30 transition-colors">
                          <td class="px-5 py-3.5 text-sm font-bold text-gw-text">{{ w.weekLabel }}</td>
                          <td class="px-4 py-3.5 text-right text-sm font-black text-gw-primary">{{ w.avgFluencyScore | number:'1.0-1' }}%</td>
                          <td class="px-4 py-3.5 text-right">
                            @if (i === 0) {
                              <span class="text-xs font-bold text-gw-text-muted">Baseline</span>
                            } @else {
                              @let delta = w.avgFluencyScore - weeklyScores()[i-1].avgFluencyScore;
                              <div class="inline-flex items-center gap-1 justify-end"
                                [class]="delta >= 0 ? 'text-green-600' : 'text-red-500'">
                                <i-lucide [img]="TrendIcon" size="12"></i-lucide>
                                <span class="text-xs font-black">{{ delta >= 0 ? '+' : '' }}{{ delta | number:'1.0-1' }}%</span>
                              </div>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar: Mistake Breakdown + Admin Notes -->
          <div class="space-y-6">

            <!-- Mistake Breakdown -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Mistake Breakdown</h3>
              </div>
              <div class="p-5 space-y-4">
                @if (mistakeBreakdown().length === 0) {
                  <p class="text-sm text-gw-text-muted text-center py-4">No mistakes recorded yet.</p>
                } @else {
                  @for (item of mistakeBreakdown(); track item.grammarTag) {
                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-gw-text">{{ item.grammarTag }}</span>
                        <span class="text-[10px] font-black text-gw-text-muted uppercase tracking-wider">{{ item.mistakeCount }} errors</span>
                      </div>
                      <div class="h-2 bg-gw-bg rounded-full overflow-hidden">
                        <div class="h-full bg-red-400 rounded-full transition-all duration-700"
                          [style.width.%]="item.percentage"></div>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Admin Notes -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Admin Notes</h3>
              </div>
              <div class="p-5 space-y-3">
                <textarea [formControl]="notesControl"
                  class="w-full min-h-[140px] bg-gw-bg border border-transparent rounded-xl p-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all resize-none placeholder:text-gw-text-muted"
                  placeholder="Observations, feedback for this user..."></textarea>
                <button (click)="saveNotes()" [disabled]="isSaving()"
                  class="w-full h-11 bg-gw-primary text-white font-black text-sm uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  <i-lucide [img]="SaveIcon" size="16"></i-lucide>
                  {{ isSaving() ? 'Saving...' : 'Save Notes' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-table { background: transparent; }
    .mat-mdc-header-cell { border-bottom: 1px solid var(--gw-card-border); color: var(--gw-text-muted); }
  `]
})
export class UserDetailReportComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly BackIcon    = ChevronLeft;
  readonly FlameIcon   = Flame;
  readonly SessionIcon = FileText;
  readonly TrendIcon   = TrendingUp;
  readonly SaveIcon    = Save;
  readonly ReportIcon  = FileText;

  loading  = signal(false);
  rawReport = signal<any>(null);

  header          = computed(() => this.rawReport()?.userHeader ?? null);
  sessionHistory  = computed(() => this.rawReport()?.sessionHistoryList ?? []);
  weeklyScores    = computed(() => this.rawReport()?.weeklyScoreList ?? []);
  mistakeBreakdown = computed(() => {
    const list: any[] = this.rawReport()?.mistakeBreakdownList ?? [];
    const total = list.reduce((s: number, i: any) => s + (i.mistakeCount || 0), 0);
    return list.map((i: any) => ({
      ...i,
      percentage: total > 0 ? Math.round((i.mistakeCount / total) * 100) : 0,
    }));
  });

  notesControl = new FormControl('');
  isSaving     = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) this.loadReport(userId);
    });
  }

  loadReport(userId: string) {
    this.loading.set(true);
    this.adminService.getUserFullReport(userId).subscribe({
      next: (data: any) => {
        this.rawReport.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load report');
        this.loading.set(false);
      }
    });
  }

  saveNotes() {
    const h = this.header();
    if (!h) return;
    this.isSaving.set(true);
    this.adminService.addAdminNote({
      targetUserId: h.userId,
      noteText: this.notesControl.value || ''
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Notes saved');
      },
      error: () => this.isSaving.set(false)
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

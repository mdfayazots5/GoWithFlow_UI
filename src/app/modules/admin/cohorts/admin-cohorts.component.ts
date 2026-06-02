import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  Users, Plus, X, BarChart2, ChevronRight, UserCheck,
  TrendingUp, AlertCircle, Trophy, User
} from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-cohorts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gw-bg p-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gw-text uppercase italic tracking-tight">Cohort Management</h1>
          <p class="text-xs text-gw-text-muted mt-1">Group users into training batches and track collective progress</p>
        </div>
        <button (click)="showCreateModal.set(true)"
                class="flex items-center gap-2 h-10 px-5 bg-gw-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
          <i-lucide [img]="PlusIcon" size="14"></i-lucide>
          New Cohort
        </button>
      </div>

      <!-- Cohort Cards Grid -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-8 h-8 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
        </div>
      } @else if (cohorts().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-16 text-center">
          <i-lucide [img]="UsersIcon" size="32" class="text-gw-text-muted mx-auto mb-4"></i-lucide>
          <p class="text-sm font-semibold text-gw-text-muted">No cohorts yet. Create one to start grouping users.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (cohort of cohorts(); track cohort.cohortId) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden
                        hover:border-gw-primary transition-all cursor-pointer group"
                 (click)="selectCohort(cohort)">
              <div class="p-5 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-black text-gw-text">{{ cohort.cohortName }}</p>
                    @if (cohort.description) {
                      <p class="text-[10px] text-gw-text-muted mt-0.5">{{ cohort.description }}</p>
                    }
                  </div>
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                        [class]="cohort.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ cohort.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <i-lucide [img]="UsersIcon" size="12" class="text-gw-text-muted"></i-lucide>
                    <span class="text-xs font-bold text-gw-text-muted">{{ cohort.memberCount }} members</span>
                  </div>
                  <span class="text-[10px] text-gw-text-muted">{{ cohort.dateCreated | date:'MMM d, y' }}</span>
                </div>
              </div>
              <div class="flex border-t border-gw-bg">
                <button (click)="$event.stopPropagation(); openMembers(cohort)"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gw-text-muted hover:text-gw-primary hover:bg-gw-bg transition-all">
                  <i-lucide [img]="UserIcon" size="12"></i-lucide>
                  Members
                </button>
                <button (click)="$event.stopPropagation(); openAnalytics(cohort)"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gw-text-muted hover:text-gw-primary hover:bg-gw-bg border-l border-gw-bg transition-all">
                  <i-lucide [img]="BarChart2Icon" size="12"></i-lucide>
                  Analytics
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Create Cohort Modal ─────────────────────────────────────── -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" (click)="showCreateModal.set(false)">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl mx-4 p-6 space-y-4"
             (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-black text-gw-text uppercase tracking-wider">New Cohort</h2>
            <button (click)="showCreateModal.set(false)" class="text-gw-text-muted hover:text-gw-text">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="space-y-3">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Cohort Name *</label>
              <input formControlName="cohortName" type="text" placeholder="e.g. Batch June 2026 — HR English"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text
                       placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
                [class.border-red-400]="createForm.get('cohortName')?.invalid && createForm.get('cohortName')?.touched">
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Description (optional)</label>
              <input formControlName="description" type="text" placeholder="Training program description"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text
                       placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all">
            </div>
            <div class="flex gap-2 pt-2">
              <button type="button" (click)="showCreateModal.set(false)"
                      class="flex-1 h-10 border border-gw-card-border rounded-xl text-xs font-bold text-gw-text-muted hover:bg-gw-bg transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="createForm.invalid || creating()"
                      class="flex-1 h-10 bg-gw-primary text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
                {{ creating() ? 'Creating...' : 'Create Cohort' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Members Side Panel ─────────────────────────────────────── -->
    @if (selectedCohortForMembers()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedCohortForMembers.set(null)">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 class="text-base font-black text-gw-text uppercase tracking-wider">Members</h2>
              <p class="text-[10px] text-gw-text-muted mt-0.5">{{ selectedCohortForMembers()!.cohortName }}</p>
            </div>
            <button (click)="selectedCohortForMembers.set(null)"
                    class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto divide-y divide-gw-bg">
            @if (membersLoading()) {
              <div class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
              </div>
            } @else if (cohortMembers().length === 0) {
              <div class="text-center py-12 text-xs text-gw-text-muted font-semibold">No members assigned yet.</div>
            } @else {
              @for (member of cohortMembers(); track member.userId) {
                <div class="flex items-center gap-3 px-6 py-3.5">
                  <div class="w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
                    <i-lucide [img]="UserIcon" size="14" class="text-gw-primary"></i-lucide>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate">{{ member.fullName }}</p>
                    <p class="text-[9px] text-gw-text-muted">{{ member.sessionCount }} sessions · {{ member.avgFluencyScore | number:'1.0-0' }}% fluency</p>
                  </div>
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                        [class]="member.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ member.isActive ? 'Active' : 'Off' }}
                  </span>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- ── Analytics Side Panel ───────────────────────────────────── -->
    @if (selectedCohortForAnalytics()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedCohortForAnalytics.set(null)">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-y-auto"
             (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 class="text-base font-black text-gw-text uppercase tracking-wider">Analytics</h2>
              <p class="text-[10px] text-gw-text-muted mt-0.5">{{ selectedCohortForAnalytics()!.cohortName }}</p>
            </div>
            <button (click)="selectedCohortForAnalytics.set(null)"
                    class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>
          @if (analyticsLoading()) {
            <div class="flex justify-center py-12">
              <div class="w-6 h-6 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
            </div>
          } @else if (cohortAnalytics()) {
            <div class="p-6 space-y-5">
              <!-- Stats -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-gw-bg rounded-xl p-3 text-center">
                  <p class="text-lg font-black text-gw-text">{{ cohortAnalytics()!.memberCount }}</p>
                  <p class="text-[9px] font-bold text-gw-text-muted uppercase">Members</p>
                </div>
                <div class="bg-gw-bg rounded-xl p-3 text-center">
                  <p class="text-lg font-black text-gw-text">{{ cohortAnalytics()!.avgFluencyScore | number:'1.0-0' }}%</p>
                  <p class="text-[9px] font-bold text-gw-text-muted uppercase">Avg Fluency</p>
                </div>
                <div class="bg-gw-bg rounded-xl p-3 text-center">
                  <p class="text-lg font-black text-amber-500">{{ cohortAnalytics()!.inactiveCount }}</p>
                  <p class="text-[9px] font-bold text-gw-text-muted uppercase">Inactive</p>
                </div>
              </div>

              <!-- Top Grammar Mistakes -->
              @if (cohortAnalytics()!.topGrammarMistakes?.length) {
                <div class="space-y-2">
                  <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Top Grammar Mistakes</p>
                  @for (mistake of cohortAnalytics()!.topGrammarMistakes; track mistake.grammarTag) {
                    <div class="flex items-center justify-between px-3 py-2 bg-gw-bg rounded-xl">
                      <span class="text-xs font-semibold text-gw-text">{{ mistake.grammarTag }}</span>
                      <span class="text-xs font-black text-red-500">{{ mistake.mistakeCount }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Most Improved -->
              @if (cohortAnalytics()!.mostImproved) {
                <div class="bg-gw-success/5 border border-gw-success/20 rounded-xl p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <i-lucide [img]="TrophyIcon" size="12" class="text-gw-success"></i-lucide>
                    <p class="text-[10px] font-black uppercase tracking-widest text-gw-success">Most Improved</p>
                  </div>
                  <p class="text-sm font-bold text-gw-text">{{ cohortAnalytics()!.mostImproved.fullName }}</p>
                  <p class="text-[10px] text-gw-text-muted">+{{ cohortAnalytics()!.mostImproved.improvementDelta | number:'1.0-1' }} pts in last 30 days</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class AdminCohortsComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private toast    = inject(ToastService);
  private fb       = inject(FormBuilder);

  cohorts         = signal<any[]>([]);
  loading         = signal(true);
  creating        = signal(false);
  showCreateModal = signal(false);

  selectedCohortForMembers   = signal<any>(null);
  selectedCohortForAnalytics = signal<any>(null);
  cohortMembers  = signal<any[]>([]);
  cohortAnalytics = signal<any>(null);
  membersLoading  = signal(false);
  analyticsLoading = signal(false);

  readonly UsersIcon   = Users;
  readonly PlusIcon    = Plus;
  readonly XIcon       = X;
  readonly BarChart2Icon = BarChart2;
  readonly ChevronIcon = ChevronRight;
  readonly UserCheckIcon = UserCheck;
  readonly TrendIcon   = TrendingUp;
  readonly AlertIcon   = AlertCircle;
  readonly TrophyIcon  = Trophy;
  readonly UserIcon    = User;

  createForm = this.fb.group({
    cohortName:  ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(256)]
  });

  ngOnInit() { this.loadCohorts(); }

  loadCohorts() {
    this.loading.set(true);
    this.adminSvc.getCohorts().pipe(catchError(() => of([]))).subscribe(data => {
      this.cohorts.set(data.map((c: any) => ({
        cohortId:    c.cohortId,
        cohortName:  c.cohortName,
        description: c.description,
        isActive:    c.isActive,
        memberCount: c.memberCount,
        dateCreated: c.dateCreated
      })));
      this.loading.set(false);
    });
  }

  selectCohort(cohort: any) {
    this.openMembers(cohort);
  }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const v = this.createForm.value;
    this.adminSvc.createCohort({ cohortName: v.cohortName!, description: v.description || undefined })
      .pipe(catchError(err => { this.toast.error(err?.error?.errors?.[0] || 'Failed to create cohort'); this.creating.set(false); return of(null); }))
      .subscribe(data => {
        if (data) {
          this.toast.success('Cohort created successfully');
          this.showCreateModal.set(false);
          this.createForm.reset();
          this.loadCohorts();
        }
        this.creating.set(false);
      });
  }

  openMembers(cohort: any) {
    this.selectedCohortForMembers.set(cohort);
    this.membersLoading.set(true);
    this.adminSvc.getCohortMembers(cohort.cohortId).pipe(catchError(() => of([]))).subscribe(data => {
      this.cohortMembers.set(data.map((m: any) => ({
        userId:          m.userId,
        fullName:        m.fullName,
        mobileNumber:    m.mobileNumber,
        ageGroup:        m.ageGroup,
        isActive:        m.isActive,
        dailyStreakCount: m.dailyStreakCount,
        sessionCount:    m.sessionCount,
        avgFluencyScore: m.avgFluencyScore,
        totalMistakes:   m.totalMistakes
      })));
      this.membersLoading.set(false);
    });
  }

  openAnalytics(cohort: any) {
    this.selectedCohortForAnalytics.set(cohort);
    this.analyticsLoading.set(true);
    this.adminSvc.getCohortAnalytics(cohort.cohortId).pipe(catchError(() => of(null))).subscribe(data => {
      this.cohortAnalytics.set(data);
      this.analyticsLoading.set(false);
    });
  }
}

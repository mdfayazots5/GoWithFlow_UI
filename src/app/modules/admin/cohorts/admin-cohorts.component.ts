import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Users, Plus, X, BarChart2, User, Search, ChevronRight } from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-cohorts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="max-w-lg mx-auto space-y-4">

      <!-- Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center shrink-0">
            <i-lucide [img]="UsersIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-black text-gw-text tracking-tight leading-tight">Cohorts</h1>
            <p class="text-[11px] text-gw-text-muted font-semibold">
              {{ loading() ? 'Loading...' : cohorts().length + ' training batches' }}
            </p>
          </div>
        </div>
        <button (click)="showCreateModal.set(true)"
          class="flex items-center gap-2 h-10 px-4 bg-gw-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0">
          <i-lucide [img]="PlusIcon" size="15"></i-lucide>
          New
        </button>
      </div>

      <!-- Search -->
      <div class="relative">
        <i-lucide [img]="SearchIcon" size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
        <input [formControl]="searchControl" type="text" placeholder="Search cohorts..."
          class="w-full h-11 bg-white border border-gw-card-border rounded-2xl pl-10 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary outline-none transition-all shadow-sm">
      </div>

      <!-- Loading Skeletons -->
      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="h-[96px] bg-white rounded-2xl border border-gw-card-border animate-pulse"></div>
        }
      }

      <!-- Empty State -->
      @else if (filteredCohorts().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="UsersIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">{{ search() ? 'No matching cohorts' : 'No cohorts yet' }}</p>
          <p class="text-xs text-gw-text-muted">{{ search() ? 'Try a different search.' : 'Create one to start grouping users.' }}</p>
        </div>
      }

      <!-- Cohort Cards -->
      @else {
        <div class="space-y-3">
          @for (cohort of filteredCohorts(); track cohort.cohortId) {
            <div (click)="goToDetail(cohort.cohortId)"
              class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4
                     hover:border-gw-primary transition-all cursor-pointer active:scale-[0.99]">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
                  <i-lucide [img]="UsersIcon" size="18" class="text-gw-primary"></i-lucide>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-black text-gw-text truncate">{{ cohort.cohortName }}</p>
                    <span class="text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0"
                      [class]="cohort.isActive ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'">
                      {{ cohort.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  @if (cohort.description) {
                    <p class="text-[11px] text-gw-text-muted mt-0.5 truncate">{{ cohort.description }}</p>
                  }
                  <div class="flex items-center gap-3 mt-2">
                    <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-gw-text-muted">
                      <i-lucide [img]="UserIcon" size="12"></i-lucide>{{ cohort.memberCount }} members
                    </span>
                    <span class="text-[11px] text-gw-text-muted">{{ cohort.dateCreated | date:'MMM d, y' }}</span>
                  </div>
                </div>
                <i-lucide [img]="ChevronIcon" size="16" class="text-gw-text-muted shrink-0 mt-1"></i-lucide>
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
            <button (click)="showCreateModal.set(false)" class="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gw-text-muted transition-colors">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="space-y-3">
            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Cohort Name *</label>
              <input formControlName="cohortName" type="text" placeholder="e.g. Batch June 2026 — HR English"
                class="w-full h-11 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text
                       placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
                [class.border-red-400]="createForm.get('cohortName')?.invalid && createForm.get('cohortName')?.touched">
            </div>
            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Description (optional)</label>
              <input formControlName="description" type="text" placeholder="Training program description"
                class="w-full h-11 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text
                       placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all">
            </div>
            <div class="flex gap-2 pt-2">
              <button type="button" (click)="showCreateModal.set(false)"
                      class="flex-1 h-11 border-2 border-gray-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-gw-text-muted hover:border-gray-300 transition-all">
                Cancel
              </button>
              <button type="submit" [disabled]="createForm.invalid || creating()"
                      class="flex-1 h-11 bg-gw-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity">
                {{ creating() ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </form>
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
  private router   = inject(Router);

  cohorts         = signal<any[]>([]);
  loading         = signal(true);
  creating        = signal(false);
  showCreateModal = signal(false);

  searchControl = new FormControl('');
  search        = signal('');

  filteredCohorts = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.cohorts();
    return this.cohorts().filter(c =>
      (c.cohortName || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  readonly UsersIcon     = Users;
  readonly PlusIcon      = Plus;
  readonly XIcon         = X;
  readonly BarChart2Icon = BarChart2;
  readonly UserIcon      = User;
  readonly SearchIcon    = Search;
  readonly ChevronIcon   = ChevronRight;

  createForm = this.fb.group({
    cohortName:  ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(256)]
  });

  ngOnInit() {
    this.loadCohorts();
    this.searchControl.valueChanges.subscribe(v => this.search.set(v || ''));
  }

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

  goToDetail(cohortId: number) {
    this.router.navigate(['/admin/cohorts', cohortId]);
  }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const v = this.createForm.value;
    this.adminSvc.createCohort({ cohortName: v.cohortName!, description: v.description || undefined })
      .pipe(catchError(err => {
        this.toast.error(err?.error?.errors?.[0] || 'Failed to create cohort');
        this.creating.set(false);
        return of(null);
      }))
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
}

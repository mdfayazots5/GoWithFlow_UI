import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  LucideAngularModule,
  ChevronLeft, Users, BarChart2, TrendingUp, Trophy,
  AlertCircle, Plus, X, Search, UserMinus
} from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-admin-cohort-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, UserAvatarComponent],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/cohorts"
           class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl
                  text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm flex-shrink-0">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (headerLoading()) {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        } @else if (analytics()) {
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-black text-gw-text">{{ analytics()!.cohortName }}</h2>
              <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gw-primary/10 text-gw-primary">
                {{ analytics()!.memberCount }} members
              </span>
            </div>
            @if (analytics()!.description) {
              <p class="text-xs text-gw-text-muted mt-0.5">{{ analytics()!.description }}</p>
            }
          </div>
        } @else {
          <h2 class="text-xl font-black text-gw-text">Cohort Details</h2>
        }
      </div>

      <!-- ── Analytics Stats ─────────────────────────────────────────── -->
      @if (!headerLoading() && analytics()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
            <p class="text-2xl font-black text-gw-text">{{ analytics()!.memberCount }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Members</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
            <p class="text-2xl font-black text-gw-text">{{ analytics()!.avgFluencyScore | number:'1.0-0' }}%</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Avg Fluency</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
            <p class="text-2xl font-black text-amber-500">{{ analytics()!.inactiveCount }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Inactive</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
            <p class="text-2xl font-black text-gw-success">{{ analytics()!.memberCount - analytics()!.inactiveCount }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Active</p>
          </div>
        </div>

        <!-- Most Improved + Top Mistakes -->
        @if (analytics()!.mostImproved || analytics()!.topGrammarMistakes?.length) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @if (analytics()!.mostImproved) {
              <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <i-lucide [img]="TrophyIcon" size="14" class="text-amber-500"></i-lucide>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Most Improved (30 days)</p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gw-success/10 flex items-center justify-center">
                    <i-lucide [img]="TrendingIcon" size="16" class="text-gw-success"></i-lucide>
                  </div>
                  <div>
                    <p class="text-sm font-black text-gw-text">{{ analytics()!.mostImproved.fullName }}</p>
                    <p class="text-[10px] text-gw-success font-bold">+{{ analytics()!.mostImproved.improvementDelta | number:'1.0-1' }} pts</p>
                  </div>
                </div>
              </div>
            }
            @if (analytics()!.topGrammarMistakes?.length) {
              <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <i-lucide [img]="AlertIcon" size="14" class="text-red-400"></i-lucide>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Top Grammar Mistakes</p>
                </div>
                <div class="space-y-2">
                  @for (m of analytics()!.topGrammarMistakes; track m.grammarTag) {
                    <div class="flex items-center justify-between px-3 py-2 bg-gw-bg rounded-xl">
                      <span class="text-xs font-semibold text-gw-text">{{ m.grammarTag }}</span>
                      <span class="text-xs font-black text-red-500">{{ m.mistakeCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── Members Section ─────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

        <!-- Members header -->
        <div class="flex items-center gap-2 px-6 py-4 border-b border-gw-bg">
          <i-lucide [img]="UsersIcon" size="16" class="text-gw-text-muted"></i-lucide>
          <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Members</h3>
          @if (!membersLoading()) {
            <span class="text-[10px] font-bold text-gw-text-muted">{{ members().length }} total</span>
          }
          <button (click)="openAddModal()"
                  class="ml-auto flex items-center gap-1.5 h-8 px-4 bg-gw-primary text-white
                         font-black text-[10px] uppercase tracking-widest rounded-xl
                         hover:opacity-90 transition-opacity">
            <i-lucide [img]="PlusIcon" size="12"></i-lucide>
            Add Member
          </button>
        </div>

        @if (membersLoading()) {
          <div class="flex justify-center py-12">
            <div class="w-6 h-6 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
          </div>
        } @else if (membersError()) {
          <div class="p-6 text-center">
            <i-lucide [img]="AlertIcon" size="24" class="text-red-400 mx-auto mb-2"></i-lucide>
            <p class="text-sm font-bold text-red-500">Failed to load members</p>
            <button (click)="reload()" class="mt-3 text-xs font-bold text-gw-primary hover:underline">Try again</button>
          </div>
        } @else if (members().length === 0) {
          <div class="py-14 text-center space-y-3">
            <i-lucide [img]="UsersIcon" size="28" class="text-gw-text-muted mx-auto"></i-lucide>
            <p class="text-xs font-semibold text-gw-text-muted">No users assigned to this cohort yet.</p>
            <button (click)="openAddModal()"
                    class="inline-flex items-center gap-1.5 h-8 px-4 bg-gw-primary text-white
                           font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
              <i-lucide [img]="PlusIcon" size="12"></i-lucide>
              Add First Member
            </button>
          </div>
        } @else {
          <!-- Table header (desktop) -->
          <div class="hidden md:grid grid-cols-[1fr_80px_80px_80px_56px_44px] gap-4 px-6 py-2
                      bg-gw-bg text-[9px] font-black uppercase tracking-widest text-gw-text-muted">
            <span>User</span>
            <span class="text-center">Sessions</span>
            <span class="text-center">Fluency</span>
            <span class="text-center">Mistakes</span>
            <span class="text-center">Status</span>
            <span></span>
          </div>
          <div class="divide-y divide-gw-bg">
            @for (member of members(); track member.userId) {
              <div class="flex md:grid md:grid-cols-[1fr_80px_80px_80px_56px_44px] gap-4 items-center px-6 py-3.5
                          hover:bg-gw-bg/40 transition-colors group">
                <!-- User -->
                <div class="flex items-center gap-3 min-w-0">
                  <app-user-avatar [name]="member.fullName" [avatarUrl]="member.avatarUrl" size="sm"></app-user-avatar>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate">{{ member.fullName }}</p>
                    <p class="text-[10px] text-gw-text-muted">{{ member.mobileNumber }} · {{ member.ageGroup }}</p>
                  </div>
                </div>
                <!-- Desktop stats -->
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black text-gw-text">{{ member.sessionCount }}</p>
                  <p class="text-[9px] text-gw-text-muted">sessions</p>
                </div>
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black text-gw-text">{{ member.avgFluencyScore | number:'1.0-0' }}%</p>
                  <p class="text-[9px] text-gw-text-muted">fluency</p>
                </div>
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black" [class]="member.totalMistakes > 0 ? 'text-amber-500' : 'text-gw-text'">
                    {{ member.totalMistakes }}
                  </p>
                  <p class="text-[9px] text-gw-text-muted">mistakes</p>
                </div>
                <div class="hidden md:flex justify-center">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                        [class]="member.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ member.isActive ? 'Active' : 'Off' }}
                  </span>
                </div>
                <!-- Mobile stats -->
                <div class="md:hidden ml-auto flex items-center gap-3 text-[10px] text-gw-text-muted font-semibold">
                  <span>{{ member.sessionCount }} sess</span>
                  <span>{{ member.avgFluencyScore | number:'1.0-0' }}%</span>
                  <span class="font-black px-1.5 py-0.5 rounded-lg"
                        [class]="member.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ member.isActive ? 'Active' : 'Off' }}
                  </span>
                </div>
                <!-- Remove button -->
                <div class="hidden md:flex justify-center">
                  <button (click)="removeMember(member)"
                          [disabled]="removing() === member.userId"
                          title="Remove from cohort"
                          class="w-7 h-7 flex items-center justify-center rounded-lg text-gw-text-muted
                                 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-40
                                 opacity-0 group-hover:opacity-100">
                    @if (removing() === member.userId) {
                      <div class="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                    } @else {
                      <i-lucide [img]="UserMinusIcon" size="13"></i-lucide>
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         ADD MEMBER MODAL
    ══════════════════════════════════════════════════════════════ -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeModal()">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
             (click)="$event.stopPropagation()">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gw-bg flex-shrink-0">
            <div>
              <h2 class="text-base font-black text-gw-text uppercase tracking-wider">Add Member</h2>
              <p class="text-[10px] text-gw-text-muted mt-0.5">Search and assign a user to this cohort</p>
            </div>
            <button (click)="closeModal()"
                    class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gw-bg transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>

          <!-- Search input -->
          <div class="px-6 py-4 border-b border-gw-bg flex-shrink-0">
            <div class="relative">
              <i-lucide [img]="SearchIcon" size="14"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
              <input #searchInput
                     type="text"
                     placeholder="Search by name or mobile..."
                     [ngModel]="searchTerm()"
                     (ngModelChange)="onSearch($event)"
                     class="w-full h-10 pl-9 pr-4 bg-gw-bg border border-transparent rounded-xl
                            text-sm font-medium text-gw-text placeholder:text-gw-text-muted
                            focus:border-gw-primary focus:bg-white outline-none transition-all">
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 overflow-y-auto">
            @if (searchLoading()) {
              <div class="flex justify-center py-10">
                <div class="w-5 h-5 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
              </div>
            } @else if (searchResults().length === 0) {
              <div class="py-10 text-center text-xs font-semibold text-gw-text-muted">
                {{ searchTerm() ? 'No users found.' : 'Type a name to search.' }}
              </div>
            } @else {
              @for (user of searchResults(); track user.id) {
                <div class="flex items-center gap-3 px-6 py-3.5 border-b border-gw-bg last:border-0
                            hover:bg-gw-bg transition-colors"
                     [class.opacity-50]="isAlreadyMember(user.id)"
                     [class.cursor-not-allowed]="isAlreadyMember(user.id)">
                  <!-- Avatar -->
                  <app-user-avatar [name]="user.name" [avatarUrl]="user.avatar" size="sm"></app-user-avatar>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate">{{ user.name }}</p>
                    <p class="text-[10px] text-gw-text-muted">{{ user.mobileNumber }} · {{ user.ageGroup }}</p>
                  </div>
                  <!-- Action -->
                  @if (isAlreadyMember(user.id)) {
                    <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gw-success/10 text-gw-success flex-shrink-0">
                      Assigned
                    </span>
                  } @else {
                    <button (click)="assignMember(user)"
                            [disabled]="assigning() === +user.id"
                            class="h-7 px-3 bg-gw-primary text-white font-black text-[10px] uppercase
                                   tracking-widest rounded-lg hover:opacity-90 transition-opacity
                                   disabled:opacity-50 flex items-center gap-1 flex-shrink-0">
                      @if (assigning() === +user.id) {
                        <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      } @else {
                        <i-lucide [img]="PlusIcon" size="11"></i-lucide>
                        Add
                      }
                    </button>
                  }
                </div>
              }
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class AdminCohortDetailComponent implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private adminSvc = inject(AdminService);
  private toast    = inject(ToastService);

  // Page data
  members        = signal<any[]>([]);
  analytics      = signal<any>(null);
  membersLoading = signal(true);
  headerLoading  = signal(true);
  membersError   = signal(false);
  analyticsError = signal(false);

  // Member actions
  removing = signal<number | null>(null);

  // Add Member modal
  modalOpen     = signal(false);
  searchTerm    = signal('');
  searchResults = signal<any[]>([]);
  searchLoading = signal(false);
  assigning     = signal<number | null>(null);

  private cohortId   = 0;
  private search$    = new Subject<string>();
  private searchSub  = this.search$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => {
      if (!term.trim()) { this.searchResults.set([]); this.searchLoading.set(false); return of(null); }
      this.searchLoading.set(true);
      return this.adminSvc.getUsers({ search: term, pageSize: 8 })
        .pipe(catchError(() => of({ items: [] })));
    })
  ).subscribe(res => {
    if (res) { this.searchResults.set(res.items ?? []); }
    this.searchLoading.set(false);
  });

  readonly BackIcon      = ChevronLeft;
  readonly UsersIcon     = Users;
  readonly BarChart2Icon = BarChart2;
  readonly TrendingIcon  = TrendingUp;
  readonly TrophyIcon    = Trophy;
  readonly AlertIcon     = AlertCircle;
  readonly PlusIcon      = Plus;
  readonly XIcon         = X;
  readonly SearchIcon    = Search;
  readonly UserMinusIcon = UserMinus;

  ngOnInit() {
    this.cohortId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.cohortId) this.load();
  }

  ngOnDestroy() { this.searchSub.unsubscribe(); }

  load() {
    this.membersLoading.set(true);
    this.headerLoading.set(true);
    this.membersError.set(false);
    this.analyticsError.set(false);

    forkJoin({
      members:   this.adminSvc.getCohortMembers(this.cohortId)
                   .pipe(catchError(() => { this.membersError.set(true); return of([]); })),
      analytics: this.adminSvc.getCohortAnalytics(this.cohortId)
                   .pipe(catchError(() => { this.analyticsError.set(true); return of(null); }))
    }).subscribe(({ members, analytics }) => {
      this.members.set((members ?? []).map((m: any) => ({
        userId:          m.userId,
        fullName:        m.fullName,
        mobileNumber:    m.mobileNumber,
        ageGroup:        m.ageGroup,
        isActive:        m.isActive,
        avatarUrl:       m.avatarUrl   || null,
        sessionCount:    m.sessionCount,
        avgFluencyScore: m.avgFluencyScore,
        totalMistakes:   m.totalMistakes
      })));
      this.analytics.set(analytics);
      this.membersLoading.set(false);
      this.headerLoading.set(false);
    });
  }

  reload() { this.load(); }

  // ── Add Member modal ────────────────────────────────────────────

  openAddModal() {
    this.modalOpen.set(true);
    this.searchTerm.set('');
    this.searchResults.set([]);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
    this.searchLoading.set(!!term.trim());
    this.search$.next(term);
  }

  isAlreadyMember(userId: string): boolean {
    return this.members().some(m => String(m.userId) === String(userId));
  }

  assignMember(user: any) {
    const uid = +user.id;
    this.assigning.set(uid);
    this.adminSvc.assignUserToCohort(uid, this.cohortId)
      .pipe(catchError(err => {
        this.toast.error(err?.error?.errors?.[0] || 'Failed to assign user');
        this.assigning.set(null);
        return of(null);
      }))
      .subscribe(res => {
        if (res !== null) {
          this.toast.success(`${user.name} added to cohort`);
          this.closeModal();
          this.load();
        }
        this.assigning.set(null);
      });
  }

  // ── Remove member ───────────────────────────────────────────────

  removeMember(member: any) {
    this.removing.set(member.userId);
    this.adminSvc.assignUserToCohort(member.userId, null)
      .pipe(catchError(err => {
        this.toast.error(err?.error?.errors?.[0] || 'Failed to remove member');
        this.removing.set(null);
        return of(null);
      }))
      .subscribe(res => {
        if (res !== null) {
          this.toast.success(`${member.fullName} removed from cohort`);
          this.load();
        }
        this.removing.set(null);
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  initials(name: string): string {
    return name?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() ?? '?';
  }
}

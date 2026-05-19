import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService, AdminUserListItem, AdminUserDetail } from '@core/services/admin.service';
import { LucideAngularModule, Search, User, Phone, Globe, ArrowRight, Eye, UserX, UserCheck, BarChart2, Flame, Users, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-angular';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ToastService } from '@core/services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatPaginatorModule,
  ],
  template: `
    <!-- User Detail Side Panel Overlay -->
    @if (selectedUser()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedUser.set(null)">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Panel Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 class="text-base font-black text-gw-text uppercase tracking-wider">User Profile</h2>
            <button (click)="selectedUser.set(null)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="18"></i-lucide>
            </button>
          </div>

          <!-- Avatar + Name -->
          <div class="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100">
            <div class="w-20 h-20 rounded-2xl bg-gw-primary/10 flex items-center justify-center text-2xl font-black text-gw-primary mb-4">
              {{ initials(selectedUser()!.name) }}
            </div>
            <h3 class="text-lg font-black text-gw-text">{{ selectedUser()!.name }}</h3>
            <span class="text-xs font-bold text-gw-text-muted mt-1">{{ selectedUser()!.ageGroup }}</span>
            <span class="mt-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
              [class]="selectedUser()!.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
              {{ selectedUser()!.status }}
            </span>
          </div>

          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3 px-6 py-5 border-b border-gray-100">
            <div class="bg-gw-bg rounded-xl p-3 text-center">
              <p class="text-xl font-black text-gw-accent">{{ selectedUser()!.sessions }}</p>
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider mt-0.5">Sessions</p>
            </div>
            <div class="bg-gw-bg rounded-xl p-3 text-center">
              <p class="text-xl font-black text-gw-primary">{{ selectedUser()!.streak }}</p>
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider mt-0.5">Streak</p>
            </div>
            <div class="bg-gw-bg rounded-xl p-3 text-center">
              <p class="text-xl font-black text-gw-success">—</p>
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider mt-0.5">Avg Score</p>
            </div>
          </div>

          <!-- Contact -->
          <div class="px-6 py-5 space-y-3 border-b border-gray-100">
            <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Contact</p>
            <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
              <i-lucide [img]="PhoneIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
              <span class="text-sm font-bold text-gw-text">{{ selectedUser()!.mobileNumber }}</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
              <i-lucide [img]="GlobeIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
              <span class="text-sm font-bold text-gw-text">{{ detailUser()?.preferredHintLanguage || '—' }}</span>
            </div>
          </div>

          <!-- Recent Sessions -->
          @if (detailUser()?.recentSessions?.length) {
            <div class="px-6 py-5 space-y-3">
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Recent Sessions</p>
              @for (session of detailUser()!.recentSessions; track session.id) {
                <div class="flex items-center justify-between p-3 bg-gw-bg rounded-xl">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-gw-text truncate">{{ session.title }}</p>
                    <p class="text-[10px] text-gw-text-muted">{{ session.date | date:'mediumDate' }}</p>
                  </div>
                  <span class="text-sm font-black text-gw-success ml-3">{{ session.score }}%</span>
                </div>
              }
            </div>
          }

          <!-- Actions -->
          <div class="mt-auto px-6 py-5 border-t border-gray-100 flex gap-3">
            <button
              class="flex-1 h-12 bg-gw-primary text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              (click)="viewFullReport(selectedUser()!.id)">
              Full Report
            </button>
            <button
              class="h-12 px-5 border-2 font-black text-sm uppercase tracking-widest rounded-xl transition-all"
              [class]="selectedUser()!.status === 'ACTIVE'
                ? 'border-red-400 text-red-500 hover:bg-red-50'
                : 'border-green-400 text-green-600 hover:bg-green-50'"
              (click)="toggleStatus(selectedUser()!)">
              {{ selectedUser()!.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Main Content -->
    <div class="space-y-5">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="UsersIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-lg font-black text-gw-text uppercase tracking-wide">Users</h1>
            <p class="text-xs text-gw-text-muted font-medium">
              {{ loading() ? 'Loading...' : totalUsers() + ' total users' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
        <!-- Search -->
        <div class="relative flex-1 min-w-[180px]">
          <i-lucide [img]="SearchIcon" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
          <input
            [formControl]="searchControl"
            type="text"
            placeholder="Search name or mobile..."
            class="w-full h-10 bg-gw-bg border border-transparent rounded-xl pl-9 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
          >
        </div>

        <!-- Age Group -->
        <div class="relative">
          <select
            [formControl]="ageFilterControl"
            class="h-10 bg-gw-bg border border-transparent rounded-xl pl-3 pr-8 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Ages</option>
            <option value="Child (6-12)">Child (6–12)</option>
            <option value="Teen (13-17)">Teen (13–17)</option>
            <option value="Adult (18+)">Adult (18+)</option>
          </select>
          <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gw-text-muted">&#8964;</span>
        </div>

        <!-- Active Only Toggle -->
        <button
          (click)="toggleActiveOnly()"
          class="flex items-center gap-2 h-10 px-4 rounded-xl border transition-all text-sm font-bold"
          [class]="activeOnly()
            ? 'bg-gw-primary/10 border-gw-primary text-gw-primary'
            : 'bg-gw-bg border-transparent text-gw-text-muted hover:border-gw-card-border'"
        >
          <div class="w-8 h-4 rounded-full relative transition-colors" [class]="activeOnly() ? 'bg-gw-primary' : 'bg-gray-300'">
            <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all" [class]="activeOnly() ? 'left-4' : 'left-0.5'"></div>
          </div>
          Active only
        </button>
      </div>

      <!-- Table Card -->
      <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-8 h-8 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-gw-text-muted">Loading users...</p>
          </div>
        }

        <!-- Empty State -->
        @else if (users().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="UsersIcon" size="28" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="text-center">
              <p class="font-black text-gw-text">No users found</p>
              <p class="text-sm text-gw-text-muted mt-1">Try adjusting your search or filters</p>
            </div>
            <button (click)="clearFilters()" class="text-sm font-bold text-gw-primary hover:underline">Clear filters</button>
          </div>
        }

        <!-- Table -->
        @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gw-card-border">
                  <th class="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">User</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Age Group</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Activity</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Last Active</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Status</th>
                  <th class="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of users(); track row.id) {
                  <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors group">
                    <!-- User -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center text-xs font-black text-gw-primary flex-shrink-0">
                          {{ initials(row.name) }}
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-gw-text truncate">{{ row.name }}</p>
                          <p class="text-[11px] text-gw-text-muted font-medium">{{ row.mobileNumber }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Age Group -->
                    <td class="px-4 py-4 hidden md:table-cell">
                      <span class="text-xs font-bold text-gw-text-muted bg-gw-bg px-2.5 py-1 rounded-lg">{{ row.ageGroup }}</span>
                    </td>

                    <!-- Activity (sessions + streak) -->
                    <td class="px-4 py-4 hidden sm:table-cell">
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-1.5">
                          <i-lucide [img]="SessionsIcon" size="13" class="text-gw-accent flex-shrink-0"></i-lucide>
                          <span class="text-xs font-black text-gw-text">{{ row.sessions }}</span>
                          <span class="text-[10px] text-gw-text-muted">sessions</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <i-lucide [img]="FlameIcon" size="13" class="text-orange-400 flex-shrink-0"></i-lucide>
                          <span class="text-xs font-black text-gw-text">{{ row.streak }}</span>
                          <span class="text-[10px] text-gw-text-muted">streak</span>
                        </div>
                      </div>
                    </td>

                    <!-- Last Active -->
                    <td class="px-4 py-4 hidden lg:table-cell">
                      <span class="text-xs font-medium text-gw-text-muted">
                        {{ row.lastActive ? (row.lastActive | date:'d MMM y') : '—' }}
                      </span>
                    </td>

                    <!-- Status Badge -->
                    <td class="px-4 py-4 text-center">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                        [class]="row.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'">
                        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          [class]="row.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-400'"></span>
                        {{ row.status }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-4 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          (click)="openDetail(row)"
                          title="View profile"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gw-primary hover:bg-gw-primary/10 transition-colors">
                          <i-lucide [img]="ViewIcon" size="15"></i-lucide>
                        </button>
                        <button
                          (click)="toggleStatus(row)"
                          [title]="row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'"
                          class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                          [class]="row.status === 'ACTIVE'
                            ? 'text-gw-text-muted hover:text-red-500 hover:bg-red-50'
                            : 'text-gw-text-muted hover:text-green-600 hover:bg-green-50'">
                          <i-lucide [img]="row.status === 'ACTIVE' ? DeactivateIcon : ActivateIcon" size="15"></i-lucide>
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
              Showing {{ currentPage() * currentPageSize() + 1 }}–{{ pageEnd() }} of {{ totalUsers() }}
            </p>
            <mat-paginator
              [length]="totalUsers()"
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
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly SearchIcon   = Search;
  readonly UsersIcon    = Users;
  readonly SessionsIcon = BarChart2;
  readonly FlameIcon    = Flame;
  readonly ViewIcon     = Eye;
  readonly DeactivateIcon = UserX;
  readonly ActivateIcon   = UserCheck;
  readonly PhoneIcon    = Phone;
  readonly GlobeIcon    = Globe;
  readonly XIcon        = X;
  readonly ArrowIcon    = ArrowRight;

  users       = signal<AdminUserListItem[]>([]);
  totalUsers  = signal(0);
  loading     = signal(false);
  selectedUser = signal<AdminUserListItem | null>(null);
  detailUser   = signal<AdminUserDetail | null>(null);
  activeOnly   = signal(false);
  currentPage  = signal(0);
  currentPageSize = signal(10);

  searchControl   = new FormControl('');
  ageFilterControl = new FormControl('');

  pageEnd() {
    return Math.min((this.currentPage() + 1) * this.currentPageSize(), this.totalUsers());
  }

  ngOnInit() {
    this.loadUsers();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => { this.currentPage.set(0); this.loadUsers(); });

    this.ageFilterControl.valueChanges.subscribe(() => { this.currentPage.set(0); this.loadUsers(); });
  }

  loadUsers(page: number = this.currentPage(), size: number = this.currentPageSize()) {
    this.loading.set(true);
    this.adminService.getUsers({
      search:     this.searchControl.value,
      ageGroup:   this.ageFilterControl.value,
      activeOnly: this.activeOnly(),
      page,
      size
    }).subscribe({
      next: res => {
        this.users.set(res.items || []);
        this.totalUsers.set(res.total || res.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load users');
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.loadUsers(event.pageIndex, event.pageSize);
  }

  toggleActiveOnly() {
    this.activeOnly.update(v => !v);
    this.currentPage.set(0);
    this.loadUsers(0);
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.ageFilterControl.setValue('');
    this.activeOnly.set(false);
    this.currentPage.set(0);
    this.loadUsers(0);
  }

  openDetail(user: AdminUserListItem) {
    this.selectedUser.set(user);
    this.detailUser.set(null);
    this.adminService.getUserDetail(user.id).subscribe({
      next: detail => this.detailUser.set(detail),
      error: () => {}
    });
  }

  viewFullReport(userId: string) {
    this.router.navigate(['/admin/reports/user', userId]);
  }

  toggleStatus(user: AdminUserListItem | AdminUserDetail) {
    const goingActive = user.status !== 'ACTIVE';
    this.adminService.updateUserStatus({ userId: Number(user.id), isActive: goingActive }).subscribe({
      next: () => {
        this.toast.success(`User ${goingActive ? 'activated' : 'deactivated'}`);
        this.loadUsers();
        if (this.selectedUser()?.id === user.id) {
          const newStatus = goingActive ? 'ACTIVE' : 'INACTIVE';
          this.selectedUser.update(u => u ? { ...u, status: newStatus } : null);
        }
      },
      error: () => this.toast.error('Failed to update user status')
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

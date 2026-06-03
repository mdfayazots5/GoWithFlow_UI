import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService, AdminUserListItem, AdminUserDetail } from '@core/services/admin.service';
import { LucideAngularModule, Search, Eye, UserX, UserCheck, BarChart2, Flame, Users, X, UserPlus, Pencil, EyeOff, Camera } from 'lucide-angular';
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
    <!-- Add / Edit User Modal -->
    @if (showUserModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" (click)="closeUserModal()">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl mx-4" (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center">
                <i-lucide [img]="editingUserId() ? EditIcon : AddUserIcon" size="18" class="text-gw-primary"></i-lucide>
              </div>
              <h2 class="text-base font-black text-gw-text uppercase tracking-wider">
                {{ editingUserId() ? 'Edit User' : 'Add User' }}
              </h2>
            </div>
            <button (click)="closeUserModal()" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="16"></i-lucide>
            </button>
          </div>

          <!-- Modal Form -->
          <form [formGroup]="userForm" (ngSubmit)="submitUserForm()" autocomplete="off" class="px-6 py-5 space-y-4">

            <!-- Avatar Upload -->
            <div class="flex flex-col items-center gap-2 pb-2">
              <div class="relative">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-gw-primary overflow-hidden transition-all"
                  [class]="avatarError()
                    ? 'bg-red-50 ring-2 ring-red-400'
                    : 'bg-gw-primary/10'">
                  @if (avatarPreview()) {
                    <img [src]="avatarPreview()!" class="w-full h-full object-cover" alt="Avatar preview">
                  } @else if (editingUserId() && currentAvatarUrl()) {
                    <img [src]="currentAvatarUrl()!" class="w-full h-full object-cover" alt="Current avatar"
                      (error)="$any($event.target).style.display='none'">
                  } @else {
                    {{ initials(userForm.get('fullName')?.value || '?') }}
                  }
                </div>
                <label class="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition-all"
                  [class]="avatarError() ? 'bg-red-400' : 'bg-gw-primary'">
                  <i-lucide [img]="CameraIcon" size="13" class="text-white"></i-lucide>
                  <input type="file" accept="image/*" class="hidden" (change)="onAvatarFileChange($event)">
                </label>
              </div>

              <!-- File info or error -->
              @if (avatarError()) {
                <div class="flex items-start gap-1.5 w-full max-w-[220px] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <span class="text-red-500 font-black text-sm leading-none mt-0.5 flex-shrink-0">!</span>
                  <p class="text-[11px] font-bold text-red-600 leading-snug">{{ avatarError() }}</p>
                </div>
              } @else if (avatarFile()) {
                <div class="flex items-center gap-2 text-xs text-gw-text-muted">
                  <span class="truncate max-w-[180px]">{{ avatarFile()!.name }}</span>
                  <button type="button" (click)="clearAvatarFile()" class="text-red-400 hover:text-red-600 font-black flex-shrink-0">✕</button>
                </div>
              } @else {
                <p class="text-[10px] text-gw-text-muted italic">Click camera to upload image (max 2 MB)</p>
              }
            </div>

            <!-- Full Name -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Full Name <span class="text-red-500">*</span></label>
              <input formControlName="fullName" type="text" placeholder="e.g. Ravi Kumar" autocomplete="off"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
                [class.border-red-400]="userForm.get('fullName')?.invalid && userForm.get('fullName')?.touched">
            </div>

            <!-- Mobile Number -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Mobile Number <span class="text-red-500">*</span></label>
              <input formControlName="mobileNumber" type="tel" placeholder="e.g. 9876543210" autocomplete="off"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
                [class.border-red-400]="userForm.get('mobileNumber')?.invalid && userForm.get('mobileNumber')?.touched">
            </div>

            <!-- Email -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Email <span class="text-gw-text-muted font-medium normal-case">(optional)</span></label>
              <input formControlName="email" type="email" placeholder="e.g. ravi@example.com" autocomplete="off"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all">
            </div>

            <!-- Age Group -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">Age Group <span class="text-red-500">*</span></label>
              <select formControlName="ageGroup"
                class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 text-sm font-medium text-gw-text focus:border-gw-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                [class.border-red-400]="userForm.get('ageGroup')?.invalid && userForm.get('ageGroup')?.touched">
                <option value="">Select</option>
                <option value="Child (6-12)">Child (6–12)</option>
                <option value="Teen (13-17)">Teen (13–17)</option>
                <option value="Adult (18+)">Adult (18+)</option>
              </select>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gw-text-muted mb-1.5">
                Password
                @if (editingUserId()) {
                  <span class="text-gw-text-muted font-medium normal-case">(leave blank to keep current)</span>
                } @else {
                  <span class="text-red-500">*</span>
                }
              </label>
              <div class="relative">
                <input formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [placeholder]="editingUserId() ? 'Enter new password to change' : 'Min. 6 characters'"
                  autocomplete="new-password"
                  class="w-full h-10 bg-gw-bg border border-transparent rounded-xl px-3 pr-10 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all"
                  [class.border-red-400]="userForm.get('password')?.invalid && userForm.get('password')?.touched">
                <button type="button" (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gw-text-muted hover:text-gw-text transition-colors">
                  <i-lucide [img]="showPassword() ? EyeOffIcon : EyeShowIcon" size="15"></i-lucide>
                </button>
              </div>
              @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
                <p class="text-[10px] text-red-500 mt-1">
                  {{ editingUserId() ? 'Min. 6 characters if changing password' : 'Password is required (min. 6 characters)' }}
                </p>
              }
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeUserModal()"
                class="flex-1 h-11 border-2 border-gray-200 text-gw-text-muted font-black text-sm uppercase tracking-widest rounded-xl hover:border-gray-300 transition-all">
                Cancel
              </button>
              <button type="submit" [disabled]="userForm.invalid || userSubmitting() || !!avatarError()"
                class="flex-1 h-11 bg-gw-primary text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {{ userSubmitting() ? (editingUserId() ? 'Saving...' : 'Creating...') : (editingUserId() ? 'Save Changes' : 'Create User') }}
              </button>
            </div>

          </form>
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
        <button (click)="openAddModal()"
          class="flex items-center gap-2 h-10 px-4 bg-gw-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity">
          <i-lucide [img]="AddUserIcon" size="15"></i-lucide>
          Add User
        </button>
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
                        <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center text-xs font-black text-gw-primary flex-shrink-0 overflow-hidden">
                          @if (row.avatar) {
                            <img [src]="row.avatar" class="w-full h-full object-cover"
                              (error)="$any($event.target).style.display='none'" [alt]="row.name">
                          } @else {
                            {{ initials(row.name) }}
                          }
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
                          (click)="openEditModal(row)"
                          title="Edit user"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gw-text-muted hover:text-gw-primary hover:bg-gw-primary/10 transition-colors">
                          <i-lucide [img]="EditIcon" size="15"></i-lucide>
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

  readonly SearchIcon     = Search;
  readonly UsersIcon      = Users;
  readonly SessionsIcon   = BarChart2;
  readonly FlameIcon      = Flame;
  readonly ViewIcon       = Eye;
  readonly DeactivateIcon = UserX;
  readonly ActivateIcon   = UserCheck;
  readonly XIcon          = X;
  readonly AddUserIcon    = UserPlus;
  readonly EditIcon       = Pencil;
  readonly EyeShowIcon    = Eye;
  readonly EyeOffIcon     = EyeOff;
  readonly CameraIcon     = Camera;

  users       = signal<AdminUserListItem[]>([]);
  totalUsers  = signal(0);
  loading     = signal(false);
  activeOnly  = signal(false);
  currentPage    = signal(0);
  currentPageSize = signal(10);

  showUserModal    = signal(false);
  userSubmitting   = signal(false);
  editingUserId    = signal<string | null>(null);
  showPassword     = signal(false);
  avatarFile       = signal<File | null>(null);
  avatarPreview    = signal<string | null>(null);
  currentAvatarUrl = signal<string | null>(null);
  avatarError      = signal<string | null>(null);

  private readonly MAX_AVATAR_BYTES = 2 * 1024 * 1024;

  userForm = new FormGroup({
    fullName:              new FormControl('', [Validators.required, Validators.maxLength(128)]),
    mobileNumber:          new FormControl('', [Validators.required, Validators.maxLength(16)]),
    email:                 new FormControl(''),
    ageGroup:              new FormControl('', Validators.required),
    preferredHintLanguage: new FormControl('Telugu'),
    password:              new FormControl(''),
  });

  searchControl    = new FormControl('');
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
    this.router.navigate(['/admin/users', user.id]);
  }

  openAddModal() {
    this.editingUserId.set(null);
    this.showPassword.set(false);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.currentAvatarUrl.set(null);
    this.userForm.reset({ fullName: '', mobileNumber: '', email: '', ageGroup: '', preferredHintLanguage: 'Telugu', password: '' });
    this.avatarError.set(null);
    const pwCtrl = this.userForm.get('password')!;
    pwCtrl.setValidators([Validators.required, Validators.minLength(6)]);
    pwCtrl.updateValueAndValidity();
    this.showUserModal.set(true);
  }

  openEditModal(user: AdminUserListItem) {
    this.editingUserId.set(user.id);
    this.showPassword.set(false);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.currentAvatarUrl.set(user.avatar || null);
    this.userForm.reset();
    const pwCtrl = this.userForm.get('password')!;
    pwCtrl.setValidators([Validators.minLength(6)]);
    pwCtrl.updateValueAndValidity();

    this.userForm.patchValue({
      fullName:    user.name,
      mobileNumber: user.mobileNumber,
      ageGroup:    user.ageGroup,
    });

    this.adminService.getUserDetail(user.id).subscribe({
      next: detail => {
        if (this.editingUserId() !== user.id) return;
        this.userForm.patchValue({
          email: detail.email || '',
          preferredHintLanguage: 'Telugu',
        });
        if (detail.avatar) this.currentAvatarUrl.set(detail.avatar);
      },
      error: () => {}
    });

    this.showUserModal.set(true);
  }

  closeUserModal() {
    this.showUserModal.set(false);
    this.editingUserId.set(null);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.currentAvatarUrl.set(null);
    this.avatarError.set(null);
    this.userForm.reset({ fullName: '', mobileNumber: '', email: '', ageGroup: '', preferredHintLanguage: 'Telugu', password: '' });
    this.showPassword.set(false);
  }

  submitUserForm() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    if (this.avatarError()) return;

    const v = this.userForm.value;
    this.userSubmitting.set(true);

    const userId = this.editingUserId();

    const file = this.avatarFile();

    const afterSave = (savedUserId: string | number) => {
      if (!file) { this.toast.success(userId ? 'User updated successfully' : 'User created successfully'); this.closeUserModal(); this.loadUsers(); return; }
      this.adminService.uploadUserAvatar(savedUserId, file).subscribe({
        next: () => { this.toast.success(userId ? 'User updated successfully' : 'User created successfully'); this.closeUserModal(); this.loadUsers(); },
        error: () => { this.toast.success(userId ? 'User updated (avatar upload failed)' : 'User created (avatar upload failed)'); this.closeUserModal(); this.loadUsers(); }
      });
    };

    if (userId) {
      this.adminService.updateUser(userId, {
        fullName:              v.fullName!,
        mobileNumber:          v.mobileNumber!,
        email:                 v.email || undefined,
        ageGroup:              v.ageGroup!,
        preferredHintLanguage: v.preferredHintLanguage!,
        password:              v.password || undefined,
      }).subscribe({
        next: () => afterSave(userId),
        error: (err) => {
          const msg = err?.error?.errors?.[0] || 'Failed to update user';
          this.toast.error(msg);
          this.userSubmitting.set(false);
        },
        complete: () => this.userSubmitting.set(false)
      });
    } else {
      this.adminService.createUser({
        fullName:              v.fullName!,
        mobileNumber:          v.mobileNumber!,
        email:                 v.email || undefined,
        ageGroup:              v.ageGroup!,
        preferredHintLanguage: v.preferredHintLanguage!,
        password:              v.password!,
      }).subscribe({
        next: (res) => afterSave(res?.data?.userId ?? res?.data?.id ?? userId),
        error: (err) => {
          const msg = err?.error?.errors?.[0] || 'Failed to create user';
          this.toast.error(msg);
          this.userSubmitting.set(false);
        },
        complete: () => this.userSubmitting.set(false)
      });
    }
  }

  toggleStatus(user: AdminUserListItem | AdminUserDetail) {
    const goingActive = user.status !== 'ACTIVE';
    this.adminService.updateUserStatus({ userId: Number(user.id), isActive: goingActive }).subscribe({
      next: () => {
        this.toast.success(`User ${goingActive ? 'activated' : 'deactivated'}`);
        this.loadUsers();
      },
      error: () => this.toast.error('Failed to update user status')
    });
  }

  onAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > this.MAX_AVATAR_BYTES) {
      this.avatarError.set('Image must be under 2 MB. Please choose a smaller file.');
      this.avatarFile.set(null);
      this.avatarPreview.set(null);
      return;
    }

    this.avatarError.set(null);
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearAvatarFile() {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

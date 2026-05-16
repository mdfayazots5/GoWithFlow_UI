import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService, AdminUserListItem, AdminUserDetail } from '@core/services/admin.service';
import { LucideAngularModule, Search, Filter, User, Phone, Calendar, ArrowRight, Eye, UserX, BarChart, X } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
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
    MatTableModule, 
    MatPaginatorModule, 
    MatSidenavModule
  ],
  template: `
    <mat-sidenav-container class="h-full bg-transparent">
      <mat-sidenav #sidenav mode="over" position="end" [opened]="selectedUser() !== null" (closed)="selectedUser.set(null)" class="w-full max-w-md border-l border-gw-card-border p-8 bg-white shadow-2xl rounded-l-3xl">
        @if (selectedUser()) {
          <div class="space-y-8 animate-in slide-in-from-right duration-300">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-gw-text uppercase italic tracking-tight">User Profile</h2>
              <button (click)="selectedUser.set(null)" class="p-2 text-gw-text-muted hover:bg-gw-bg rounded-xl">
                <i-lucide [img]="XIcon" size="20"></i-lucide>
              </button>
            </div>

            <div class="flex flex-col items-center text-center space-y-4">
              <div class="w-32 h-32 rounded-3xl bg-gw-bg p-1 border-4 border-gw-primary/10">
                <img [src]="selectedUser()?.avatar" class="w-full h-full object-cover rounded-2xl">
              </div>
              <div>
                <h3 class="text-2xl font-black text-gw-text italic">{{ selectedUser()?.name }}</h3>
                <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest">{{ selectedUser()?.ageGroup }}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gw-bg/50 p-4 rounded-2xl text-center">
                <p class="text-xl font-black text-gw-primary italic">{{ selectedUser()?.streak }}</p>
                <p class="text-[8px] font-bold text-gw-text-muted uppercase tracking-widest mt-1">Streak</p>
              </div>
              <div class="bg-gw-bg/50 p-4 rounded-2xl text-center">
                <p class="text-xl font-black text-gw-accent italic">{{ selectedUser()?.sessions }}</p>
                <p class="text-[8px] font-bold text-gw-text-muted uppercase tracking-widest mt-1">Sessions</p>
              </div>
              <div class="bg-gw-bg/50 p-4 rounded-2xl text-center">
                <p class="text-xl font-black text-gw-success italic">85%</p>
                <p class="text-[8px] font-bold text-gw-text-muted uppercase tracking-widest mt-1">Avg Score</p>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Contact Details</h4>
              <div class="space-y-3">
                <div class="flex items-center gap-3 p-4 bg-white border border-gw-card-border rounded-2xl group hover:border-gw-primary transition-colors">
                  <i-lucide [img]="PhoneIcon" size="18" class="text-gw-text-muted"></i-lucide>
                  <span class="text-sm font-bold text-gw-text">{{ selectedUser()?.mobileNumber }}</span>
                </div>
                <div class="flex items-center gap-3 p-4 bg-white border border-gw-card-border rounded-2xl group hover:border-gw-primary transition-colors">
                  <i-lucide [img]="LanguageIcon" size="18" class="text-gw-text-muted"></i-lucide>
                  <span class="text-sm font-bold text-gw-text">{{ selectedUser()?.preferredHintLanguage }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Recent Sessions</h4>
              <div class="space-y-3">
                @for (session of selectedUser()?.recentSessions; track session.id) {
                  <div class="flex items-center justify-between p-4 bg-gw-bg/30 rounded-2xl border border-transparent hover:border-gw-card-border transition-all">
                    <div>
                      <p class="text-sm font-bold text-gw-text">{{ session.title }}</p>
                      <p class="text-[10px] font-medium text-gw-text-muted">{{ session.date | date:'mediumDate' }}</p>
                    </div>
                    <span class="text-sm font-black text-gw-success">{{ session.score }}%</span>
                  </div>
                }
              </div>
            </div>

            <div class="pt-4 flex gap-4">
              <button 
                class="flex-1 h-14 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                (click)="viewFullReport(selectedUser()!.id)"
              >
                Full Report
              </button>
              <button 
                class="h-14 px-6 border-2 border-gw-error text-gw-error font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-error/5 transition-all"
                (click)="toggleStatus(selectedUser()!)"
              >
                {{ selectedUser()?.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        }
      </mat-sidenav>

      <mat-sidenav-content class="space-y-6">
        <!-- Filters Row -->
        <div class="grid lg:grid-cols-4 gap-4 items-end">
          <div class="lg:col-span-2 space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Search Users</label>
            <div class="relative">
              <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted"></i-lucide>
              <input 
                [formControl]="searchControl"
                type="text" 
                class="w-full h-14 bg-white border border-gw-card-border rounded-2xll pl-12 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all shadow-sm"
                placeholder="Name or Mobile..."
              >
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Age Group</label>
            <select 
              [formControl]="ageFilterControl"
              class="w-full h-14 bg-white border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none appearance-none shadow-sm transition-all"
            >
              <option value="">All Ages</option>
              <option value="Child (6-12)">Child (6-12)</option>
              <option value="Teen (13-17)">Teen (13-17)</option>
              <option value="Adult (18+)">Adult (18+)</option>
            </select>
          </div>

          <div class="flex items-center justify-between h-14 bg-white border border-gw-card-border rounded-2xl px-4 shadow-sm">
             <span class="text-xs font-black uppercase text-gw-text-muted tracking-widest">Active Only</span>
             <button 
                (click)="toggleActiveOnly()"
                class="w-12 h-6 rounded-full p-1 transition-colors duration-300"
                [class]="activeOnly() ? 'bg-gw-primary' : 'bg-gw-bg'"
             >
               <div class="w-4 h-4 bg-white rounded-full transition-transform duration-300" [class.translate-x-6]="activeOnly()"></div>
             </button>
          </div>
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <table mat-table [dataSource]="users()" class="w-full">
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef class="px-6 py-4"></th>
              <td mat-cell *matCellDef="let row" class="px-6 py-4">
                <div class="w-10 h-10 rounded-xl bg-gw-bg border border-gw-card-border p-1">
                  <img [src]="row.avatar" class="w-full h-full object-cover rounded-lg">
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest">User Details</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex flex-col">
                  <span class="font-bold text-gw-text">{{ row.name }}</span>
                  <span class="text-[10px] font-medium text-gw-text-muted">{{ row.mobileNumber }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="age">
              <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest">Age Group</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="text-xs font-bold text-gw-text-muted">{{ row.ageGroup }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="stats">
              <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest">Sessions / Streak</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <i-lucide [img]="PlayIcon" size="14" class="text-gw-accent"></i-lucide>
                    <span class="text-xs font-black italic">{{ row.sessions }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <i-lucide [img]="FlameIcon" size="14" class="text-gw-primary"></i-lucide>
                    <span class="text-xs font-black italic">{{ row.streak }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastActive">
              <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest">Last Active</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="text-xs font-bold text-gw-text-muted">{{ row.lastActive | date:'shortDate' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-center">
                <div class="w-2 h-2 rounded-full mx-auto" [class]="row.status === 'ACTIVE' ? 'bg-gw-success' : 'bg-gw-error'"></div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="py-4"></th>
              <td mat-cell *matCellDef="let row" class="py-4 text-right pr-6">
                <div class="flex justify-end gap-1">
                  <button (click)="openDetail(row)" class="p-2 text-gw-primary hover:bg-gw-primary/10 rounded-xl transition-colors">
                    <i-lucide [img]="ViewIcon" size="18"></i-lucide>
                  </button>
                  <button (click)="toggleStatus(row)" class="p-2 text-gw-text-muted hover:text-gw-error hover:bg-gw-error/10 rounded-xl transition-colors">
                    <i-lucide [img]="DeactivateIcon" size="18"></i-lucide>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gw-bg/50 transition-colors"></tr>
          </table>

          <mat-paginator 
            [length]="totalUsers()"
            [pageSize]="10"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            class="!border-t !border-gw-card-border"
          ></mat-paginator>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mat-mdc-table { background: transparent; }
    .mat-mdc-header-cell { border-bottom: 1px solid var(--gw-card-border); color: var(--gw-text-muted); }
    .mat-mdc-sidenav-container { background: transparent; }
    ::ng-view-paginator { @apply font-sans; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly SearchIcon = Search;
  readonly PlayIcon = BarChart;
  readonly FlameIcon = BarChart; // Using BarChart as placeholder for streak
  readonly ViewIcon = Eye;
  readonly DeactivateIcon = UserX;
  readonly PhoneIcon = Phone;
  readonly XIcon = X;
  readonly LanguageIcon = Calendar; // Placeholder

  users = signal<AdminUserListItem[]>([]);
  totalUsers = signal(0);
  selectedUser = signal<AdminUserDetail | null>(null);
  activeOnly = signal(false);

  searchControl = new FormControl('');
  ageFilterControl = new FormControl('');

  displayedColumns: string[] = ['avatar', 'name', 'age', 'stats', 'lastActive', 'status', 'actions'];

  ngOnInit() {
    this.loadUsers();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadUsers());

    this.ageFilterControl.valueChanges.subscribe(() => this.loadUsers());
  }

  loadUsers(page: number = 0, size: number = 10) {
    const filters = {
      search: this.searchControl.value,
      ageGroup: this.ageFilterControl.value,
      activeOnly: this.activeOnly(),
      page,
      size
    };

    this.adminService.getUsers(filters).subscribe(res => {
      this.users.set(res.items || []);
      this.totalUsers.set(res.total || 0);
    });
  }

  onPageChange(event: PageEvent) {
    this.loadUsers(event.pageIndex, event.pageSize);
  }

  toggleActiveOnly() {
    this.activeOnly.update(v => !v);
    this.loadUsers();
  }

  openDetail(user: AdminUserListItem) {
    this.adminService.getUserDetail(user.id).subscribe(detail => {
      this.selectedUser.set(detail);
      // We'll see how to open it in HTML by binding its property
    });
  }

  viewFullReport(userId: string) {
    this.router.navigate(['/admin/reports/user', userId]);
  }

  toggleStatus(user: AdminUserListItem | AdminUserDetail) {
    const isActive = user.status !== 'ACTIVE';
    const newStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    this.adminService.updateUserStatus({ userId: Number(user.id), isActive }).subscribe(() => {
      this.toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      this.loadUsers();
      if (this.selectedUser()?.id === user.id) {
        this.selectedUser.update(u => u ? { ...u, status: newStatus } : null);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, MoreHorizontal, Shield, UserX, UserCheck } from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-8 space-y-8 animate-in slide-in-from-right-5 duration-500">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Member Registry</h1>
          <p class="text-ls-text-muted font-medium">Manage family and professional mock interview participants</p>
        </div>
        <button class="btn-primary px-8">Add New Member</button>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col md:row items-center gap-4 bg-white p-4 rounded-2xl border border-ls-card-border shadow-sm">
        <div class="relative flex-1">
           <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
           <input type="text" placeholder="Search by name or phone..." class="input-field pl-12 h-12 border-none bg-ls-bg">
        </div>
        <div class="flex items-center gap-2">
           <button class="flex items-center gap-2 px-4 py-2 border border-ls-card-border rounded-xl text-xs font-black uppercase tracking-widest text-ls-text-muted hover:bg-ls-bg transition-all">
              <i-lucide [img]="FilterIcon" size="14"></i-lucide>
              Filters
           </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card p-0 overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-ls-bg/50 border-b border-ls-card-border">
            <tr>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Member</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Role</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Status</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted text-center">Sessions</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ls-card-border">
            <tr *ngFor="let user of users" class="hover:bg-ls-bg/30 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name" class="w-10 h-10 rounded-xl border border-ls-card-border">
                  <div>
                    <p class="font-bold text-ls-text">{{ user.name }}</p>
                    <p class="text-[10px] font-medium text-ls-text-muted">{{ user.mobileNumber }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md" 
                      [class.bg-blue-100]="user.role === 'ADMIN'" 
                      [class.text-blue-600]="user.role === 'ADMIN'"
                      [class.bg-ls-bg]="user.role !== 'ADMIN'">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                 <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" 
                         [class.bg-ls-success]="user.status === 'ACTIVE'"
                         [class.bg-ls-error]="user.status === 'BANNED'"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-ls-text">
                      {{ user.status }}
                    </span>
                 </div>
              </td>
              <td class="px-6 py-4 text-center font-black italic text-ls-text">{{ user.sessions }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 shrink-0">
                  <button (click)="viewReport(user.id)" class="p-2 text-ls-primary hover:bg-blue-50 rounded-lg transition-all" title="View Report">
                    <i-lucide [img]="ShieldIcon" size="18"></i-lucide>
                  </button>
                  <button *ngIf="user.status === 'ACTIVE'" (click)="toggleStatus(user.id, 'BANNED')" class="p-2 text-ls-error hover:bg-red-50 rounded-lg transition-all" title="Ban User">
                    <i-lucide [img]="BanIcon" size="18"></i-lucide>
                  </button>
                  <button *ngIf="user.status !== 'ACTIVE'" (click)="toggleStatus(user.id, 'ACTIVE')" class="p-2 text-ls-success hover:bg-green-50 rounded-lg transition-all" title="Activate User">
                    <i-lucide [img]="CheckIcon" size="18"></i-lucide>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="px-6 py-4 bg-ls-bg/20 flex items-center justify-between border-t border-ls-card-border">
           <span class="text-[10px] font-bold text-ls-text-muted uppercase">Showing 1-3 of 156 Members</span>
           <div class="flex gap-2">
              <button class="px-4 py-2 bg-white border border-ls-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Previous</button>
              <button class="px-4 py-2 bg-white border border-ls-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-ls-text">Next</button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminUsersComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly MoreIcon = MoreHorizontal;
  readonly ShieldIcon = Shield;
  readonly BanIcon = UserX;
  readonly CheckIcon = UserCheck;

  users: any[] = [];

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit() {
    this.adminService.getUsers({}).subscribe(res => this.users = res.items);
  }

  toggleStatus(userId: string, status: string) {
    this.adminService.updateUserStatus(userId, status).subscribe(() => {
      const user = this.users.find(u => u.id === userId);
      if (user) user.status = status;
    });
  }

  viewReport(userId: string) {
    this.router.navigate(['/admin/reports/users', userId]);
  }
}

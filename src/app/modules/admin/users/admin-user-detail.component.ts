import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';
import {
  LucideAngularModule,
  ChevronLeft, User, Phone, Mail, BarChart2, Flame, FileText, UserX, UserCheck,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/users"
          class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (loading()) {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        } @else if (user()) {
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center text-base font-black text-gw-primary overflow-hidden">
              @if (user()!.avatar) {
                <img [src]="user()!.avatar" class="w-full h-full object-cover" [alt]="user()!.name"
                  (error)="$any($event.target).style.display='none'">
              } @else {
                {{ initials(user()!.name) }}
              }
            </div>
            <div>
              <h2 class="text-xl font-black text-gw-text">{{ user()!.name }}</h2>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">{{ user()!.ageGroup }}</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                  [class]="user()!.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    [class]="user()!.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-400'"></span>
                  {{ user()!.status }}
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (!loading() && !user()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="UserIcon" size="28" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="font-black text-gw-text">User not found</p>
          <a routerLink="/admin/users" class="text-sm font-bold text-gw-primary hover:underline">Back to Users</a>
        </div>
      }

      @if (!loading() && user()) {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Left: Stats + Recent Sessions -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm text-center">
                <div class="w-10 h-10 rounded-xl bg-gw-accent/10 flex items-center justify-center mx-auto mb-2">
                  <i-lucide [img]="SessionsIcon" size="18" class="text-gw-accent"></i-lucide>
                </div>
                <p class="text-2xl font-black text-gw-text">{{ user()!.sessions }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Sessions</p>
              </div>
              <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm text-center">
                <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <i-lucide [img]="FlameIcon" size="18" class="text-orange-500"></i-lucide>
                </div>
                <p class="text-2xl font-black text-gw-text">{{ user()!.streak }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Streak</p>
              </div>
              <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm text-center">
                <div class="w-10 h-10 rounded-xl bg-gw-success/10 flex items-center justify-center mx-auto mb-2">
                  <i-lucide [img]="SessionsIcon" size="18" class="text-gw-success"></i-lucide>
                </div>
                <p class="text-2xl font-black text-gw-success">{{ user()!.avgFluencyScore | number:'1.0-1' }}%</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Avg Score</p>
              </div>
            </div>

            <!-- Recent Sessions -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Recent Sessions</h3>
              </div>
              @if (!user()!.recentSessions?.length) {
                <div class="flex items-center justify-center py-10 text-sm text-gw-text-muted">
                  No sessions recorded yet.
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gw-card-border bg-gw-bg/50">
                        <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Session</th>
                        <th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Date</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Duration</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Score</th>
                        <th class="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Mistakes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of user()!.recentSessions; track s.id) {
                        <tr class="border-b border-gw-card-border/50 last:border-0 hover:bg-gw-bg/40 transition-colors">
                          <td class="px-5 py-3.5 text-sm font-bold text-gw-text max-w-[180px] truncate">
                            {{ s.sessionName }}
                          </td>
                          <td class="px-4 py-3.5 text-xs text-gw-text-muted hidden sm:table-cell whitespace-nowrap">
                            {{ s.date | date:'d MMM y' }}
                          </td>
                          <td class="px-4 py-3.5 text-center text-xs text-gw-text-muted hidden md:table-cell whitespace-nowrap">
                            {{ s.duration }}m
                          </td>
                          <td class="px-4 py-3.5 text-center">
                            <span class="text-sm font-black"
                                  [class]="s.fluencyScore >= 75 ? 'text-gw-success' : s.fluencyScore >= 50 ? 'text-amber-500' : 'text-red-500'">
                              {{ s.fluencyScore | number:'1.0-0' }}%
                            </span>
                          </td>
                          <td class="px-4 py-3.5 text-center hidden sm:table-cell">
                            <span class="text-xs font-black px-2 py-0.5 rounded-lg"
                                  [class]="s.mistakeCount === 0 ? 'bg-gw-success/10 text-gw-success' : 'bg-amber-50 text-amber-600'">
                              {{ s.mistakeCount }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>

          <!-- Right: Contact + Actions -->
          <div class="space-y-4">

            <!-- Contact -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Contact</h3>
              </div>
              <div class="p-5 space-y-3">
                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="PhoneIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Mobile</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ user()!.mobileNumber }}</p>
                  </div>
                </div>
                @if (user()!.email) {
                  <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                    <i-lucide [img]="MailIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Email</p>
                      <p class="text-sm font-bold text-gw-text mt-0.5 break-all">{{ user()!.email }}</p>
                    </div>
                  </div>
                }
                @if (user()!.lastActive) {
                  <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                    <i-lucide [img]="FlameIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Last Active</p>
                      <p class="text-sm font-bold text-gw-text mt-0.5">{{ user()!.lastActive | date:'d MMM y' }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Actions</h3>
              </div>
              <div class="p-5 space-y-2.5">

                <button (click)="viewReport()"
                  [disabled]="!user()!.sessions"
                  class="w-full h-11 bg-gw-primary text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <i-lucide [img]="ReportIcon" size="15"></i-lucide>
                  View Full Report
                </button>

                <button (click)="toggleStatus()"
                  class="w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 transition-all flex items-center justify-center gap-2"
                  [class]="user()!.status === 'ACTIVE'
                    ? 'border-red-400 text-red-500 hover:bg-red-50'
                    : 'border-green-400 text-green-600 hover:bg-green-50'">
                  <i-lucide [img]="user()!.status === 'ACTIVE' ? DeactivateIcon : ActivateIcon" size="15"></i-lucide>
                  {{ user()!.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User' }}
                </button>

              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminUserDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly BackIcon      = ChevronLeft;
  readonly UserIcon      = User;
  readonly PhoneIcon     = Phone;
  readonly MailIcon      = Mail;
  readonly SessionsIcon  = BarChart2;
  readonly FlameIcon     = Flame;
  readonly ReportIcon    = FileText;
  readonly DeactivateIcon = UserX;
  readonly ActivateIcon  = UserCheck;

  user    = signal<any>(null);
  loading = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) this.load(params['id']);
    });
  }

  load(id: string) {
    this.loading.set(true);
    this.adminService.getUserDetail(id).subscribe({
      next: detail => { this.user.set(detail); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load user'); this.loading.set(false); }
    });
  }

  viewReport() {
    const u = this.user();
    if (u) this.router.navigate(['/admin/reports/user', u.id]);
  }

  toggleStatus() {
    const u = this.user();
    if (!u) return;
    const goActive = u.status !== 'ACTIVE';
    this.adminService.updateUserStatus({ userId: Number(u.id), isActive: goActive }).subscribe({
      next: () => {
        const newStatus = goActive ? 'ACTIVE' : 'INACTIVE';
        this.user.update(prev => prev ? { ...prev, status: newStatus } : prev);
        this.toast.success(`User ${goActive ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to update user status')
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}

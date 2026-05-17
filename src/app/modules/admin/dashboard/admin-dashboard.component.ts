import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Users, Play, FileText, AlertTriangle, ArrowRight, Upload, BarChart3, UserPlus } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-7">

      <!-- ─── STAT CARDS ─── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats(); track stat.label) {
          <div
            class="bg-white rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
            style="border: 1px solid var(--gw-card-border); box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
          >
            <!-- Colored top accent bar -->
            <div
              class="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              [style.background]="stat.accentColor"
            ></div>

            <div class="flex items-center justify-between mb-4">
              <!-- Icon -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                [style.background]="stat.iconBg"
              >
                <i-lucide [img]="stat.icon" size="18" [style.color]="stat.accentColor"></i-lucide>
              </div>

              <!-- Live indicator -->
              <div class="flex items-center gap-1.5">
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    [style.background]="stat.accentColor"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2 w-2"
                    [style.background]="stat.accentColor"
                  ></span>
                </span>
                <span class="text-[9px] font-bold uppercase tracking-widest" style="color: var(--gw-text-muted);">Live</span>
              </div>
            </div>

            <div class="text-[32px] font-black tabular-nums leading-none" style="color: var(--gw-text);">
              {{ stat.value ?? '—' }}
            </div>
            <div class="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style="color: var(--gw-text-muted);">
              {{ stat.label }}
            </div>
          </div>
        }
      </div>

      <!-- ─── MIDDLE ROW ─── -->
      <div class="grid lg:grid-cols-3 gap-6">

        <!-- Recent Sessions -->
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-[13px] font-bold uppercase tracking-wider" style="color: var(--gw-text);">Recent Sessions</h3>
            <a
              routerLink="/admin/reports"
              class="flex items-center gap-1 text-[12px] font-semibold"
              style="color: var(--gw-primary);"
            >
              View All <i-lucide [img]="ArrowIcon" size="13"></i-lucide>
            </a>
          </div>

          <div
            class="bg-white rounded-2xl overflow-hidden"
            style="border: 1px solid var(--gw-card-border); box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
          >
            <!-- Table head -->
            <div
              class="grid grid-cols-12 gap-2 px-5 py-3"
              style="border-bottom: 1px solid var(--gw-card-border); background: var(--gw-bg);"
            >
              <div class="col-span-4 text-[10px] font-bold uppercase tracking-widest" style="color: var(--gw-text-muted);">User</div>
              <div class="col-span-4 text-[10px] font-bold uppercase tracking-widest hidden md:block" style="color: var(--gw-text-muted);">Session</div>
              <div class="col-span-2 text-[10px] font-bold uppercase tracking-widest" style="color: var(--gw-text-muted);">Fluency</div>
              <div class="col-span-2 text-[10px] font-bold uppercase tracking-widest" style="color: var(--gw-text-muted);">Status</div>
            </div>

            @if (recentActivity().length === 0) {
              <div class="flex flex-col items-center justify-center py-14" style="color: var(--gw-text-muted);">
                <i-lucide [img]="SessionIcon" size="30" class="mb-3 opacity-20"></i-lucide>
                <p class="text-sm font-medium">No recent sessions yet</p>
              </div>
            }

            @for (row of recentActivity(); track row.sessionName) {
              <div
                class="grid grid-cols-12 gap-2 px-5 py-3.5 transition-colors"
                style="border-bottom: 1px solid var(--gw-card-border);"
              >
                <!-- User -->
                <div class="col-span-4 flex items-center gap-2.5 min-w-0">
                  <div
                    class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style="background: var(--gw-primary);"
                  >{{ initials(row.userName) }}</div>
                  <span class="text-[13px] font-semibold truncate" style="color: var(--gw-text);">{{ row.userName }}</span>
                </div>

                <!-- Session -->
                <div class="col-span-4 hidden md:flex items-center min-w-0">
                  <span class="text-[13px] truncate" style="color: var(--gw-text-muted);">{{ row.sessionName }}</span>
                </div>

                <!-- Fluency -->
                <div class="col-span-2 flex items-center">
                  <span class="text-[13px] font-bold" style="color: var(--gw-success);">{{ row.fluencyScore }}%</span>
                </div>

                <!-- Status -->
                <div class="col-span-2 flex items-center">
                  <span
                    class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                    [style]="row.status === 'COMPLETED'
                      ? 'background:rgba(46,125,50,0.1);color:var(--gw-success);'
                      : 'background:rgba(224,123,57,0.12);color:var(--gw-accent);'"
                  >{{ row.status }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Weak Areas -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-[13px] font-bold uppercase tracking-wider" style="color: var(--gw-text);">Weak Areas</h3>
            <i-lucide [img]="AlertIcon" size="16" style="color: var(--gw-warning);"></i-lucide>
          </div>

          <div
            class="bg-white rounded-2xl p-5 space-y-5"
            style="border: 1px solid var(--gw-card-border); box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
          >
            @if (weakAreas().length === 0) {
              <div class="flex flex-col items-center justify-center py-10" style="color: var(--gw-text-muted);">
                <i-lucide [img]="AlertIcon" size="28" class="mb-2 opacity-20"></i-lucide>
                <p class="text-xs font-medium text-center">No weak area data yet</p>
              </div>
            }

            @for (area of weakAreas(); track area.tag; let i = $index) {
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="text-[10px] font-black w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style="background: var(--gw-bg); color: var(--gw-text-muted);"
                    >#{{ i + 1 }}</span>
                    <span class="text-[13px] font-semibold truncate" style="color: var(--gw-text);">{{ area.tag }}</span>
                  </div>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                    style="background: rgba(245,158,11,0.1); color: var(--gw-warning);"
                  >{{ area.count }} users</span>
                </div>

                <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--gw-bg);">
                  <div
                    class="h-full rounded-full transition-all duration-1000"
                    [style]="'width:' + area.percentage + '%; background: linear-gradient(90deg, var(--gw-accent), var(--gw-warning));'"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ─── QUICK ACTIONS ─── -->
      <div>
        <h3 class="text-[13px] font-bold uppercase tracking-wider mb-4" style="color: var(--gw-text);">Quick Actions</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <!-- Primary -->
          <a
            routerLink="/admin/scripts"
            class="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group"
            style="background: var(--gw-primary); color: white; box-shadow: 0 4px 16px rgba(61,90,153,0.28);"
          >
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(255,255,255,0.15);">
              <i-lucide [img]="UploadIcon" size="19"></i-lucide>
            </div>
            <div>
              <div class="text-[13px] font-bold leading-none">Upload Script</div>
              <div class="text-[11px] mt-1 opacity-60">Add new practice material</div>
            </div>
          </a>

          <!-- Secondary -->
          <a
            routerLink="/admin/reports"
            class="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group"
            style="background: white; border: 1px solid var(--gw-card-border);"
          >
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--gw-bg);">
              <i-lucide [img]="ReportIcon" size="19" style="color: var(--gw-text-muted);"></i-lucide>
            </div>
            <div>
              <div class="text-[13px] font-bold leading-none" style="color: var(--gw-text);">View Reports</div>
              <div class="text-[11px] mt-1" style="color: var(--gw-text-muted);">Analyse user performance</div>
            </div>
          </a>

          <!-- Tertiary -->
          <button
            (click)="onAddUser()"
            class="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group text-left w-full"
            style="background: white; border: 1px solid var(--gw-card-border);"
          >
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--gw-bg);">
              <i-lucide [img]="AddUserIcon" size="19" style="color: var(--gw-text-muted);"></i-lucide>
            </div>
            <div>
              <div class="text-[13px] font-bold leading-none" style="color: var(--gw-text);">Add User</div>
              <div class="text-[11px] mt-1" style="color: var(--gw-text-muted);">Register a new account</div>
            </div>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly ArrowIcon   = ArrowRight;
  readonly AlertIcon   = AlertTriangle;
  readonly UploadIcon  = Upload;
  readonly ReportIcon  = BarChart3;
  readonly AddUserIcon = UserPlus;
  readonly SessionIcon = Play;

  stats          = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  weakAreas      = signal<any[]>([]);

  ngOnInit() {
    this.adminService.getDashboard().subscribe(data => {
      this.stats.set([
        { label: 'Total Users',        value: data.stats.totalUsers,     icon: Users,         accentColor: 'var(--gw-primary)', iconBg: 'rgba(61,90,153,0.1)'  },
        { label: 'Active Sessions',    value: data.stats.activeSessions, icon: Play,          accentColor: 'var(--gw-accent)',  iconBg: 'rgba(224,123,57,0.1)' },
        { label: 'Total Scripts',      value: data.stats.totalScripts,   icon: FileText,      accentColor: 'var(--gw-success)', iconBg: 'rgba(46,125,50,0.1)'  },
        { label: 'Mistakes Recorded',  value: data.stats.totalMistakes,  icon: AlertTriangle, accentColor: 'var(--gw-error)',   iconBg: 'rgba(211,47,47,0.1)'  },
      ]);
      this.recentActivity.set(data.recentActivity);
      this.weakAreas.set(data.weakAreas);
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  onAddUser() {
    this.toast.info('Use the standard Registration flow to add users');
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminDashboard } from '@core/services/admin.service';
import { LucideAngularModule, Users, Play, FileText, AlertTriangle, ArrowRight, Upload, BarChart3, UserPlus } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MatTableModule, MatChipsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Stats Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm group hover:border-gw-primary transition-all">
            <div class="flex items-start justify-between">
              <div class="p-3 rounded-2xl bg-gw-bg group-hover:bg-gw-primary/10 transition-colors">
                <i-lucide [img]="stat.icon" [class]="stat.color" size="24"></i-lucide>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Live</span>
            </div>
            <div class="mt-4">
              <h2 class="text-4xl font-black text-gw-text italic tabular-nums tracking-tighter">{{ stat.value }}</h2>
              <p class="text-xs font-bold text-gw-text-muted uppercase tracking-wider mt-1">{{ stat.label }}</p>
            </div>
          </div>
        }
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Recent Activity -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-lg font-black text-gw-text uppercase italic tracking-tight">Recent Sessions</h3>
            <a routerLink="/admin/reports" class="text-xs font-black text-gw-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <i-lucide [img]="ArrowIcon" size="14"></i-lucide>
            </a>
          </div>
          
          <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden">
            <table mat-table [dataSource]="recentActivity()" class="w-full">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef class="font-black uppercase text-[10px] tracking-widest py-4">User</th>
                <td mat-cell *matCellDef="let row" class="py-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-gw-text">{{ row.userName }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="session">
                <th mat-header-cell *matHeaderCellDef class="font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Session</th>
                <td mat-cell *matCellDef="let row" class="py-4 hidden md:table-cell">
                  <span class="text-sm font-medium text-gw-text-muted">{{ row.sessionName }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="fluency">
                <th mat-header-cell *matHeaderCellDef class="font-black uppercase text-[10px] tracking-widest">Fluency</th>
                <td mat-cell *matCellDef="let row" class="py-4">
                  <span class="font-black text-gw-success">{{ row.fluencyScore }}%</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-black uppercase text-[10px] tracking-widest">Status</th>
                <td mat-cell *matCellDef="let row" class="py-4">
                  <span 
                    class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                    [ngClass]="{
                      'bg-gw-success/10 text-gw-success': row.status === 'COMPLETED',
                      'bg-gw-accent/10 text-gw-accent': row.status === 'ACTIVE'
                    }"
                  >
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gw-bg/50 transition-colors cursor-pointer"></tr>
            </table>
          </div>
        </div>

        <!-- Weak Areas Panel -->
        <div class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-lg font-black text-gw-text uppercase italic tracking-tight">Weak Areas</h3>
            <i-lucide [img]="AlertIcon" size="18" class="text-gw-warning"></i-lucide>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm space-y-6">
            @for (area of weakAreas(); track area.tag) {
              <div class="space-y-2">
                <div class="flex justify-between items-end">
                  <span class="text-sm font-bold text-gw-text">{{ area.tag }}</span>
                  <span class="text-xs font-black text-gw-text-muted italic">{{ area.count }} Users</span>
                </div>
                <div class="h-2 bg-gw-bg rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gw-accent rounded-full transition-all duration-1000"
                    [style.width.%]="area.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-4">
        <h3 class="text-lg font-black text-gw-text uppercase italic tracking-tight px-2">Quick Actions</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            routerLink="/admin/scripts" 
            class="flex items-center justify-center gap-3 h-14 border-2 border-gw-primary text-gw-primary rounded-2xl font-black uppercase tracking-widest italic hover:bg-gw-primary/5 transition-all"
          >
            <i-lucide [img]="UploadIcon" size="20"></i-lucide>
            Upload Script
          </button>
          <button 
            routerLink="/admin/reports" 
            class="flex items-center justify-center gap-3 h-14 border-2 border-gw-text text-gw-text rounded-2xl font-black uppercase tracking-widest italic hover:bg-gw-text/5 transition-all"
          >
            <i-lucide [img]="ReportIcon" size="20"></i-lucide>
            View Reports
          </button>
          <button 
            (click)="onAddUser()"
            class="flex items-center justify-center gap-3 h-14 border-2 border-gw-text-muted text-gw-text-muted rounded-2xl font-black uppercase tracking-widest italic hover:bg-gw-bg transition-all"
          >
            <i-lucide [img]="AddUserIcon" size="20"></i-lucide>
            Add User
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-table { background: transparent; }
    .mat-mdc-header-cell { border-bottom: 1px solid var(--gw-card-border); color: var(--gw-text-muted); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  readonly iconMap = {
    UsersIcon: Users,
    SessionsIcon: Play,
    ScriptsIcon: FileText,
    MistakesIcon: AlertTriangle
  };

  readonly ArrowIcon = ArrowRight;
  readonly AlertIcon = AlertTriangle;
  readonly UploadIcon = Upload;
  readonly ReportIcon = BarChart3;
  readonly AddUserIcon = UserPlus;

  stats = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  weakAreas = signal<any[]>([]);

  displayedColumns: string[] = ['user', 'session', 'fluency', 'status'];

  ngOnInit() {
    this.adminService.getDashboard().subscribe(data => {
      this.stats.set([
        { label: 'Total Users', value: data.stats.totalUsers, icon: Users, color: 'text-gw-primary' },
        { label: 'Active Sessions', value: data.stats.activeSessions, icon: Play, color: 'text-gw-accent' },
        { label: 'Total Scripts', value: data.stats.totalScripts, icon: FileText, color: 'text-gw-success' },
        { label: 'Mistakes Recorded', value: data.stats.totalMistakes, icon: AlertTriangle, color: 'text-gw-error' },
      ]);
      this.recentActivity.set(data.recentActivity);
      this.weakAreas.set(data.weakAreas);
    });
  }

  onAddUser() {
    this.toast.info('Use the standard Registration flow to add users');
  }
}

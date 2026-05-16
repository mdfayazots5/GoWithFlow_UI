import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Filter, Download, User, Calendar, BarChart3, TrendingUp, TrendingDown, Eye, FileText } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatTableModule, MatPaginatorModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Filter Row -->
      <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Date From</label>
            <input type="date" [formControl]="dateFrom" class="w-full h-12 bg-gw-bg/50 border border-gw-card-border rounded-xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Date To</label>
            <input type="date" [formControl]="dateTo" class="w-full h-12 bg-gw-bg/50 border border-gw-card-border rounded-xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">User</label>
            <select class="w-full h-12 bg-gw-bg/50 border border-gw-card-border rounded-xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none appearance-none transition-all">
              <option value="">All Users</option>
              <option value="U001">Ravi Kumar</option>
              <option value="U002">Priya Kumar</option>
            </select>
          </div>
          <button (click)="exportReport()" class="h-12 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-2">
            <i-lucide [img]="DownloadIcon" size="18"></i-lucide>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Avg Fluency</p>
          <div class="flex items-end justify-between mt-2">
            <h4 class="text-3xl font-black text-gw-text italic tabular-nums">84%</h4>
            <i-lucide [img]="TrendUpIcon" size="20" class="text-gw-success mb-2"></i-lucide>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Sessions (Month)</p>
          <div class="flex items-end justify-between mt-2">
            <h4 class="text-3xl font-black text-gw-text italic tabular-nums">142</h4>
            <i-lucide [img]="TrendUpIcon" size="20" class="text-gw-success mb-2"></i-lucide>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Most Improved</p>
          <div class="flex items-center gap-2 mt-2">
             <div class="w-8 h-8 rounded-lg overflow-hidden bg-gw-bg border border-gw-card-border">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi" class="w-full h-full object-cover">
             </div>
             <span class="text-xs font-bold text-gw-text">Ravi K.</span>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Struggled Tag</p>
          <div class="flex items-center gap-2 mt-2">
             <span class="px-2 py-1 bg-gw-error/10 text-gw-error rounded-lg text-[10px] font-black uppercase tracking-widest">Have Been</span>
          </div>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden">
        <table mat-table [dataSource]="reports()" class="w-full">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef class="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">User</th>
            <td mat-cell *matCellDef="let row" class="px-6 py-4 font-bold text-gw-text">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="sessions">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Sessions</th>
            <td mat-cell *matCellDef="let row" class="py-4 text-center text-sm font-black italic">{{ row.sessions }}</td>
          </ng-container>

          <ng-container matColumnDef="avgScore">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Avg Score</th>
            <td mat-cell *matCellDef="let row" class="py-4 text-center">
              <span class="font-black text-gw-success">{{ row.avgScore }}%</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="mistakes">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Common Mistakes</th>
            <td mat-cell *matCellDef="let row" class="py-4">
              <span class="text-xs font-medium text-gw-text-muted">{{ row.commonMistakes }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="improvement">
             <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Imp. %</th>
             <td mat-cell *matCellDef="let row" class="py-4 text-center">
               <div class="flex items-center justify-center gap-1">
                 <i-lucide [img]="TrendUpIcon" size="12" class="text-gw-success"></i-lucide>
                 <span class="text-sm font-black text-gw-success tracking-tighter">{{ row.improvement }}%</span>
               </div>
             </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="py-4 pr-6"></th>
            <td mat-cell *matCellDef="let row" class="py-4 pr-6 text-right">
              <button (click)="viewFullReport(row.userId)" class="h-10 px-4 bg-gw-bg text-gw-primary font-black uppercase text-[10px] tracking-widest italic rounded-xl hover:bg-gw-primary/10 transition-all flex items-center gap-2 ml-auto">
                <i-lucide [img]="ViewIcon" size="14"></i-lucide>
                Full Report
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gw-bg/50 transition-colors"></tr>
        </table>
        <mat-paginator [pageSize]="10" class="!border-t !border-gw-card-border"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-table { background: transparent; }
    .mat-mdc-header-cell { border-bottom: 1px solid var(--gw-card-border); color: var(--gw-text-muted); }
  `]
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly DownloadIcon = Download;
  readonly TrendUpIcon = TrendingUp;
  readonly TrendDownIcon = TrendingDown;
  readonly ViewIcon = Eye;

  dateFrom = new FormControl('');
  dateTo = new FormControl('');

  reports = signal<any[]>([]);
  displayedColumns = ['user', 'sessions', 'avgScore', 'mistakes', 'improvement', 'actions'];

  ngOnInit() {
    this.adminService.getReports().subscribe(data => {
      this.reports.set(data.items);
    });
  }

  viewFullReport(userId: string) {
    this.router.navigate(['/admin/reports/user', userId]);
  }

  exportReport() {
    this.toast.info('Export available in production');
    // In real app:
    // this.adminService.exportReports().subscribe(blob => { ... download blob ... });
  }
}

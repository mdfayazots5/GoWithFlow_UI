import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, ChevronLeft, Calendar, Clock, BarChart3, AlertTriangle, TrendingUp, Save, FileText } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-user-detail-report',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, MatTableModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 pb-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <a routerLink="/admin/reports" class="p-3 bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm group">
            <i-lucide [img]="BackIcon" size="20" class="group-hover:-translate-x-1 transition-transform"></i-lucide>
          </a>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gw-bg border border-gw-card-border p-1">
              <img [src]="report()?.user?.avatar" class="w-full h-full object-cover rounded-xl">
            </div>
            <div>
              <h2 class="text-2xl font-black text-gw-text italic tracking-tight">{{ report()?.user?.name }}</h2>
              <div class="flex items-center gap-4 mt-1">
                <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">
                   <i-lucide [img]="FlameIcon" size="14" class="text-gw-primary"></i-lucide>
                   {{ report()?.user?.streak }} Day Streak
                </span>
                <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">
                   <i-lucide [img]="SessionIcon" size="14" class="text-gw-accent"></i-lucide>
                   {{ report()?.user?.sessions }} Sessions
                </span>
                <span class="text-[10px] font-black uppercase tracking-widest text-gw-success">
                   {{ report()?.user?.avgScore }}% Avg Score
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main Stats & History -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Session History -->
          <div class="space-y-4">
            <h3 class="text-lg font-black text-gw-text italic uppercase tracking-tight px-2">Session History</h3>
            <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden">
              <table mat-table [dataSource]="report()?.sessionHistory || []" class="w-full">
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef class="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Date</th>
                  <td mat-cell *matCellDef="let row" class="px-6 py-4 text-xs font-bold text-gw-text-muted">{{ row.date | date:'mediumDate' }}</td>
                </ng-container>

                <ng-container matColumnDef="script">
                  <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Script</th>
                  <td mat-cell *matCellDef="let row" class="py-4">
                    <span class="font-bold text-gw-text">{{ row.script }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="duration">
                  <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Duration</th>
                  <td mat-cell *matCellDef="let row" class="py-4 text-xs font-medium text-gw-text-muted">{{ row.duration }}</td>
                </ng-container>

                <ng-container matColumnDef="fluency">
                  <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Fluency</th>
                  <td mat-cell *matCellDef="let row" class="py-4 font-black text-gw-success">{{ row.fluency }}%</td>
                </ng-container>

                <ng-container matColumnDef="mistakes">
                  <th mat-header-cell *matHeaderCellDef class="py-4 pr-6 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Mistakes</th>
                  <td mat-cell *matCellDef="let row" class="py-4 pr-6 text-center">
                    <span class="text-xs font-black text-gw-error tabular-nums">{{ row.mistakes }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="historyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: historyColumns;" class="hover:bg-gw-bg/50 transition-colors"></tr>
              </table>
            </div>
          </div>

          <!-- Improvement Trend -->
          <div class="space-y-4">
            <h3 class="text-lg font-black text-gw-text italic uppercase tracking-tight px-2">Improvement Trend</h3>
            <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm p-6 overflow-hidden">
               <table class="w-full">
                  <thead>
                    <tr class="border-b border-gw-card-border">
                        <th class="py-4 text-left font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Period</th>
                        <th class="py-4 text-right font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Avg Fluency</th>
                        <th class="py-4 text-right font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (trend of report()?.improvementTrend; track trend.week; let i = index) {
                      <tr class="border-b border-gw-bg last:border-0 hover:bg-gw-bg/30 transition-colors">
                        <td class="py-4 text-sm font-bold text-gw-text">{{ trend.week }}</td>
                        <td class="py-4 text-right">
                           <span class="text-sm font-black text-gw-primary">{{ trend.fluency }}%</span>
                        </td>
                        <td class="py-4 text-right">
                           @if (i > 0) {
                             <div class="flex items-center justify-end gap-1 text-gw-success">
                                <i-lucide [img]="TrendIcon" size="12"></i-lucide>
                                <span class="text-xs font-black">+{{ trend.fluency - report()!.improvementTrend[i-1].fluency }}%</span>
                             </div>
                           } @else {
                             <span class="text-xs font-bold text-gw-text-muted italic">Baseline</span>
                           }
                        </td>
                      </tr>
                    }
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <!-- Sidebar Section -->
        <div class="space-y-8">
           <!-- Mistake Breakdown -->
           <div class="space-y-4">
              <h3 class="text-lg font-black text-gw-text italic uppercase tracking-tight px-2">Mistake Breakdown</h3>
              <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm space-y-6">
                @for (item of report()?.mistakeBreakdown; track item.label) {
                  <div class="space-y-2">
                    <div class="flex justify-between items-end">
                      <span class="text-sm font-bold text-gw-text">{{ item.label }}</span>
                      <span class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest italic">{{ item.count }} Errors</span>
                    </div>
                    <div class="h-2 bg-gw-bg rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-gw-error rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(211,47,47,0.3)]"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                  </div>
                }
              </div>
           </div>

           <!-- Admin Notes -->
           <div class="space-y-4">
              <h3 class="text-lg font-black text-gw-text italic uppercase tracking-tight px-2">Admin Notes</h3>
              <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm space-y-4">
                 <textarea 
                   [formControl]="notesControl"
                   class="w-full min-h-[160px] bg-gw-bg/50 border border-gw-card-border rounded-2xl p-4 text-sm font-medium text-gw-text focus:border-gw-primary outline-none transition-all resize-none placeholder:italic"
                   placeholder="Observation details, suggestions for user..."
                 ></textarea>
                 <button 
                   (click)="saveNotes()"
                   class="w-full h-12 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                   [disabled]="isSaving()"
                 >
                   <i-lucide [img]="SaveIcon" size="18"></i-lucide>
                   {{ isSaving() ? 'Saving...' : 'Save Notes' }}
                 </button>
              </div>
           </div>
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
export class UserDetailReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  readonly BackIcon = ChevronLeft;
  readonly FlameIcon = BarChart3; // Placeholder
  readonly SessionIcon = FileText;
  readonly TrendIcon = TrendingUp;
  readonly SaveIcon = Save;

  report = signal<any>(null);
  notesControl = new FormControl('');
  isSaving = signal(false);

  historyColumns = ['date', 'script', 'duration', 'fluency', 'mistakes'];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) {
        this.loadReport(userId);
      }
    });
  }

  loadReport(userId: string) {
    this.adminService.getUserFullReport(userId).subscribe(data => {
      this.report.set(data);
      this.notesControl.setValue(data.notes || '');
    });
  }

  saveNotes() {
    if (!this.report()) return;
    
    this.isSaving.set(true);
    this.adminService.addAdminNote({ 
      userId: this.report().user.id, 
      note: this.notesControl.value || '' 
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Admin notes updated');
      },
      error: () => this.isSaving.set(false)
    });
  }
}

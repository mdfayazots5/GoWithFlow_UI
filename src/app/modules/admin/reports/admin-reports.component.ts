import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Download, FileText, ChevronRight, User } from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
    <div class="p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Assessment Engine</h1>
          <p class="text-ls-text-muted font-medium">Aggregate performance analytics and user progress tracking</p>
        </div>
        <button (click)="exportAll()" class="btn-primary px-8 gap-2">
          <i-lucide [img]="DownloadIcon" size="18"></i-lucide>
          Export Analytics
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Overview Stats -->
        <div class="card space-y-6">
           <div class="space-y-2">
             <h3 class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Total Mistake Correction Rate</h3>
             <div class="flex items-end gap-2">
                <span class="text-4xl font-black italic text-ls-primary">78.4%</span>
                <span class="text-ls-success font-black text-xs mb-1">+5.2%</span>
             </div>
           </div>
           
           <div class="h-[200px] w-full flex items-end justify-between px-2">
              <div *ngFor="let h of [40, 60, 45, 80, 55, 90, 75]" class="w-4 bg-ls-primary/10 rounded-t-full hover:bg-ls-primary transition-all cursor-crosshair group relative" [style.height.%]="h">
                 <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-ls-text text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{{ h }}%</div>
              </div>
           </div>
        </div>

        <!-- User Progress List -->
        <div class="md:col-span-2 space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Detailed Member Performance</h3>
           <div class="card p-0 overflow-hidden">
              <div class="divide-y divide-ls-card-border" *ngIf="reports">
                 <div *ngFor="let r of reports" [routerLink]="['users', r.userId]" class="p-5 flex items-center justify-between hover:bg-ls-bg transition-colors group cursor-pointer">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 bg-ls-bg rounded-xl flex items-center justify-center text-ls-text-muted">
                          <i-lucide [img]="UserIcon" size="20"></i-lucide>
                       </div>
                       <div>
                          <p class="font-bold text-ls-text">{{ r.name }}</p>
                          <p class="text-[10px] text-ls-text-muted font-medium italic">{{ r.sessions }} Sessions Tracked</p>
                       </div>
                    </div>
                    
                    <div class="flex items-center gap-8">
                       <div class="text-center">
                          <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Avg. Score</p>
                          <p class="text-lg font-black italic text-ls-primary">{{ r.avgScore }}%</p>
                       </div>
                       <div class="text-center">
                          <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Mistakes</p>
                          <p class="text-lg font-black italic text-ls-accent">{{ r.mistakes }}</p>
                       </div>
                       <i-lucide [img]="ChevronIcon" size="18" class="text-ls-card-border group-hover:text-ls-primary transition-all"></i-lucide>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminReportsComponent implements OnInit {
  readonly DownloadIcon = Download;
  readonly FileTextIcon = FileText;
  readonly ChevronIcon = ChevronRight;
  readonly UserIcon = User;

  reports: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getReportSummary({}).subscribe(res => this.reports = res);
  }

  exportAll() {
    this.adminService.exportReports().subscribe(res => {
      alert('Report export started! Download URL: ' + res.url);
    });
  }
}

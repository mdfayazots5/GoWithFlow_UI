import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, MessageSquare, History, TrendingUp, Save } from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-user-detail-report',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="p-8 space-y-8 animate-in slide-in-from-right-5 duration-500" *ngIf="report">
      <div class="flex items-center justify-between">
        <a routerLink="/admin/reports" class="flex items-center gap-2 text-ls-text-muted hover:text-ls-primary font-black text-xs uppercase tracking-widest transition-all">
          <i-lucide [img]="BackIcon" size="14"></i-lucide>
          Back to Registry
        </a>
        <div class="flex items-center gap-2">
           <span class="text-[10px] font-black uppercase tracking-[0.2em] text-ls-text-muted">Last Updated: Just Now</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar Info -->
        <div class="space-y-6">
           <div class="card flex flex-col items-center text-center gap-4">
              <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userDetail?.name" class="w-24 h-24 rounded-[32px] border-2 border-ls-primary p-1 shadow-lg shadow-ls-primary/10">
              <div>
                 <h2 class="text-2xl font-black italic uppercase tracking-tighter text-ls-text">{{ userDetail?.name }}</h2>
                 <p class="text-xs font-bold text-ls-text-muted uppercase tracking-widest">{{ userDetail?.mobileNumber }}</p>
              </div>
              <div class="flex gap-4 w-full">
                 <div class="flex-1 bg-ls-bg p-3 rounded-2xl">
                    <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Streak</p>
                    <p class="text-xl font-black italic">{{ userDetail?.streak }}</p>
                 </div>
                 <div class="flex-1 bg-ls-bg p-3 rounded-2xl">
                    <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Score</p>
                    <p class="text-xl font-black italic text-ls-success">88%</p>
                 </div>
              </div>
           </div>

           <div class="card space-y-4">
              <div class="flex items-center gap-2 text-ls-primary font-black text-xs uppercase tracking-widest">
                 <i-lucide [img]="NoteIcon" size="14"></i-lucide>
                 Assessment Notes
              </div>
              <textarea 
                [(ngModel)]="adminNote"
                class="w-full h-40 bg-ls-bg border-none rounded-2xl p-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-ls-primary/20 transition-all resize-none"
                placeholder="Add private observations about fluency patterns..."
              ></textarea>
              <button (click)="saveNote()" class="btn-primary w-full h-12 text-xs gap-2">
                <i-lucide [img]="SaveIcon" size="14"></i-lucide>
                Update Database
              </button>
           </div>
        </div>

        <!-- Main Analytics -->
        <div class="lg:col-span-2 space-y-8">
           <!-- Trend Component (Visual Only) -->
           <div class="card space-y-6">
              <div class="flex items-center justify-between">
                 <h3 class="text-xs font-black uppercase tracking-widest text-ls-text">Mistake frequency over sessions</h3>
                 <i-lucide [img]="TrendIcon" size="16" class="text-ls-primary"></i-lucide>
              </div>
              <div class="flex items-end justify-between h-40 gap-4">
                 <div *ngFor="let m of report.mistakeTrends" class="flex-1 bg-ls-accent/20 rounded-t-xl group relative hover:bg-ls-accent transition-all cursor-pointer" [style.height.%]="m * 5">
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-ls-text text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {{ m }} mistakes
                    </div>
                 </div>
              </div>
           </div>

           <!-- Session History -->
           <div class="space-y-4">
              <div class="flex items-center gap-2 text-ls-text font-black text-xs uppercase tracking-widest px-1">
                 <i-lucide [img]="HistoryIcon" size="14"></i-lucide>
                 Utterance Performance Log
              </div>
              <div class="card p-0 overflow-hidden">
                 <div class="divide-y divide-ls-card-border">
                    <div *ngFor="let s of report.sessions" class="p-5 flex items-center justify-between hover:bg-ls-bg transition-colors">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 bg-blue-50 text-ls-primary flex items-center justify-center rounded-xl">
                             <span class="text-[10px] font-black">S{{ s.id }}</span>
                          </div>
                          <div>
                            <p class="text-sm font-bold text-ls-text">{{ s.title }}</p>
                            <p class="text-[10px] font-medium text-ls-text-muted italic">{{ s.date }}</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-4">
                          <div class="h-1 w-24 bg-ls-bg rounded-full overflow-hidden">
                             <div class="h-full bg-ls-success" [style.width.%]="s.score"></div>
                          </div>
                          <span class="text-sm font-black italic text-ls-text">{{ s.score }}%</span>
                       </div>
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
export class UserDetailReportComponent implements OnInit {
  readonly BackIcon = ArrowLeft;
  readonly NoteIcon = MessageSquare;
  readonly HistoryIcon = History;
  readonly TrendIcon = TrendingUp;
  readonly SaveIcon = Save;

  report: any;
  userDetail: any;
  adminNote = '';
  userId = '';

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.adminService.getUserDetail(this.userId).subscribe(res => this.userDetail = res);
      this.adminService.getUserFullReport(this.userId).subscribe(res => {
        this.report = res;
        this.adminNote = res.notes;
      });
    }
  }

  saveNote() {
    this.adminService.saveUserNote(this.userId, this.adminNote).subscribe(() => {
      alert('Assessment data synchronized successfully.');
    });
  }
}

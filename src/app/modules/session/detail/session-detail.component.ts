import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Calendar, Clock, Trophy, Users, AlertCircle, ChevronRight } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Session Detail" [showBack]="true"></app-header>

      <main *ngIf="detail" class="p-6 space-y-8 animate-in slide-in-from-right-4">
        <!-- Session Summary Card -->
        <div class="card bg-ls-primary border-none text-white p-8 relative overflow-hidden">
           <div class="relative z-10 space-y-4">
              <h2 class="text-4xl font-black italic uppercase tracking-tighter">{{ detail.title }}</h2>
              <div class="flex flex-wrap gap-4">
                 <div class="flex items-center gap-2">
                    <i-lucide [img]="CalendarIcon" size="14" class="opacity-50"></i-lucide>
                    <span class="text-[10px] font-black uppercase tracking-widest">{{ detail.date | date:'longDate' }}</span>
                 </div>
                 <div class="flex items-center gap-2">
                    <i-lucide [img]="ClockIcon" size="14" class="opacity-50"></i-lucide>
                    <span class="text-[10px] font-black uppercase tracking-widest">{{ detail.duration }}</span>
                 </div>
              </div>
           </div>
           <i-lucide [img]="TrophyIcon" size="120" class="absolute -right-8 -bottom-8 opacity-10"></i-lucide>
        </div>

        <!-- Major Stats -->
        <div class="grid grid-cols-3 gap-4">
           <div class="card p-4 text-center">
              <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Mastery</p>
              <p class="text-xl font-black italic text-ls-primary">{{ detail.score }}%</p>
           </div>
           <div class="card p-4 text-center">
              <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Mistakes</p>
              <p class="text-xl font-black italic text-ls-error">{{ detail.mistakesCount }}</p>
           </div>
           <div class="card p-4 text-center">
              <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Members</p>
              <p class="text-xl font-black italic text-ls-accent">{{ detail.members?.length }}</p>
           </div>
        </div>

        <!-- Members -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1 inline-flex items-center gap-2">
              <i-lucide [img]="UsersIcon" size="14"></i-lucide>
              Session Participants
           </h3>
           <div class="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              <div *ngFor="let m of detail.members" class="flex flex-col items-center gap-2 shrink-0">
                 <div class="w-16 h-16 rounded-2xl bg-white border border-ls-card-border overflow-hidden p-1">
                    <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m" class="w-full h-full object-cover rounded-xl">
                 </div>
                 <span class="text-[10px] font-black italic uppercase text-ls-text-muted">{{ m }}</span>
              </div>
           </div>
        </div>

        <!-- Actions -->
        <div class="space-y-4">
           <button class="w-full h-16 bg-white border border-ls-card-border rounded-2xl flex items-center justify-between px-6 group transition-all active:scale-[0.98]">
              <div class="flex items-center gap-4">
                 <div class="w-10 h-10 bg-ls-error/10 text-ls-error rounded-xl flex items-center justify-center">
                    <i-lucide [img]="MistakeIcon" size="20"></i-lucide>
                 </div>
                 <span class="text-xs font-bold uppercase italic text-ls-text">View Session Mistakes</span>
              </div>
              <i-lucide [img]="NextIcon" size="18" class="text-ls-card-border group-hover:text-ls-error transition-all"></i-lucide>
           </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SessionDetailComponent implements OnInit {
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly TrophyIcon = Trophy;
  readonly UsersIcon = Users;
  readonly MistakeIcon = AlertCircle;
  readonly NextIcon = ChevronRight;

  detail: any;

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userService.getSessionDetail(id).subscribe(res => this.detail = res);
    }
  }
}

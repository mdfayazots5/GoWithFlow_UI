import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Calendar, ChevronRight, Activity } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { SessionService } from '@core/services/session.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Session History" subtitle="Your past practice records"></app-header>

      <main class="p-6 space-y-6">
        <!-- History List -->
        <div class="space-y-4" *ngIf="history">
           <div *ngFor="let s of history.items" 
              class="card bg-white border border-ls-card-border p-5 flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.99]"
           >
              <div class="flex items-center gap-4">
                 <div class="w-12 h-12 bg-ls-bg rounded-xl flex items-center justify-center text-ls-text-muted border border-ls-card-border">
                    <i-lucide [img]="ActivityIcon" size="24"></i-lucide>
                 </div>
                 <div>
                    <h4 class="font-black italic text-ls-text uppercase tracking-tight">{{ s.title }}</h4>
                    <div class="flex items-center gap-3 mt-1">
                       <span class="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-ls-text-muted">
                          <i-lucide [img]="CalendarIcon" size="10"></i-lucide>
                          {{ s.date | date:'MMM d, y' }}
                       </span>
                       <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          [class]="s.fluencyScore !== null && s.fluencyScore !== undefined ? 'bg-ls-primary/10 text-ls-primary' : 'bg-ls-bg text-ls-text-muted'"
                       >
                          Score: {{ s.fluencyScore !== null && s.fluencyScore !== undefined ? s.fluencyScore + '%' : '—' }}
                       </span>
                       <span *ngIf="s.mistakesCount === 0 && (s.fluencyScore === null || s.fluencyScore === undefined)" class="text-[8px] font-bold text-ls-text-muted italic opacity-60 ml-2">
                          Not analyzed yet
                       </span>
                    </div>
                 </div>
              </div>
              
              <a [routerLink]="['/session/detail', s.id]" class="p-2 text-ls-card-border group-hover:text-ls-primary transition-all">
                 <i-lucide [img]="ChevronIcon" size="20"></i-lucide>
              </a>
           </div>
        </div>

        <div *ngIf="!history" class="flex flex-col items-center justify-center py-20 grayscale opacity-20">
           <i-lucide [img]="ActivityIcon" size="64"></i-lucide>
           <p class="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Scanning History...</p>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: []
})
export class SessionHistoryComponent implements OnInit {
  readonly ActivityIcon = Activity;
  readonly CalendarIcon = Calendar;
  readonly ChevronIcon = ChevronRight;

  history: any;

  constructor(private sessionService: SessionService) {}

  ngOnInit() {
    this.sessionService.getSessionHistory({}).subscribe(res => {
      this.history = res;
    });
  }
}

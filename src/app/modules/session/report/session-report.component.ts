import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule, Trophy, Star, Clock, AlertCircle, ChevronRight, Share2, ClipboardList } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { LiveSessionService } from '@core/services/live-session.service';

@Component({
  selector: 'app-session-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Session Report" [showBack]="true"></app-header>

      <main *ngIf="summary" class="p-6 space-y-8 animate-in fade-in duration-500">
        <!-- Hero Score Area -->
        <div class="card bg-ls-focus-bg text-ls-focus-text p-10 text-center relative overflow-hidden border-none rounded-3xl shadow-2xl">
          <div class="relative z-10 space-y-2">
            <p class="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Combined Mastery</p>
            <div class="flex items-center justify-center gap-4">
              <span class="text-7xl font-black italic tracking-tighter text-white">{{ summary.score }}%</span>
              <div class="flex items-center gap-1 text-ls-accent">
                <i-lucide [img]="StarIcon" size="24" fill="currentColor"></i-lucide>
              </div>
            </div>
            <p class="text-xs font-medium opacity-70 mt-4">{{ summary.overallFeedback }}</p>
          </div>
          <i-lucide [img]="TrophyIcon" size="180" class="absolute -right-12 -bottom-12 opacity-5"></i-lucide>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-6 border-ls-card-border flex flex-col items-center gap-2 bg-white shadow-sm">
            <i-lucide [img]="ClockIcon" size="20" class="text-ls-primary"></i-lucide>
            <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Total Time</p>
            <p class="text-xl font-black italic text-ls-text">{{ summary.duration }}</p>
          </div>
          <div class="card p-6 border-ls-card-border flex flex-col items-center gap-2 bg-white shadow-sm">
            <i-lucide [img]="AlertIcon" size="20" class="text-ls-error"></i-lucide>
            <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Mistakes</p>
            <p class="text-xl font-black italic text-ls-text">{{ summary.mistakesCount }}</p>
          </div>
        </div>

        <!-- Individual Performance -->
        <section class="space-y-4">
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1 flex items-center gap-2">
            <i-lucide [img]="ClipboardIcon" size="14"></i-lucide>
            Member Breakdown
          </h3>
          <div class="space-y-3">
            <div *ngFor="let m of summary.members" class="card p-5 bg-white border border-ls-card-border flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-ls-bg flex items-center justify-center overflow-hidden border border-ls-card-border">
                   <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.name" class="w-full h-full object-cover">
                </div>
                <div>
                  <h4 class="text-xs font-bold uppercase italic text-ls-text">{{ m.name }}</h4>
                  <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">{{ m.mistakes }} Mistakes detected</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-black italic text-ls-primary">{{ m.score }}%</p>
                <div class="w-16 h-1 bg-ls-bg rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-ls-primary" [style.width.%]="m.score"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Focus Area -->
        <div class="card p-6 bg-ls-accent/5 border border-ls-accent/20 flex items-center gap-6 rounded-2xl">
           <div class="w-12 h-12 bg-ls-accent/10 text-ls-accent rounded-2xl flex items-center justify-center shrink-0">
              <i-lucide [img]="AlertIcon" size="24"></i-lucide>
           </div>
           <div>
              <p class="text-[8px] font-black uppercase tracking-widest text-ls-accent">Focus for next round</p>
              <h4 class="text-sm font-bold uppercase italic text-ls-text">Master "{{ summary.topGrammarFocus }}"</h4>
           </div>
        </div>

        <!-- Main Actions -->
        <div class="grid grid-cols-2 gap-4 pt-4">
          <button class="h-16 bg-ls-primary text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-wider shadow-lg active:scale-95 transition-all">
            <i-lucide [img]="ShareIcon" size="18"></i-lucide>
            Share
          </button>
          <a routerLink="/session/join" class="h-16 bg-white border border-ls-card-border text-ls-text rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-wider active:scale-95 transition-all shadow-sm">
            Home
          </a>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    .card { border-radius: 1.5rem; }
  `]
})
export class SessionReportComponent implements OnInit {
  readonly TrophyIcon = Trophy;
  readonly StarIcon = Star;
  readonly ClockIcon = Clock;
  readonly AlertIcon = AlertCircle;
  readonly NextIcon = ChevronRight;
  readonly ShareIcon = Share2;
  readonly ClipboardIcon = ClipboardList;

  summary: any;

  constructor(
    private route: ActivatedRoute,
    private liveSessionService: LiveSessionService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.liveSessionService.getSessionSummary(id).subscribe(res => {
          this.summary = res;
        });
      }
    });
  }
}

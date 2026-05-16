// File: src/app/modules/session/session-list/session-list.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '@core/services/session.service';
import { Session } from '@core/models/session.model';
import { LucideAngularModule, Search, Clock, Calendar, ChevronRight, Activity, CheckCircle, XCircle, AlertCircle, TrendingUp, Mic2 } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-1">
          <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tighter">SESSION HISTORY</h2>
          <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Track your practice progress over time</p>
        </div>
        
        <div class="flex bg-white p-1.5 rounded-2xl border border-gw-card-border shadow-sm">
          @for (tab of tabs; track tab) {
            <button 
              (click)="activeTab.set(tab); loadSessions()"
              class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              [class.bg-gw-text]="activeTab() === tab"
              [class.text-white]="activeTab() === tab"
              [class.text-gw-text-muted]="activeTab() !== tab"
              [class.hover:bg-gw-bg]="activeTab() !== tab"
            >
              {{ tab }}
            </button>
          }
        </div>
      </div>

      <!-- Session Cards Row -->
      @if (isLoading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="h-32 bg-white rounded-[32px] border border-gw-card-border animate-pulse"></div>
          }
        </div>
      } @else {
        <div class="space-y-4">
          @for (session of sessions(); track session.id) {
            <a 
              [routerLink]="['/session/detail', session.id]"
              class="group bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm hover:border-gw-primary hover:shadow-xl hover:-translate-x-1 transition-all flex flex-col md:flex-row md:items-center gap-6"
            >
              <!-- Status Icon -->
              <div 
                class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                [class.bg-gw-primary/10]="session.status === 'ACTIVE'"
                [class.text-gw-primary]="session.status === 'ACTIVE'"
                [class.bg-gw-success/10]="session.status === 'COMPLETED'"
                [class.text-gw-success]="session.status === 'COMPLETED'"
                [class.bg-gw-bg]="session.status === 'LOBBY' || session.status === 'PAUSED'"
                [class.text-gw-text-muted]="session.status === 'LOBBY' || session.status === 'PAUSED'"
                [class.bg-gw-error/10]="session.status === 'ABANDONED'"
                [class.text-gw-error]="session.status === 'ABANDONED'"
              >
                <i-lucide [img]="getStatusIcon(session.status)" size="32"></i-lucide>
              </div>

              <!-- Content -->
              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="px-2 py-0.5 bg-gw-bg text-gw-text-muted rounded text-[8px] font-black uppercase tracking-widest italic">{{ session.sessionMode }}</span>
                  <span 
                    class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest italic"
                    [class.bg-gw-primary/10]="session.status === 'ACTIVE'"
                    [class.text-gw-primary]="session.status === 'ACTIVE'"
                    [class.bg-gw-success/10]="session.status === 'COMPLETED'"
                    [class.text-gw-success]="session.status === 'COMPLETED'"
                  >
                    {{ session.status }}
                  </span>
                </div>
                <h3 class="text-xl font-black text-gw-text italic uppercase tracking-tight">{{ session.sessionName }}</h3>
                <div class="flex items-center gap-4 text-xs font-bold text-gw-text-muted italic">
                   <span class="flex items-center gap-1">
                      <i-lucide [img]="CalendarIcon" size="12"></i-lucide>
                      {{ session.createdDate | date:'mediumDate' }}
                   </span>
                   <span class="flex items-center gap-1">
                      <i-lucide [img]="ClockIcon" size="12"></i-lucide>
                      {{ session.sessionDuration }} Min
                   </span>
                   <span class="flex items-center gap-1">
                      <i-lucide [img]="UserIcon" size="12"></i-lucide>
                      {{ session.currentMembers }} Members
                   </span>
                </div>
              </div>

              <!-- Stats / Score -->
              @if (session.status === 'COMPLETED') {
                <div class="flex items-center gap-8 bg-gw-bg/30 p-4 rounded-2xl border border-gw-bg group-hover:border-gw-primary/10 transition-all">
                   <div class="text-center">
                      <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic mb-1">Fluency</p>
                      <div class="flex items-center gap-1 text-gw-success">
                         <i-lucide [img]="TrendIcon" size="14"></i-lucide>
                         <span class="text-lg font-black italic tabular-nums">{{ session.fluencyScore }}%</span>
                      </div>
                   </div>
                   <div class="w-px h-8 bg-gw-card-border/50"></div>
                   <div class="text-center pr-4">
                      <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic mb-1">Mistakes</p>
                      <div class="flex items-center gap-1 text-gw-error">
                         <i-lucide [img]="ErrorIcon" size="14"></i-lucide>
                         <span class="text-lg font-black italic tabular-nums">{{ session.mistakesCount }}</span>
                      </div>
                   </div>
                </div>
              }

              <div class="text-gw-card-border transition-all group-hover:text-gw-primary group-hover:translate-x-2">
                 <i-lucide [img]="NextIcon" size="24"></i-lucide>
              </div>
            </a>
          }

          @if (sessions().length === 0) {
            <div class="py-20 text-center space-y-6 animate-in zoom-in duration-500">
               <div class="w-20 h-20 bg-gw-bg rounded-3xl flex items-center justify-center text-gw-card-border mx-auto shadow-inner">
                  <i-lucide [img]="EmptyIcon" size="40"></i-lucide>
               </div>
               <div class="space-y-2">
                  <h4 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">NO SESSIONS FOUND</h4>
                  <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">Try changing your filters or start a new one</p>
               </div>
               <a routerLink="/session/create" class="inline-flex h-14 px-8 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl items-center gap-2 hover:scale-[1.05] transition-all">
                  <i-lucide [img]="MicIcon" size="18"></i-lucide>
                  Start New Session
               </a>
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      @if (sessions().length > 0) {
        <div class="flex justify-center pt-8">
           <div class="flex gap-2">
              <button class="w-10 h-10 rounded-xl bg-white border border-gw-card-border flex items-center justify-center text-gw-text font-black italic hover:bg-gw-bg transition-all">1</button>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SessionListComponent implements OnInit {
  private sessionService = inject(SessionService);

  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly UserIcon = Activity;
  readonly TrendIcon = TrendingUp;
  readonly ErrorIcon = AlertCircle;
  readonly NextIcon = ChevronRight;
  readonly EmptyIcon = AlertCircle;
  readonly MicIcon = Mic2;

  tabs = ['All', 'Active', 'Completed', 'Abandoned'];
  activeTab = signal('All');
  sessions = signal<Session[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    this.isLoading.set(true);
    this.sessionService.getSessionHistory(this.activeTab()).subscribe({
      next: (res: any) => {
        this.sessions.set(res.items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'ACTIVE': return Activity;
      case 'COMPLETED': return CheckCircle;
      case 'ABANDONED': return XCircle;
      default: return Clock;
    }
  }
}

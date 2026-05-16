import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Trophy, Star, Clock, AlertCircle, ChevronRight, Share2, ClipboardList, Target, Zap, RotateCcw } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { LiveSessionService } from '@core/services/live-session.service';
import { RepracticeService } from '@core/services/repractice.service';
import { LoaderService } from '@core/services/loader.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-session-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Session Summary" [showBack]="true"></app-header>

      <!-- Loader Overlay -->
      <div *ngIf="loader.isLoading()" class="fixed inset-0 bg-ls-bg/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
         <div class="w-12 h-12 border-4 border-ls-primary border-t-transparent rounded-full animate-spin"></div>
         <p class="text-[10px] font-black uppercase tracking-[0.3em] text-ls-primary">Processing...</p>
      </div>

      <main *ngIf="summary()" class="p-6 space-y-8 animate-in fade-in duration-500">
        <!-- Hero Score Area -->
        <div class="card bg-ls-focus-bg text-ls-focus-text p-10 text-center relative overflow-hidden border-none rounded-3xl shadow-2xl">
          <div class="relative z-10 space-y-2">
            <p class="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Mastery</p>
            <div class="flex items-center justify-center gap-4">
              <span class="text-7xl font-black italic tracking-tighter text-white">{{ summary().fluencyScore ?? summary().score ?? 0 }}%</span>
              <div class="flex items-center gap-1 text-ls-accent">
                <i-lucide [img]="StarIcon" size="24" fill="currentColor"></i-lucide>
              </div>
            </div>
            <p class="text-xs font-bold uppercase tracking-widest opacity-70 mt-4">{{ summary().scriptTitle || 'English Fluency Session' }}</p>
          </div>
          <i-lucide [img]="TrophyIcon" size="180" class="absolute -right-12 -bottom-12 opacity-5"></i-lucide>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="card p-6 border-ls-card-border flex flex-col items-center gap-2 bg-white shadow-sm">
            <i-lucide [img]="TargetIcon" size="20" class="text-ls-primary"></i-lucide>
            <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Total Turns</p>
            <p class="text-xl font-black italic text-ls-text">{{ summary().totalTurns || 0 }}</p>
          </div>
          <div class="card p-6 border-ls-card-border flex flex-col items-center gap-2 bg-white shadow-sm">
            <i-lucide [img]="AlertIcon" size="20" class="text-ls-error"></i-lucide>
            <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">Team Mistakes</p>
            <p class="text-xl font-black italic text-ls-text">{{ summary().totalMistakesAllMembers ?? summary().mistakesCount ?? 0 }}</p>
          </div>
        </div>

        <!-- Individual Performance -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted flex items-center gap-2">
              <i-lucide [img]="ClipboardIcon" size="14"></i-lucide>
              Performance Breakdown
            </h3>
          </div>
          <div class="space-y-3">
            <div *ngFor="let m of summary().memberScores || summary().members" 
                 class="card p-5 border flex items-center justify-between shadow-sm transition-all"
                 [ngClass]="{
                   'bg-ls-primary/5 border-ls-primary/20': m.userId === bestPerformerId(),
                   'bg-white border-ls-card-border': m.userId !== bestPerformerId()
                 }">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-ls-bg flex items-center justify-center overflow-hidden border border-ls-card-border relative">
                   <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (m.fullName || m.name)" class="w-full h-full object-cover">
                   <div *ngIf="m.userId === bestPerformerId()" class="absolute -top-1 -right-1 bg-ls-accent text-white rounded-full p-0.5">
                      <i-lucide [img]="StarIcon" size="8" fill="currentColor"></i-lucide>
                   </div>
                </div>
                <div>
                  <h4 class="text-xs font-bold uppercase italic text-ls-text flex items-center gap-2">
                    {{ m.fullName || m.name }}
                    <span *ngIf="m.userId === bestPerformerId()" class="text-[8px] font-black uppercase tracking-widest text-ls-primary">(MVP)</span>
                  </h4>
                  <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted">
                    {{ m.mistakeCount ?? m.mistakes ?? 0 }} Mistakes • {{ m.confidenceScore || 0 }}% Confidence
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-black italic text-ls-primary">{{ m.fluencyScore ?? m.score }}%</p>
                <div class="w-16 h-1 bg-ls-bg rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-ls-primary" [style.width.%]="m.fluencyScore ?? m.score"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Focus Area -->
        <div class="card p-6 bg-ls-accent/5 border border-ls-accent/20 flex items-center gap-6 rounded-2xl" *ngIf="summary().grammarFocusTag || summary().topGrammarFocus">
           <div class="w-12 h-12 bg-ls-accent/10 text-ls-accent rounded-2xl flex items-center justify-center shrink-0">
              <i-lucide [img]="ZapIcon" size="24"></i-lucide>
           </div>
           <div>
              <p class="text-[8px] font-black uppercase tracking-widest text-ls-accent">Group Focus</p>
              <h4 class="text-sm font-bold uppercase italic text-ls-text">Improve "{{ summary().grammarFocusTag || summary().topGrammarFocus }}"</h4>
           </div>
        </div>

        <!-- Main Actions -->
        <div class="flex flex-col gap-4">
          <button (click)="startCorrectionRound()" 
                  class="h-16 w-full bg-ls-accent text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-wider shadow-lg active:scale-95 transition-all">
            <i-lucide [img]="RotateCcwIcon" size="18"></i-lucide>
            Start Correction Round
          </button>
          <div class="grid grid-cols-2 gap-4">
            <button class="h-16 bg-ls-primary text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-wider shadow shadow-ls-primary/50 active:scale-95 transition-all">
              <i-lucide [img]="ShareIcon" size="18"></i-lucide>
              Share PDF
            </button>
            <a routerLink="/user/dashboard" class="h-16 bg-white border border-ls-card-border text-ls-text rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-wider active:scale-95 transition-all shadow-sm">
              Dashboard
            </a>
          </div>
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
  readonly TargetIcon = Target;
  readonly ZapIcon = Zap;
  readonly RotateCcwIcon = RotateCcw;

  summary = signal<any>(null);
  bestPerformerId = computed(() => {
    const s = this.summary();
    if (!s) return null;
    const members = s.memberScores || s.members || [];
    if (members.length === 0) return null;
    return members.reduce((prev: any, current: any) => 
      ((current.fluencyScore ?? current.score) > (prev.fluencyScore ?? prev.score)) ? current : prev
    ).userId;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private liveSessionService: LiveSessionService,
    private repracticeService: RepracticeService,
    public loader: LoaderService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // 1. Check navigation state
    const stateSummary = window.history.state?.summary;
    if (stateSummary) {
      this.summary.set(stateSummary);
    } else {
      // 2. Fetch from API if direct navigation
      this.route.params.subscribe(params => {
        const id = params['id'];
        if (id) {
          this.fetchSummary(id);
        }
      });
    }
  }

  fetchSummary(sessionId: string) {
    this.loader.show();
    this.liveSessionService.getSessionDetail(sessionId).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toast.error('Could not load session report');
        this.router.navigate(['/user/dashboard']);
      }
    });
  }

  startCorrectionRound() {
    const sessionId = this.summary()?.id;
    if (!sessionId) return;

    this.loader.show();
    this.repracticeService.generate(sessionId).subscribe({
      next: (res) => {
        this.loader.hide();
        const rpId = res.repracticeSessionId || res.id;
        if (rpId) {
          this.router.navigate(['/repractice', rpId]);
        } else {
          this.toast.error('Could not start correction round');
        }
      },
      error: () => {
        this.loader.hide();
        this.toast.error('Error generating improvement plan');
      }
    });
  }
}

// File: src/app/modules/user/my-mistakes/my-mistakes.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MistakeService } from '../mistake.service';
import { RepracticeService } from '../../repractice/repractice.service';
import { Mistake, MistakeSummary } from '@core/models/mistake.model';
import { LucideAngularModule, AlertCircle, CheckCircle, Clock, ChevronRight, TrendingUp, Mic2, Filter, Info } from 'lucide-angular';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-my-mistakes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

        <!-- Page heading -->
        <div>
          <h1 class="text-xl font-black text-gw-text tracking-tight">My Mistakes</h1>
          <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Review and fix your common errors</p>
        </div>

        <!-- Summary Grid -->
        <div class="grid grid-cols-2 gap-3">
          @for (item of summaryItems; track item.label) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 space-y-2 relative overflow-hidden">
              <div class="absolute -right-2 -bottom-2 opacity-[0.05] pointer-events-none">
                <i-lucide [img]="item.icon" size="56"></i-lucide>
              </div>
              <div class="flex items-center gap-2">
                <i-lucide [img]="item.icon" size="13" class="text-gw-primary flex-shrink-0"></i-lucide>
                <span class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">{{ item.label }}</span>
              </div>
              <p class="text-2xl font-black text-gw-text tracking-tight leading-none">
                {{ item.value }}{{ item.suffix || '' }}
              </p>
            </div>
          }
        </div>

        <!-- Filter Tabs -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-gw-bg overflow-x-auto scrollbar-none">
            <i-lucide [img]="FilterIcon" size="14" class="text-gw-text-muted shrink-0"></i-lucide>
            @for (tab of tabs; track tab) {
              <button
                (click)="activeTab.set(tab); loadMistakes()"
                class="whitespace-nowrap px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
                [class.bg-gw-primary]="activeTab() === tab"
                [class.text-white]="activeTab() === tab"
                [class.bg-gw-bg]="activeTab() !== tab"
                [class.text-gw-text-muted]="activeTab() !== tab"
              >
                {{ tab }}
              </button>
            }
          </div>

          <!-- Mistake List -->
          @if (isLoading()) {
            @for (i of [1,2,3]; track i) {
              <div class="h-28 bg-gw-bg/60 border-b border-gw-bg animate-pulse"></div>
            }
          } @else if (mistakes().length === 0) {
            <div class="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="CheckIcon" size="22" class="text-gw-text-muted"></i-lucide>
              </div>
              <div>
                <p class="text-sm font-bold text-gw-text">You're flowing well!</p>
                <p class="text-xs text-gw-text-muted mt-0.5">No mistakes found in this category.</p>
              </div>
            </div>
          } @else {
            <div class="divide-y divide-gw-bg">
              @for (mistake of mistakes(); track mistake.id) {
                <div class="px-5 py-4 flex gap-4 relative">
                  <!-- Status bar -->
                  <div class="absolute left-0 top-0 w-1 h-full rounded-r-full"
                       [class.bg-gw-error]="!mistake.isResolved"
                       [class.bg-gw-success]="mistake.isResolved"></div>

                  <div class="flex-1 min-w-0 space-y-3 pl-2">
                    <!-- Type + Date + Resolved -->
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-1 bg-gw-bg text-gw-text-muted rounded-lg text-[9px] font-black uppercase tracking-wider">
                          {{ mistake.type }}
                        </span>
                        <span class="text-[10px] font-semibold text-gw-text-muted flex items-center gap-1">
                          <i-lucide [img]="ClockIcon" size="10"></i-lucide>
                          {{ mistake.createdDate | date:'shortDate' }}
                        </span>
                      </div>
                      @if (mistake.isResolved) {
                        <span class="flex items-center gap-1 text-gw-success text-[9px] font-black uppercase tracking-wider shrink-0">
                          <i-lucide [img]="CheckIcon" size="11"></i-lucide>
                          Resolved
                        </span>
                      }
                    </div>

                    <!-- Said vs Expected -->
                    <div class="space-y-1.5">
                      <div class="flex items-baseline gap-3">
                        <span class="w-8 text-[9px] font-black text-gw-error uppercase shrink-0">Said</span>
                        <p class="text-sm font-semibold text-gw-text-muted line-through decoration-gw-error/40 truncate">
                          {{ mistake.spokenText }}
                        </p>
                      </div>
                      <div class="flex items-baseline gap-3">
                        <span class="w-8 text-[9px] font-black text-gw-success uppercase shrink-0">Next</span>
                        <p class="text-sm font-black text-gw-text truncate">{{ mistake.expectedText }}</p>
                      </div>
                    </div>

                    <!-- Correction note -->
                    @if (mistake.correctionNote) {
                      <div class="flex items-start gap-2 bg-gw-bg rounded-xl px-3 py-2.5">
                        <i-lucide [img]="InfoIcon" size="12" class="text-gw-primary mt-0.5 shrink-0"></i-lucide>
                        <p class="text-[10px] font-semibold text-gw-text-muted leading-relaxed">{{ mistake.correctionNote }}</p>
                      </div>
                    }
                  </div>

                  <!-- Right: Frequency + Action -->
                  <div class="flex flex-col items-center gap-2 shrink-0 w-16">
                    <div class="text-center">
                      <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Freq</p>
                      <p class="text-lg font-black text-gw-text">{{ mistake.occurredCount }}x</p>
                    </div>
                    <button
                      (click)="startPractice(0)"
                      class="w-12 h-12 rounded-xl bg-gw-primary/10 text-gw-primary
                             flex items-center justify-center
                             hover:bg-gw-primary hover:text-white transition-all"
                    >
                      <i-lucide [img]="NextIcon" size="16"></i-lucide>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Practice All CTA -->
        <button
          (click)="startPractice()"
          [disabled]="isPracticing() || mistakes().length === 0"
          class="w-full h-14 bg-gw-primary text-white font-black uppercase tracking-widest
                 rounded-2xl shadow-lg shadow-gw-primary/20 flex items-center justify-center gap-3
                 hover:opacity-90 active:scale-[0.98] transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i-lucide [img]="MicIcon" size="18"></i-lucide>
          {{ isPracticing() ? 'Preparing...' : 'Practice All Mistakes' }}
          @if (!isPracticing() && (summary()?.pendingMistakes ?? 0) > 0) {
            <span class="bg-white/20 text-white px-2 py-0.5 rounded-lg text-[10px]">
              {{ summary()?.pendingMistakes }}
            </span>
          }
        </button>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class MyMistakesComponent implements OnInit {
  private mistakeService  = inject(MistakeService);
  private repracticeService = inject(RepracticeService);
  private toast           = inject(ToastService);
  private router          = inject(Router);

  readonly FilterIcon = Filter;
  readonly ClockIcon  = Clock;
  readonly CheckIcon  = CheckCircle;
  readonly NextIcon   = ChevronRight;
  readonly InfoIcon   = Info;
  readonly MicIcon    = Mic2;

  tabs = ['All', 'Grammar', 'Pronunciation', 'Hesitation', 'Speed'];
  activeTab   = signal('All');
  mistakes    = signal<Mistake[]>([]);
  summary     = signal<MistakeSummary | null>(null);
  isLoading   = signal(true);
  isPracticing = signal(false);

  summaryItems = [
    { label: 'Total',       value: 0, icon: AlertCircle,  key: 'totalMistakes'    },
    { label: 'Resolved',    value: 0, icon: CheckCircle,  key: 'resolvedMistakes' },
    { label: 'Pending',     value: 0, icon: Clock,        key: 'pendingMistakes'  },
    { label: 'Improvement', value: 0, icon: TrendingUp,   key: 'improvementPercent', suffix: '%' }
  ];

  ngOnInit() {
    this.loadSummary();
    this.loadMistakes();
  }

  loadSummary() {
    this.mistakeService.getMistakeSummary().subscribe(res => {
      this.summary.set(res);
      this.summaryItems = this.summaryItems.map(item => ({
        ...item,
        value: (res as any)[item.key]
      }));
    });
  }

  loadMistakes() {
    this.isLoading.set(true);
    this.mistakeService.getMistakes({ mistakeType: this.activeTab() }).subscribe({
      next: res => {
        this.mistakes.set(res.items ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.mistakes.set([]);
        this.isLoading.set(false);
      }
    });
  }

  startPractice(sessionId: number = 0) {
    this.isPracticing.set(true);
    this.repracticeService.generateRepracticeSession(sessionId).subscribe({
      next: (res) => {
        this.isPracticing.set(false);
        this.router.navigate(['/repractice', res.repracticeSessionId]);
      },
      error: () => this.isPracticing.set(false)
    });
  }
}

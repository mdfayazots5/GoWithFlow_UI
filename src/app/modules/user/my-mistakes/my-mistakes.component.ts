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
    <div class="space-y-10 animate-in fade-in duration-500 pb-32">
      <!-- Header -->
      <div class="space-y-1">
        <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tighter">MY MISTAKES</h2>
        <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Review and fix your common errors</p>
      </div>

      <!-- Summary Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @for (item of summaryItems; track item.label) {
          <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-2">
             <div class="flex items-center gap-2">
                <i-lucide [img]="item.icon" size="14" class="text-gw-primary"></i-lucide>
                <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ item.label }}</span>
             </div>
             <p class="text-3xl font-black text-gw-text italic tracking-tight">
                {{ item.value }}{{ item.suffix || '' }}
             </p>
          </div>
        }
      </div>

      <!-- Filters & List -->
      <div class="space-y-6">
        <div class="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
           <i-lucide [img]="FilterIcon" size="18" class="text-gw-text-muted shrink-0"></i-lucide>
           @for (tab of tabs; track tab) {
             <button 
               (click)="activeTab.set(tab); loadMistakes()"
               class="whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2"
               [class.bg-gw-text]="activeTab() === tab"
               [class.text-white]="activeTab() === tab"
               [class.border-gw-text]="activeTab() === tab"
               [class.text-gw-text-muted]="activeTab() !== tab"
               [class.border-transparent]="activeTab() !== tab"
               [class.bg-white]="activeTab() !== tab"
             >
               {{ tab }}
             </button>
           }
        </div>

        <div class="grid gap-4">
           @if (isLoading()) {
             @for (i of [1,2,3]; track i) {
                <div class="h-40 bg-white rounded-[40px] border border-gw-card-border animate-pulse"></div>
             }
           } @else {
             @for (mistake of mistakes(); track mistake.id) {
               <div class="bg-white p-8 rounded-[40px] border border-gw-card-border shadow-sm flex flex-col md:flex-row md:items-center gap-8 relative overflow-hidden group">
                  <div class="absolute top-0 left-0 w-2 h-full" [class.bg-gw-error]="!mistake.isResolved" [class.bg-gw-success]="mistake.isResolved"></div>
                  
                  <div class="flex-1 space-y-6">
                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <span class="px-3 py-1 bg-gw-bg text-gw-text-muted rounded-lg text-[8px] font-black uppercase tracking-widest italic">{{ mistake.type }}</span>
                           <span class="text-[10px] font-bold text-white/40 italic flex items-center gap-1 text-gw-text-muted">
                              <i-lucide [img]="ClockIcon" size="12"></i-lucide>
                              {{ mistake.createdDate | date:'shortDate' }}
                           </span>
                        </div>
                        @if (mistake.isResolved) {
                           <span class="flex items-center gap-1 text-gw-success text-[8px] font-black uppercase tracking-widest italic">
                              <i-lucide [img]="CheckIcon" size="12"></i-lucide>
                              Resolved
                           </span>
                        }
                     </div>

                     <div class="space-y-4">
                        <div class="flex items-center gap-4">
                           <span class="w-8 text-[8px] font-black text-gw-error uppercase italic">Said</span>
                           <p class="flex-1 text-lg font-bold text-gw-text-muted italic line-through decoration-gw-error/40">{{ mistake.spokenText }}</p>
                        </div>
                        <div class="flex items-center gap-4">
                           <span class="w-8 text-[8px] font-black text-gw-success uppercase italic">Next</span>
                           <p class="flex-1 text-xl font-black text-gw-text italic">{{ mistake.expectedText }}</p>
                        </div>
                     </div>

                     @if (mistake.correctionNote) {
                       <div class="flex items-start gap-2 bg-gw-bg/50 p-4 rounded-2xl">
                          <i-lucide [img]="InfoIcon" size="14" class="text-gw-primary mt-0.5"></i-lucide>
                          <p class="text-xs font-bold text-gw-text-muted italic leading-relaxed">{{ mistake.correctionNote }}</p>
                       </div>
                     }
                  </div>

                  <div class="flex flex-col gap-4 md:w-48">
                     <div class="text-center p-4 bg-gw-bg rounded-2xl border border-gw-bg">
                        <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic mb-1">Frequency</p>
                        <p class="text-xl font-black text-gw-text italic">{{ mistake.occurredCount }}x</p>
                     </div>
                     <button 
                        (click)="startPractice(mistake.sessionId)"
                        class="h-12 bg-gw-primary/10 text-gw-primary font-black uppercase tracking-widest text-[10px] italic rounded-xl border border-gw-primary/20 hover:bg-gw-primary hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                        PRACTICE THIS
                        <i-lucide [img]="NextIcon" size="14"></i-lucide>
                     </button>
                  </div>
               </div>
             }
             
             @if (mistakes().length === 0) {
                <div class="py-20 text-center space-y-6">
                   <div class="w-20 h-20 bg-gw-bg rounded-3xl flex items-center justify-center text-gw-card-border mx-auto">
                      <i-lucide [img]="CheckIcon" size="40"></i-lucide>
                   </div>
                   <div class="space-y-2">
                      <h4 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">YOU ARE FLOWING WELL!</h4>
                      <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">No unresolved mistakes found in this category.</p>
                   </div>
                </div>
             }
           }
        </div>
      </div>

      <!-- Sticky Bottom Action -->
      <div class="fixed bottom-20 left-0 right-0 p-6 z-40 bg-transparent pointer-events-none md:bottom-6">
         <div class="max-w-xl mx-auto pointer-events-auto">
            <button 
              (click)="startPractice()"
              [disabled]="isPracticing() || mistakes().length === 0"
              class="w-full h-16 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <i-lucide [img]="MicIcon" size="20" class="text-gw-accent"></i-lucide>
              {{ isPracticing() ? 'PREPARING...' : 'PRACTICE ALL MISTAKES' }}
              <span class="bg-gw-accent text-white px-2 py-0.5 rounded-lg text-[10px] ml-2">{{ DUMMY_SUMMARY().pendingPractice }}</span>
            </button>
         </div>
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
  private mistakeService = inject(MistakeService);
  private repracticeService = inject(RepracticeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly FilterIcon = Filter;
  readonly ClockIcon = Clock;
  readonly CheckIcon = CheckCircle;
  readonly NextIcon = ChevronRight;
  readonly InfoIcon = Info;
  readonly MicIcon = Mic2;

  tabs = ['All', 'Grammar', 'Pronunciation', 'Hesitation', 'Speed'];
  activeTab = signal('All');
  mistakes = signal<Mistake[]>([]);
  summary = signal<MistakeSummary | null>(null);
  isLoading = signal(true);
  isPracticing = signal(false);

  DUMMY_SUMMARY = signal<any>({ pendingPractice: 5 });

  summaryItems = [
    { label: 'Total Mistakes', value: 0, icon: AlertCircle, key: 'totalMistakes' },
    { label: 'Resolved', value: 0, icon: CheckCircle, key: 'resolvedMistakes' },
    { label: 'Pending', value: 0, icon: Clock, key: 'pendingPractice' },
    { label: 'Improvement', value: 0, icon: TrendingUp, key: 'improvementPercent', suffix: '%' }
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
    this.mistakeService.getMistakes({ type: this.activeTab() }).subscribe(res => {
      this.mistakes.set(res.items);
      this.isLoading.set(false);
    });
  }

  startPractice(sessionId: string = '0') {
    this.isPracticing.set(true);
    this.repracticeService.generateRepracticeSession(sessionId).subscribe({
      next: (res) => {
        this.isPracticing.set(false);
        this.router.navigate(['/repractice', res.id]);
      },
      error: () => this.isPracticing.set(false)
    });
  }
}

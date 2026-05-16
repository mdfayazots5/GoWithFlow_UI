import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { MistakeService, Mistake } from '@core/services/mistake.service';
import { RepracticeService } from '@core/services/repractice.service';
import { LucideAngularModule, AlertCircle, RotateCcw, ChevronRight, Zap, Target } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-mistakes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Learning Gaps" subtitle="Review and resolve your speaking mistakes"></app-header>

      <main class="p-6 space-y-8 animate-in slide-in-from-bottom-4">
        <!-- Summary Dashboard -->
        <div class="grid grid-cols-2 gap-4" *ngIf="summary">
           <div class="card border-none bg-ls-error text-white p-6">
              <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Unresolved</p>
              <h3 class="text-4xl font-black italic mt-1">{{ summary.unresolvedCount }}</h3>
           </div>
           <div class="card border-none bg-ls-success text-white p-6">
              <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Resolved Today</p>
              <h3 class="text-4xl font-black italic mt-1">{{ summary.todayResolved }}</h3>
           </div>
        </div>

        <!-- Call to Action: Repractice -->
        <button 
          (click)="startRepractice()"
          class="w-full h-20 bg-ls-primary rounded-3xl p-6 flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-ls-primary/20"
        >
           <div class="flex items-center gap-4 text-white text-left">
              <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                 <i-lucide [img]="RotateIcon" size="20"></i-lucide>
              </div>
              <div>
                 <h4 class="font-black italic text-lg uppercase tracking-tight">Correction Round</h4>
                 <p class="text-[10px] font-bold opacity-70 uppercase tracking-widest">Start a focused practice session</p>
              </div>
           </div>
           <i-lucide [img]="NextIcon" size="20" class="text-white group-hover:translate-x-1 transition-all"></i-lucide>
        </button>

        <!-- Grammar Progress -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Concept Mastery</h3>
           <div class="card space-y-4">
              <div *ngFor="let g of grammarProgress" class="space-y-2">
                 <div class="flex justify-between items-center">
                    <span class="text-[10px] font-black uppercase tracking-widest text-ls-text">{{ g.label }}</span>
                    <span class="text-[10px] font-bold text-ls-primary italic">{{ g.progress }}%</span>
                 </div>
                 <div class="h-1.5 bg-ls-bg rounded-full overflow-hidden">
                    <div class="h-full bg-ls-primary" [style.width.%]="g.progress"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- Mistake List -->
        <div class="space-y-4">
           <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Recent Errors</h3>
           <div class="space-y-3">
              <div *ngFor="let m of mistakes" class="card bg-white p-5 flex flex-col gap-4 border-l-4 border-l-ls-error">
                 <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                       <i-lucide [img]="AlertIcon" size="14" class="text-ls-error"></i-lucide>
                       <span class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">{{ m.type }}</span>
                    </div>
                    <span class="text-[8px] font-bold text-ls-text-muted uppercase">{{ m.createdAt | date:'MMM d' }}</span>
                 </div>
                 
                 <div class="space-y-2">
                    <div class="bg-ls-bg p-3 rounded-xl border border-ls-card-border overflow-hidden">
                       <p class="text-[8px] font-black uppercase tracking-widest text-ls-text-muted mb-1 opacity-50">Transcribed:</p>
                       <p class="text-sm font-bold italic text-ls-error">{{ m.transcribedText }}</p>
                    </div>
                    <div class="bg-green-50 p-3 rounded-xl border border-green-100 overflow-hidden">
                       <p class="text-[8px] font-black uppercase tracking-widest text-ls-success mb-1 opacity-50">Expected:</p>
                       <p class="text-sm font-bold italic text-ls-success">{{ m.originalText }}</p>
                    </div>
                 </div>

                 <div *ngIf="m.grammarFocus" class="flex gap-2">
                    <span class="px-2 py-0.5 bg-ls-accent/10 text-ls-accent text-[8px] font-black uppercase tracking-widest rounded">
                       FOCUS: {{ m.grammarFocus }}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: []
})
export class MyMistakesComponent implements OnInit {
  readonly AlertIcon = AlertCircle;
  readonly RotateIcon = RotateCcw;
  readonly NextIcon = ChevronRight;
  readonly ZapIcon = Zap;
  readonly TargetIcon = Target;

  summary: any;
  mistakes: Mistake[] = [];
  grammarProgress: any[] = [];

  constructor(
    private mistakeService: MistakeService,
    private repracticeService: RepracticeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.mistakeService.getSummary().subscribe(s => this.summary = s);
    this.mistakeService.getMistakes({ resolved: false }).subscribe(res => this.mistakes = res.items);
    this.mistakeService.getGrammarProgress().subscribe(p => this.grammarProgress = p);
  }

  startRepractice() {
    this.repracticeService.generate().subscribe(res => {
      this.router.navigate(['/repractice', res.id]);
    });
  }
}

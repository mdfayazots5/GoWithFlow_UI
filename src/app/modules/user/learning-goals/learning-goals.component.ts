import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { LucideAngularModule, ChevronLeft, Target, TrendingUp, TrendingDown, Minus, CheckCircle2, Calendar, Zap } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface GoalProgress {
  hasActiveGoal: boolean;
  goalType: string;
  goalLabel: string;
  timelineWeeks: number;
  startDate: string;
  targetDate: string;
  detectedLevel: string;
  sessionsCompleted: number;
  sessionsTarget: number;
  primaryMetricLabel: string;
  startingScore: number;
  currentScore: number;
  targetScore: number;
  trendLabel: string;
  estimatedWeeksRemaining: number;
  recommendedPlan: string;
  progressPercent: number;
}

@Component({
  selector: 'app-learning-goals',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-32">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/user/dashboard"
          class="w-10 h-10 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
          <i-lucide [img]="BackIcon" size="20"></i-lucide>
        </button>
        <div>
          <h2 class="text-2xl font-black text-gw-text italic uppercase tracking-tighter">Learning Goals</h2>
          <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-widest italic">Set your goal and track progress</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading goal...</p>
        </div>
      }

      @else {

        <!-- Active Goal Progress Panel -->
        @if (goal()?.hasActiveGoal) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-6 space-y-5">

            <!-- Goal title + trend -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Active Goal</p>
                <p class="text-lg font-black text-gw-text italic mt-0.5">{{ goal()!.goalLabel }}</p>
                <p class="text-[9px] font-semibold text-gw-text-muted mt-0.5 italic">{{ goal()!.detectedLevel }} · {{ goal()!.timelineWeeks }} weeks</p>
              </div>
              <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                [class.bg-gw-success/10]="goal()!.trendLabel === 'Improving'"
                [class.bg-amber-50]="goal()!.trendLabel === 'Stable'"
                [class.bg-gw-error/10]="goal()!.trendLabel === 'Declining'">
                <i-lucide [img]="trendIcon()" size="13"
                  [class.text-gw-success]="goal()!.trendLabel === 'Improving'"
                  [class.text-amber-500]="goal()!.trendLabel === 'Stable'"
                  [class.text-gw-error]="goal()!.trendLabel === 'Declining'"></i-lucide>
                <span class="text-[8px] font-black uppercase tracking-wider italic"
                  [class.text-gw-success]="goal()!.trendLabel === 'Improving'"
                  [class.text-amber-500]="goal()!.trendLabel === 'Stable'"
                  [class.text-gw-error]="goal()!.trendLabel === 'Declining'">
                  {{ goal()!.trendLabel }}
                </span>
              </div>
            </div>

            <!-- Sessions progress bar -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Sessions Completed</p>
                <p class="text-[9px] font-black text-gw-text italic">{{ goal()!.sessionsCompleted }} / {{ goal()!.sessionsTarget }}</p>
              </div>
              <div class="h-2.5 bg-gw-bg rounded-full overflow-hidden">
                <div class="h-full bg-gw-primary rounded-full transition-all duration-700"
                  [style.width.%]="goal()!.progressPercent">
                </div>
              </div>
              <p class="text-[8px] font-bold text-gw-text-muted mt-1 italic">{{ goal()!.progressPercent | number:'1.0-0' }}% toward session target</p>
            </div>

            <!-- Score movement -->
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-gw-bg rounded-xl p-3">
                <p class="text-[8px] font-black uppercase tracking-wider text-gw-text-muted italic">Start</p>
                <p class="text-xl font-black text-gw-text-muted italic">{{ goal()!.startingScore | number:'1.0-0' }}</p>
              </div>
              <div class="bg-gw-primary/10 rounded-xl p-3">
                <p class="text-[8px] font-black uppercase tracking-wider text-gw-primary italic">Now</p>
                <p class="text-xl font-black text-gw-primary italic">{{ goal()!.currentScore | number:'1.0-0' }}</p>
              </div>
              <div class="bg-gw-success/10 rounded-xl p-3">
                <p class="text-[8px] font-black uppercase tracking-wider text-gw-success italic">Target</p>
                <p class="text-xl font-black text-gw-success italic">{{ goal()!.targetScore | number:'1.0-0' }}</p>
              </div>
            </div>
            <p class="text-[9px] font-semibold text-gw-text-muted italic text-center">{{ goal()!.primaryMetricLabel }}</p>

            <!-- Timeline dates -->
            <div class="flex items-center justify-between text-[9px] font-bold text-gw-text-muted italic">
              <div class="flex items-center gap-1.5">
                <i-lucide [img]="CalIcon" size="12"></i-lucide>
                <span>Started {{ goal()!.startDate | date:'MMM d, yyyy' }}</span>
              </div>
              <span>~{{ goal()!.estimatedWeeksRemaining }} weeks left</span>
              <div class="flex items-center gap-1.5">
                <i-lucide [img]="CalIcon" size="12"></i-lucide>
                <span>Target {{ goal()!.targetDate | date:'MMM d, yyyy' }}</span>
              </div>
            </div>

            <!-- Recommended plan -->
            <div class="bg-gw-primary/5 border border-gw-primary/15 rounded-xl px-4 py-3">
              <div class="flex items-center gap-2 mb-1">
                <i-lucide [img]="ZapIcon" size="13" class="text-gw-primary"></i-lucide>
                <p class="text-[9px] font-black uppercase tracking-widest text-gw-primary italic">Recommended Plan</p>
              </div>
              <p class="text-[10px] font-semibold text-gw-text italic">{{ goal()!.recommendedPlan }}</p>
            </div>

            <!-- Change goal button -->
            <button (click)="showForm.set(true)"
              class="w-full py-2 border border-gw-card-border rounded-xl text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic hover:border-gw-primary hover:text-gw-primary transition-all">
              Change Goal
            </button>
          </div>
        }

        <!-- Goal Setup Form -->
        @if (!goal()?.hasActiveGoal || showForm()) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-6 space-y-5">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Set Your Practice Goal</p>
              <h3 class="text-lg font-black text-gw-text italic mt-0.5">What do you want to achieve?</h3>
            </div>

            <!-- Goal type selection -->
            <div class="grid grid-cols-2 gap-2">
              @for (opt of goalOptions; track opt.value) {
                <button (click)="selectedGoalType.set(opt.value)"
                  class="p-4 rounded-xl border text-left transition-all"
                  [class.border-gw-primary]="selectedGoalType() === opt.value"
                  [class.bg-gw-primary/5]="selectedGoalType() === opt.value"
                  [class.border-gw-card-border]="selectedGoalType() !== opt.value"
                  [class.bg-white]="selectedGoalType() !== opt.value">
                  <p class="text-[10px] font-black uppercase tracking-wider italic"
                    [class.text-gw-primary]="selectedGoalType() === opt.value"
                    [class.text-gw-text]="selectedGoalType() !== opt.value">
                    {{ opt.label }}
                  </p>
                  <p class="text-[8px] text-gw-text-muted italic mt-0.5">{{ opt.desc }}</p>
                </button>
              }
            </div>

            <!-- Timeline selection -->
            <div>
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic mb-2">Timeline</p>
              <div class="flex gap-2">
                @for (wk of [2, 4, 8]; track wk) {
                  <button (click)="selectedWeeks.set(wk)"
                    class="flex-1 py-3 rounded-xl border text-sm font-black italic transition-all"
                    [class.bg-gw-primary]="selectedWeeks() === wk"
                    [class.text-white]="selectedWeeks() === wk"
                    [class.border-gw-primary]="selectedWeeks() === wk"
                    [class.bg-white]="selectedWeeks() !== wk"
                    [class.text-gw-text-muted]="selectedWeeks() !== wk"
                    [class.border-gw-card-border]="selectedWeeks() !== wk">
                    {{ wk }}w
                  </button>
                }
              </div>
            </div>

            <!-- Submit -->
            <button (click)="setGoal()" [disabled]="!selectedGoalType() || isSaving()"
              class="w-full py-3.5 bg-gw-primary text-white font-black text-[10px] uppercase tracking-widest italic rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              @if (isSaving()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else {
                <i-lucide [img]="TargetIcon" size="14"></i-lucide>
              }
              Set Goal
            </button>
          </div>
        }

        <!-- Link to learning path -->
        <a routerLink="/user/dashboard"
          class="flex items-center justify-between bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 hover:border-gw-primary transition-all group">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center">
              <i-lucide [img]="ZapIcon" size="16" class="text-gw-primary"></i-lucide>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-wider text-gw-text italic group-hover:text-gw-primary transition-colors">View Guided Learning Path</p>
              <p class="text-[8px] text-gw-text-muted italic">Recommended sessions based on your goal</p>
            </div>
          </div>
          <i-lucide [img]="BackIcon" size="16" class="text-gw-text-muted rotate-180"></i-lucide>
        </a>

      }

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LearningGoalsComponent implements OnInit {
  private userService = inject(UserService);

  readonly BackIcon   = ChevronLeft;
  readonly TargetIcon = Target;
  readonly UpIcon     = TrendingUp;
  readonly DownIcon   = TrendingDown;
  readonly StableIcon = Minus;
  readonly CheckIcon  = CheckCircle2;
  readonly CalIcon    = Calendar;
  readonly ZapIcon    = Zap;

  goal             = signal<GoalProgress | null>(null);
  isLoading        = signal(true);
  isSaving         = signal(false);
  showForm         = signal(false);
  selectedGoalType = signal<string>('');
  selectedWeeks    = signal<number>(4);

  goalOptions = [
    { value: 'interview',  label: 'Job Interview',    desc: 'Improve professional English' },
    { value: 'grammar',    label: 'Better Grammar',   desc: 'Fix recurring mistakes' },
    { value: 'vocabulary', label: 'Build Vocabulary', desc: 'Learn new words daily' },
    { value: 'fluency',    label: 'Speak Fluently',   desc: 'Build speaking confidence' }
  ];

  trendIcon() {
    const t = this.goal()?.trendLabel;
    if (t === 'Improving') return TrendingUp;
    if (t === 'Declining') return TrendingDown;
    return Minus;
  }

  ngOnInit() {
    this.userService.getGoalProgress().pipe(
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      this.goal.set(data);
      this.isLoading.set(false);
    });
  }

  setGoal() {
    if (!this.selectedGoalType()) return;
    this.isSaving.set(true);

    this.userService.setGoal(this.selectedGoalType(), this.selectedWeeks()).pipe(
      catchError(() => {
        this.isSaving.set(false);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.goal.set(data);
        this.showForm.set(false);
      }
      this.isSaving.set(false);
    });
  }
}

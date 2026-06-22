import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import {
  LucideAngularModule,
  Target, TrendingUp, TrendingDown, Minus,
  CheckCircle2, Calendar, Zap, BookOpen, Book, AlertCircle, ArrowRight
} from 'lucide-angular';
import { catchError, of } from 'rxjs';
import { SkeletonCardComponent } from '@shared/ui/skeleton';

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
  imports: [CommonModule, DecimalPipe, DatePipe, LucideAngularModule, RouterLink, SkeletonCardComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
          <i-lucide [img]="TargetIcon" size="20" class="text-gw-primary"></i-lucide>
        </div>
        <div>
          <h1 class="text-xl font-black text-gw-text tracking-tight">Learning Goals</h1>
          <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Set your goal · Track progress</p>
        </div>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────────── -->
      @if (isLoading()) {
        <app-skeleton-card [avatar]="false" [bodyLines]="4"></app-skeleton-card>
      }

      <!-- ── Error state ───────────────────────────────────────────────── -->
      @else if (hasError()) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-8
                    flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-gw-error/10 flex items-center justify-center">
            <i-lucide [img]="AlertIcon" size="26" class="text-gw-error"></i-lucide>
          </div>
          <div>
            <p class="text-base font-black text-gw-text italic">Could not load goal</p>
            <p class="text-xs text-gw-text-muted italic mt-1">
              Please try refreshing the page.
            </p>
          </div>
        </div>
      }

      @else {

        <!-- ── Active Goal Panel ─────────────────────────────────────── -->
        @if (goal()?.hasActiveGoal) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

            <!-- Card header -->
            <div class="px-5 py-4 border-b border-gw-bg flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">
                  Active Goal
                </p>
                <p class="text-lg font-black text-gw-text italic mt-0.5 leading-snug">
                  {{ goal()!.goalLabel }}
                </p>
                <p class="text-[11px] font-semibold text-gw-text-muted mt-1 italic">
                  {{ goal()!.detectedLevel }} · {{ goal()!.timelineWeeks }}-week plan
                </p>
              </div>

              <!-- Trend badge -->
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                [ngClass]="{
                  'bg-gw-success/10': goal()!.trendLabel === 'Improving',
                  'bg-amber-50':      goal()!.trendLabel === 'Stable',
                  'bg-gw-error/10':   goal()!.trendLabel === 'Declining'
                }">
                <i-lucide [img]="trendIcon()" size="12"
                  [class.text-gw-success]="goal()!.trendLabel === 'Improving'"
                  [class.text-amber-500]=" goal()!.trendLabel === 'Stable'"
                  [class.text-gw-error]="  goal()!.trendLabel === 'Declining'">
                </i-lucide>
                <span class="text-[11px] font-black uppercase tracking-widest italic"
                  [class.text-gw-success]="goal()!.trendLabel === 'Improving'"
                  [class.text-amber-500]=" goal()!.trendLabel === 'Stable'"
                  [class.text-gw-error]="  goal()!.trendLabel === 'Declining'">
                  {{ goal()!.trendLabel }}
                </span>
              </div>
            </div>

            <div class="p-5 space-y-5">

              <!-- Session progress -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">
                    Session Progress
                  </p>
                  <div class="flex items-baseline gap-1">
                    <span class="text-sm font-black text-gw-primary italic">
                      {{ goal()!.sessionsCompleted }}
                    </span>
                    <span class="text-[11px] font-bold text-gw-text-muted italic">
                      / {{ goal()!.sessionsTarget }}
                    </span>
                  </div>
                </div>
                <div class="h-3 bg-gw-bg rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700"
                    [style.width.%]="goal()!.progressPercent"
                    [class.bg-gw-success]="goal()!.progressPercent >= 67"
                    [class.bg-gw-primary]="goal()!.progressPercent >= 34 && goal()!.progressPercent < 67"
                    [class.bg-amber-400]=" goal()!.progressPercent < 34">
                  </div>
                </div>
                <div class="flex items-center justify-between mt-1.5">
                  <span class="text-[11px] font-bold text-gw-text-muted italic">
                    {{ goal()!.progressPercent | number:'1.0-0' }}% complete
                  </span>
                  <span class="text-[11px] font-bold text-gw-text-muted italic">
                    ~{{ goal()!.estimatedWeeksRemaining }} weeks remaining
                  </span>
                </div>
              </div>

              <!-- Score movement -->
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic mb-3">
                  {{ goal()!.primaryMetricLabel }}
                </p>
                <div class="grid grid-cols-3 gap-2">

                  <!-- Start -->
                  <div class="bg-gw-bg rounded-xl p-3 text-center">
                    <p class="text-[11px] font-black uppercase tracking-wider text-gw-text-muted italic">
                      Start
                    </p>
                    <p class="text-2xl font-black text-gw-text-muted italic mt-0.5">
                      {{ goal()!.startingScore | number:'1.0-0' }}
                    </p>
                  </div>

                  <!-- Current — with delta badge -->
                  <div class="bg-gw-primary/10 rounded-xl p-3 text-center relative">
                    <p class="text-[11px] font-black uppercase tracking-wider text-gw-primary italic">
                      Now
                    </p>
                    <p class="text-2xl font-black text-gw-primary italic mt-0.5">
                      {{ goal()!.currentScore | number:'1.0-0' }}
                    </p>
                    @if (scoreDelta() > 0) {
                      <span class="absolute -top-2 -right-2 text-[11px] font-black
                                   bg-gw-success text-white px-1.5 py-0.5 rounded-full leading-none">
                        +{{ scoreDelta() }}
                      </span>
                    } @else if (scoreDelta() < 0) {
                      <span class="absolute -top-2 -right-2 text-[11px] font-black
                                   bg-gw-error/15 text-gw-error px-1.5 py-0.5 rounded-full leading-none">
                        {{ scoreDelta() }}
                      </span>
                    }
                  </div>

                  <!-- Target -->
                  <div class="bg-gw-success/10 rounded-xl p-3 text-center">
                    <p class="text-[11px] font-black uppercase tracking-wider text-gw-success italic">
                      Target
                    </p>
                    <p class="text-2xl font-black text-gw-success italic mt-0.5">
                      {{ goal()!.targetScore | number:'1.0-0' }}
                    </p>
                  </div>

                </div>
              </div>

              <!-- Timeline strip -->
              <div class="flex items-center gap-3 py-2.5 px-4 bg-gw-bg rounded-xl">
                <div class="flex items-center gap-1.5 text-[11px] font-bold text-gw-text-muted italic shrink-0">
                  <i-lucide [img]="CalIcon" size="11"></i-lucide>
                  <span>{{ goal()!.startDate | date:'MMM d' }}</span>
                </div>
                <div class="flex-1 border-t-2 border-dashed border-gw-card-border"></div>
                <div class="flex items-center gap-1.5 text-[11px] font-bold text-gw-text-muted italic shrink-0">
                  <i-lucide [img]="CalIcon" size="11"></i-lucide>
                  <span>{{ goal()!.targetDate | date:'MMM d, yyyy' }}</span>
                </div>
              </div>

              <!-- Recommended plan -->
              <div class="bg-gw-primary/5 border border-gw-primary/15 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <i-lucide [img]="ZapIcon" size="12" class="text-gw-primary shrink-0"></i-lucide>
                  <p class="text-[11px] font-black uppercase tracking-widest text-gw-primary italic">
                    Recommended Plan
                  </p>
                </div>
                <p class="text-xs font-semibold text-gw-text italic leading-relaxed">
                  {{ goal()!.recommendedPlan }}
                </p>
              </div>

            </div>

            <!-- Change goal footer -->
            <div class="px-5 pb-5">
              <button (click)="showForm.set(true)"
                class="w-full py-2.5 border border-gw-card-border rounded-xl
                       text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic
                       hover:border-gw-primary hover:text-gw-primary transition-all">
                Change Goal
              </button>
            </div>
          </div>
        }

        <!-- ── Goal Setup Form ───────────────────────────────────────── -->
        @if (!goal()?.hasActiveGoal || showForm()) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

            <!-- Card header -->
            <div class="px-5 py-4 border-b border-gw-bg">
              <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">
                {{ goal()?.hasActiveGoal ? 'Change Goal' : 'Set Your Practice Goal' }}
              </p>
              <h3 class="text-lg font-black text-gw-text italic mt-0.5">
                What do you want to achieve?
              </h3>
            </div>

            <div class="p-5 space-y-5">

              <!-- Goal type grid -->
              <div class="grid grid-cols-2 gap-3">
                @for (opt of goalOptions; track opt.value) {
                  <button (click)="selectedGoalType.set(opt.value)"
                    class="p-4 rounded-2xl border-2 text-left transition-all duration-200"
                    [class.border-gw-primary]="    selectedGoalType() === opt.value"
                    [class.border-gw-card-border]="selectedGoalType() !== opt.value"
                    [class.bg-white]="             selectedGoalType() !== opt.value"
                    [ngClass]="{'bg-gw-primary/5': selectedGoalType() === opt.value}"
                    [attr.aria-pressed]="selectedGoalType() === opt.value">

                    <!-- Icon chip -->
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center mb-3
                                transition-all duration-200"
                      [class.bg-gw-primary]="selectedGoalType() === opt.value"
                      [class.bg-gw-bg]="    selectedGoalType() !== opt.value">
                      <i-lucide [img]="opt.icon" size="14"
                        [class.text-white]="        selectedGoalType() === opt.value"
                        [class.text-gw-text-muted]="selectedGoalType() !== opt.value">
                      </i-lucide>
                    </div>

                    <p class="text-[11px] font-black uppercase tracking-wider italic leading-none"
                      [class.text-gw-primary]="selectedGoalType() === opt.value"
                      [class.text-gw-text]="   selectedGoalType() !== opt.value">
                      {{ opt.label }}
                    </p>
                    <p class="text-[11px] text-gw-text-muted italic mt-1.5 leading-relaxed">
                      {{ opt.desc }}
                    </p>
                  </button>
                }
              </div>

              <!-- Timeline selector -->
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic mb-2">
                  Timeline
                </p>
                <div class="grid grid-cols-3 gap-2">
                  @for (opt of timelineOptions; track opt.value) {
                    <button (click)="selectedWeeks.set(opt.value)"
                      class="py-3 px-2 rounded-xl border text-center transition-all duration-200"
                      [class.bg-gw-primary]="       selectedWeeks() === opt.value"
                      [class.border-gw-primary]="   selectedWeeks() === opt.value"
                      [class.bg-white]="             selectedWeeks() !== opt.value"
                      [class.border-gw-card-border]="selectedWeeks() !== opt.value"
                      [attr.aria-pressed]="selectedWeeks() === opt.value">
                      <p class="text-sm font-black italic leading-none"
                        [class.text-white]="   selectedWeeks() === opt.value"
                        [class.text-gw-text]=" selectedWeeks() !== opt.value">
                        {{ opt.value }}w
                      </p>
                      <p class="text-[11px] font-semibold italic mt-1 leading-none"
                        [ngClass]="{'text-white/70':     selectedWeeks() === opt.value,
                                    'text-gw-text-muted': selectedWeeks() !== opt.value}">
                        {{ opt.sublabel }}
                      </p>
                    </button>
                  }
                </div>
              </div>

              <!-- Submit CTA -->
              <button (click)="setGoal()" [disabled]="!selectedGoalType() || isSaving()"
                class="w-full py-4 bg-gw-primary text-white font-black text-[11px]
                       uppercase tracking-widest italic rounded-xl hover:opacity-90
                       transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                @if (isSaving()) {
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting Goal...</span>
                } @else {
                  <i-lucide [img]="TargetIcon" size="14"></i-lucide>
                  <span>Set Goal</span>
                }
              </button>

              <!-- Cancel — only when changing an existing goal -->
              @if (goal()?.hasActiveGoal) {
                <button (click)="showForm.set(false)"
                  class="w-full py-2 text-[11px] font-bold text-gw-text-muted italic
                         hover:text-gw-text transition-colors">
                  Cancel
                </button>
              }

            </div>
          </div>
        }

        <!-- ── Quick Links ───────────────────────────────────────────── -->
        <button type="button" (click)="goToLearningPath()"
          class="flex items-center justify-between w-full bg-white rounded-2xl border border-gw-card-border
                 shadow-sm p-4 hover:border-gw-primary transition-all group text-left">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
              <i-lucide [img]="ZapIcon" size="16" class="text-gw-primary"></i-lucide>
            </div>
            <div>
              <p class="text-[11px] font-black uppercase tracking-wider text-gw-text italic
                         group-hover:text-gw-primary transition-colors">
                View Guided Learning Path
              </p>
              <p class="text-[11px] text-gw-text-muted italic mt-0.5">
                Recommended sessions based on your goal
              </p>
            </div>
          </div>
          <i-lucide [img]="ArrowIcon" size="15" class="text-gw-text-muted shrink-0"></i-lucide>
        </button>

      }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LearningGoalsComponent implements OnInit {
  private userService = inject(UserService);
  private router      = inject(Router);

  // ── Icons ──────────────────────────────────────────────────────────
  readonly TargetIcon = Target;
  readonly UpIcon     = TrendingUp;
  readonly DownIcon   = TrendingDown;
  readonly StableIcon = Minus;
  readonly CheckIcon  = CheckCircle2;
  readonly CalIcon    = Calendar;
  readonly ZapIcon    = Zap;
  readonly AlertIcon  = AlertCircle;
  readonly ArrowIcon  = ArrowRight;

  // ── State ──────────────────────────────────────────────────────────
  goal             = signal<GoalProgress | null>(null);
  isLoading        = signal(true);
  isSaving         = signal(false);
  showForm         = signal(false);
  selectedGoalType = signal<string>('');
  selectedWeeks    = signal<number>(4);
  hasError         = signal(false);

  // ── Data ───────────────────────────────────────────────────────────
  goalOptions = [
    { value: 'interview',  label: 'Job Interview',    desc: 'Professional English for interviews', icon: Target   },
    { value: 'grammar',    label: 'Better Grammar',   desc: 'Fix recurring grammar mistakes',      icon: BookOpen },
    { value: 'vocabulary', label: 'Build Vocabulary', desc: 'Learn new words every session',       icon: Book     },
    { value: 'fluency',    label: 'Speak Fluently',   desc: 'Build natural speaking confidence',   icon: Zap      }
  ];

  timelineOptions = [
    { value: 2, sublabel: 'Quick sprint' },
    { value: 4, sublabel: 'Steady pace'  },
    { value: 8, sublabel: 'Deep work'    }
  ];

  // ── Helpers ────────────────────────────────────────────────────────
  trendIcon() {
    const t = this.goal()?.trendLabel;
    if (t === 'Improving') return TrendingUp;
    if (t === 'Declining') return TrendingDown;
    return Minus;
  }

  scoreDelta(): number {
    const g = this.goal();
    if (!g) return 0;
    return Math.round(g.currentScore - g.startingScore);
  }

  goToLearningPath() {
    this.router.navigate(['/user/dashboard'], { state: { scrollTo: 'recommended-next' } });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit() {
    this.userService.getGoalProgress().pipe(
      catchError(() => {
        this.isLoading.set(false);
        this.hasError.set(true);
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

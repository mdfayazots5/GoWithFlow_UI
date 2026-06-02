import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { LucideAngularModule, TrendingUp, TrendingDown, Minus, Target, AlertCircle, BarChart2, BookOpen, Volume2 } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface InterviewSessionTimeline {
  sessionId: number;
  sessionDate: string;
  readinessScore: number;
  fluencyScore: number;
  confidenceScore: number;
  mistakeCount: number;
}

interface InterviewGrammarWeakness {
  grammarTag: string;
  errorCount: number;
}

interface InterviewFocusWord {
  focusWord: string;
  timesSpoken: number;
  timesCorrect: number;
  correctRate: number;
}

interface InterviewPerformanceDashboard {
  hasData: boolean;
  interviewReadinessScore: number;
  readinessTrend: string;
  totalMockSessions: number;
  sessionTimeline: InterviewSessionTimeline[];
  topGrammarErrors: InterviewGrammarWeakness[];
  focusWordPerformance: InterviewFocusWord[];
  answerLengthTrend: string;
  avgAnswerSpeedWpm: number;
  recommendedScriptId: number;
  recommendedScriptTitle: string;
  recommendedScriptReason: string;
}

@Component({
  selector: 'app-interview-performance',
  standalone: true,
  imports: [CommonModule, DecimalPipe, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div>
        <h1 class="text-xl font-black text-gw-text tracking-tight">Interview Performance</h1>
        <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Mock interview readiness tracker</p>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading interview data...</p>
        </div>
      }

      @else if (!data() || !data()!.hasData) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="TargetIcon" size="32" class="text-gw-text-muted"></i-lucide>
          </div>
          <div>
            <p class="text-base font-black text-gw-text italic">No Mock Interview sessions yet</p>
            <p class="text-sm text-gw-text-muted italic mt-1">Complete at least one Mock Interview session to see your performance dashboard.</p>
          </div>
          <a routerLink="/scripts"
            class="px-5 py-2.5 bg-gw-primary text-white font-black text-[10px] uppercase tracking-widest italic rounded-xl hover:opacity-90 transition-all">
            Browse Mock Interview Scripts
          </a>
        </div>
      }

      @else if (data()) {
        <!-- Readiness Score Card -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Interview Readiness Score</p>
              <div class="flex items-end gap-3 mt-1">
                <span class="text-5xl font-black italic"
                  [class.text-gw-success]="data()!.interviewReadinessScore >= 75"
                  [class.text-amber-500]="data()!.interviewReadinessScore >= 50 && data()!.interviewReadinessScore < 75"
                  [class.text-gw-error]="data()!.interviewReadinessScore < 50">
                  {{ data()!.interviewReadinessScore | number:'1.0-0' }}
                </span>
                <span class="text-sm font-black text-gw-text-muted mb-1 italic">/ 100</span>
              </div>
              <p class="text-[10px] font-semibold text-gw-text-muted mt-1 italic">Based on last 5 sessions · {{ data()!.totalMockSessions }} total</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                [ngClass]="{
                  'bg-gw-success/10': data()!.readinessTrend === 'Improving',
                  'bg-amber-50': data()!.readinessTrend === 'Stable',
                  'bg-gw-error/10': data()!.readinessTrend === 'Declining'
                }">
                <i-lucide [img]="trendIcon()" size="14"
                  [class.text-gw-success]="data()!.readinessTrend === 'Improving'"
                  [class.text-amber-500]="data()!.readinessTrend === 'Stable'"
                  [class.text-gw-error]="data()!.readinessTrend === 'Declining'"></i-lucide>
                <span class="text-[9px] font-black uppercase tracking-wider italic"
                  [class.text-gw-success]="data()!.readinessTrend === 'Improving'"
                  [class.text-amber-500]="data()!.readinessTrend === 'Stable'"
                  [class.text-gw-error]="data()!.readinessTrend === 'Declining'">
                  {{ data()!.readinessTrend }}
                </span>
              </div>
            </div>
          </div>

          <!-- Score breakdown bar -->
          <div class="mt-5 h-3 bg-gw-bg rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
              [style.width.%]="data()!.interviewReadinessScore"
              [class.bg-gw-success]="data()!.interviewReadinessScore >= 75"
              [class.bg-amber-400]="data()!.interviewReadinessScore >= 50 && data()!.interviewReadinessScore < 75"
              [class.bg-gw-error]="data()!.interviewReadinessScore < 50">
            </div>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[8px] font-bold text-gw-text-muted italic">Needs Work</span>
            <span class="text-[8px] font-bold text-gw-text-muted italic">Interview Ready</span>
          </div>
        </div>

        <!-- Session Timeline -->
        @if (data()!.sessionTimeline.length > 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-gw-bg flex items-center gap-2">
              <i-lucide [img]="ChartIcon" size="14" class="text-gw-text-muted"></i-lucide>
              <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Session Timeline</p>
            </div>
            <div class="px-5 py-4">
              <!-- Mini sparkline using flex bars -->
              <div class="flex items-end gap-1.5 h-16">
                @for (session of data()!.sessionTimeline; track session.sessionId) {
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full rounded-t-sm transition-all duration-500 min-h-[4px]"
                      [style.height.%]="session.readinessScore"
                      [class.bg-gw-success]="session.readinessScore >= 75"
                      [class.bg-amber-400]="session.readinessScore >= 50 && session.readinessScore < 75"
                      [class.bg-gw-error]="session.readinessScore < 50">
                    </div>
                  </div>
                }
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[8px] font-bold text-gw-text-muted italic">Earliest</span>
                <span class="text-[8px] font-bold text-gw-text-muted italic">Latest</span>
              </div>
            </div>
            <div class="divide-y divide-gw-bg">
              @for (session of data()!.sessionTimeline.slice().reverse().slice(0, 5); track session.sessionId) {
                <div class="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[9px] font-bold text-gw-text-muted italic">{{ session.sessionDate | date:'MMM d, yyyy' }}</p>
                    <p class="text-xs font-black text-gw-text italic mt-0.5">
                      Fluency {{ session.fluencyScore | number:'1.0-0' }} · Confidence {{ session.confidenceScore | number:'1.0-0' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-black italic"
                      [class.text-gw-success]="session.readinessScore >= 75"
                      [class.text-amber-500]="session.readinessScore >= 50 && session.readinessScore < 75"
                      [class.text-gw-error]="session.readinessScore < 50">
                      {{ session.readinessScore | number:'1.0-0' }}
                    </span>
                    <p class="text-[8px] font-bold text-gw-text-muted italic">{{ session.mistakeCount }} errors</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Strength / Weakness Grid -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Grammar weaknesses -->
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-gw-bg">
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Grammar Errors</p>
            </div>
            <div class="divide-y divide-gw-bg">
              @if (data()!.topGrammarErrors.length === 0) {
                <p class="px-4 py-3 text-[10px] text-gw-text-muted italic">No errors recorded.</p>
              }
              @for (err of data()!.topGrammarErrors; track err.grammarTag) {
                <div class="px-4 py-2.5">
                  <p class="text-[9px] font-black text-gw-text italic truncate">{{ err.grammarTag }}</p>
                  <p class="text-[8px] font-bold text-gw-error mt-0.5">{{ err.errorCount }} errors</p>
                </div>
              }
            </div>
          </div>

          <!-- Answer speed -->
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col justify-between">
            <div>
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Avg Answer Speed</p>
              <p class="text-3xl font-black text-gw-primary italic mt-1">{{ data()!.avgAnswerSpeedWpm | number:'1.0-0' }}</p>
              <p class="text-[8px] font-bold text-gw-text-muted italic">words per min</p>
            </div>
            <div class="flex items-center gap-1 mt-3">
              <i-lucide [img]="speedTrendIcon()" size="12"
                [class.text-gw-success]="data()!.answerLengthTrend === 'Improving'"
                [class.text-amber-500]="data()!.answerLengthTrend === 'Stable'"
                [class.text-gw-error]="data()!.answerLengthTrend === 'Declining'"></i-lucide>
              <span class="text-[8px] font-black uppercase tracking-wider italic"
                [class.text-gw-success]="data()!.answerLengthTrend === 'Improving'"
                [class.text-amber-500]="data()!.answerLengthTrend === 'Stable'"
                [class.text-gw-error]="data()!.answerLengthTrend === 'Declining'">
                {{ data()!.answerLengthTrend }}
              </span>
            </div>
          </div>
        </div>

        <!-- Focus Word Performance -->
        @if (data()!.focusWordPerformance.length > 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-gw-bg flex items-center gap-2">
              <i-lucide [img]="VolumeIcon" size="14" class="text-gw-text-muted"></i-lucide>
              <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Professional Vocabulary</p>
            </div>
            <div class="divide-y divide-gw-bg">
              @for (word of data()!.focusWordPerformance; track word.focusWord) {
                <div class="px-5 py-3 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <span class="font-black text-gw-text italic uppercase tracking-wide">{{ word.focusWord }}</span>
                    <p class="text-[9px] font-semibold text-gw-text-muted mt-0.5">{{ word.timesCorrect }} / {{ word.timesSpoken }} correct</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="h-1.5 w-16 bg-gw-bg rounded-full overflow-hidden">
                      <div class="h-full rounded-full"
                        [style.width.%]="word.correctRate"
                        [class.bg-gw-success]="word.correctRate >= 70"
                        [class.bg-amber-400]="word.correctRate >= 40 && word.correctRate < 70"
                        [class.bg-gw-error]="word.correctRate < 40">
                      </div>
                    </div>
                    <span class="text-[9px] font-black italic"
                      [class.text-gw-success]="word.correctRate >= 70"
                      [class.text-amber-500]="word.correctRate >= 40 && word.correctRate < 70"
                      [class.text-gw-error]="word.correctRate < 40">
                      {{ word.correctRate | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recommended next session -->
        @if (data()!.recommendedScriptId > 0) {
          <div class="bg-gw-primary/5 border border-gw-primary/20 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-2">
              <i-lucide [img]="BookIcon" size="14" class="text-gw-primary flex-shrink-0"></i-lucide>
              <p class="text-[9px] font-black uppercase tracking-widest text-gw-primary italic">Recommended Next Session</p>
            </div>
            <p class="font-black text-gw-text italic">{{ data()!.recommendedScriptTitle }}</p>
            <p class="text-[10px] text-gw-text-muted italic mt-1">{{ data()!.recommendedScriptReason }}</p>
            <a [routerLink]="['/scripts']" [queryParams]="{ scriptId: data()!.recommendedScriptId }"
              class="mt-3 inline-block px-4 py-2 bg-gw-primary text-white font-black text-[9px] uppercase tracking-widest italic rounded-xl hover:opacity-90 transition-all">
              View Script
            </a>
          </div>
        }
      }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class InterviewPerformanceComponent implements OnInit {
  private userService = inject(UserService);

  readonly TargetIcon  = Target;
  readonly AlertIcon   = AlertCircle;
  readonly ChartIcon   = BarChart2;
  readonly BookIcon    = BookOpen;
  readonly VolumeIcon  = Volume2;
  readonly UpIcon      = TrendingUp;
  readonly DownIcon    = TrendingDown;
  readonly StableIcon  = Minus;

  data      = signal<InterviewPerformanceDashboard | null>(null);
  isLoading = signal(true);

  trendIcon = computed(() => {
    const trend = this.data()?.readinessTrend;
    if (trend === 'Improving') return TrendingUp;
    if (trend === 'Declining') return TrendingDown;
    return Minus;
  });

  speedTrendIcon = computed(() => {
    const trend = this.data()?.answerLengthTrend;
    if (trend === 'Improving') return TrendingUp;
    if (trend === 'Declining') return TrendingDown;
    return Minus;
  });

  ngOnInit() {
    this.userService.getInterviewPerformanceDashboard().pipe(
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      this.data.set(data);
      this.isLoading.set(false);
    });
  }
}

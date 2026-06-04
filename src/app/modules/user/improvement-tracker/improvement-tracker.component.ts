// File: src/app/modules/user/improvement-tracker/improvement-tracker.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { MistakeService } from '../mistake.service';
import { ImprovementData } from '@core/models/user.model';
import { LucideAngularModule, TrendingUp, TrendingDown, Minus, Award, Clock, Target, Flame, ChevronRight, Zap, Info, Calendar, BookOpen, Star } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-improvement-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 gwf-page-bottom space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div>
        <h1 class="text-xl font-black text-gw-text tracking-tight">Progress Journey</h1>
        <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Your path to English fluency</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3 mt-0">
        @for (stat of trackerStats; track stat.label) {
          <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div class="absolute -right-3 -bottom-3 opacity-[0.06]">
              <i-lucide [img]="stat.icon" size="72"></i-lucide>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                   [style.background]="stat.bg">
                <i-lucide [img]="stat.icon" size="14" [style.color]="stat.color"></i-lucide>
              </div>
              <span class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">{{ stat.label }}</span>
            </div>
            <p class="text-2xl font-black text-gw-text tracking-tight leading-none">{{ stat.value }}</p>
          </div>
        }
      </div>

      <!-- Score Trend -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-accent pl-3">Score Trend</h3>
          <span class="text-[11px] font-bold text-gw-text-muted uppercase bg-gw-bg px-2 py-1 rounded-lg">Last 10 Sessions</span>
        </div>

        @if ((data()?.recentSessions?.length ?? 0) === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border p-10 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 bg-gw-bg rounded-2xl flex items-center justify-center">
              <i-lucide [img]="TrendingIcon" size="24" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No sessions yet</p>
            <p class="text-xs text-gw-text-muted">Complete a session to see your score trend here.</p>
          </div>
        } @else {
          <div class="bg-white rounded-2xl border border-gw-card-border overflow-hidden shadow-sm divide-y divide-gw-bg">
            @for (point of data()?.recentSessions; track point.sessionDate) {
              <div class="flex items-center gap-4 px-5 py-4 hover:bg-gw-bg/40 transition-colors">

                <!-- Left accent bar -->
                <div class="w-1 h-10 rounded-full shrink-0"
                     [style.background]="scoreAccent(point.fluencyScore)"></div>

                <!-- Date -->
                <div class="w-14 shrink-0 text-center">
                  <p class="text-[11px] font-black text-gw-text leading-none">{{ point.sessionDate | date:'MMM d' }}</p>
                  <p class="text-[11px] text-gw-text-muted mt-0.5">{{ point.sessionDate | date:'h:mm a' }}</p>
                </div>

                <!-- Session name -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gw-text truncate">{{ point.sessionName }}</p>
                  @if (point.mistakeCount > 0) {
                    <p class="text-[11px] text-gw-text-muted mt-0.5">{{ point.mistakeCount }} mistake{{ point.mistakeCount !== 1 ? 's' : '' }}</p>
                  }
                </div>

                <!-- Scores -->
                <div class="flex items-center gap-2 shrink-0">
                  @if (point.fluencyScore > 0) {
                    <div class="text-center">
                      <span class="inline-block px-2 py-1 rounded-lg text-[11px] font-black"
                            [style.background]="scoreBg(point.fluencyScore)"
                            [style.color]="scoreColor(point.fluencyScore)">
                        {{ point.fluencyScore | number:'1.0-0' }}%
                      </span>
                      <p class="text-[11px] text-gw-text-muted mt-0.5 text-center">Fluency</p>
                    </div>
                  } @else {
                    <div class="text-center">
                      <span class="inline-block px-2 py-1 rounded-lg text-[11px] font-bold bg-gw-bg text-gw-text-muted">—</span>
                      <p class="text-[11px] text-gw-text-muted mt-0.5 text-center">Fluency</p>
                    </div>
                  }
                  @if (point.confidenceScore > 0) {
                    <div class="text-center">
                      <span class="inline-block px-2 py-1 rounded-lg text-[11px] font-black bg-blue-50 text-blue-600">
                        {{ point.confidenceScore | number:'1.0-0' }}%
                      </span>
                      <p class="text-[11px] text-gw-text-muted mt-0.5 text-center">Confidence</p>
                    </div>
                  } @else {
                    <div class="text-center">
                      <span class="inline-block px-2 py-1 rounded-lg text-[11px] font-bold bg-gw-bg text-gw-text-muted">—</span>
                      <p class="text-[11px] text-gw-text-muted mt-0.5 text-center">Confidence</p>
                    </div>
                  }
                </div>

              </div>
            }
          </div>
        }
      </div>

      <!-- Grammar Focus -->
      <div class="space-y-3">
        <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-primary pl-3">Grammar Focus</h3>

        @if ((data()?.grammarProgress?.length ?? 0) === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border p-8 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 bg-gw-bg rounded-2xl flex items-center justify-center">
              <i-lucide [img]="BookIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No grammar data yet</p>
            <p class="text-xs text-gw-text-muted">Grammar insights appear after your mistakes are tracked.</p>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (grammar of grammarWithTrend(); track grammar.grammarTag) {
              <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm space-y-3"
                [class.border-amber-200]="grammar.trendLabel === 'Regressing'">
                <div class="flex justify-between items-center gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-2 h-2 rounded-full bg-gw-primary flex-shrink-0"></div>
                    <span class="text-xs font-bold text-gw-text uppercase tracking-wide truncate">{{ grammar.grammarTag }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    @if (grammar.trendLabel) {
                      <span class="flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md italic"
                        [ngClass]="{
                          'bg-gw-success/10': grammar.trendLabel === 'Improving',
                          'text-gw-success': grammar.trendLabel === 'Improving',
                          'bg-amber-50': grammar.trendLabel === 'Stable',
                          'text-amber-500': grammar.trendLabel === 'Stable',
                          'bg-gw-error/10': grammar.trendLabel === 'Regressing',
                          'text-gw-error': grammar.trendLabel === 'Regressing'
                        }">
                        {{ grammar.trendLabel }}
                      </span>
                    }
                    <span class="text-[11px] font-semibold text-gw-text-muted bg-gw-bg px-2 py-1 rounded-lg">
                      {{ grammar.resolvedMistakes }}/{{ grammar.totalMistakes }}
                    </span>
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="h-2 w-full bg-gw-bg rounded-full overflow-hidden">
                    <div class="h-full bg-gw-primary rounded-full transition-all duration-700"
                         [style.width.%]="grammar.progressBarValue"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] text-gw-text-muted">{{ grammar.improvementPercent }}% resolved</p>
                    @if (grammar.trendLabel && grammar.currentPeriodAvg > 0) {
                      <p class="text-[11px] italic"
                        [class.text-gw-success]="grammar.trendLabel === 'Improving'"
                        [class.text-amber-500]="grammar.trendLabel === 'Stable'"
                        [class.text-gw-error]="grammar.trendLabel === 'Regressing'">
                        {{ grammar.currentPeriodAvg | number:'1.1-1' }} errors/session (4wk avg)
                      </p>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Badges Earned -->
      <div class="space-y-3">
        <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-warning pl-3">Badges Earned</h3>

        @if (badges().length === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border p-8 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <i-lucide [img]="StarIcon" size="22" class="text-gw-warning"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No badges yet</p>
            <p class="text-xs text-gw-text-muted">Complete sessions and fix mistakes to earn badges.</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            @for (badge of badges(); track badge.id) {
              <div class="p-5 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all"
                   [ngClass]="badge.isEarned
                     ? 'bg-white border-gw-card-border shadow-sm'
                     : 'bg-gw-bg border-transparent opacity-50'">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                     [ngClass]="badge.isEarned ? 'bg-amber-50' : 'bg-white/60'">
                  <i-lucide [img]="StarIcon" size="24" class="text-gw-warning"></i-lucide>
                </div>
                <div class="space-y-1">
                  <p class="text-[11px] font-black uppercase tracking-wide text-gw-text">{{ badge.name }}</p>
                  <p class="text-[11px] text-gw-text-muted leading-snug">{{ badge.description }}</p>
                </div>
                @if (badge.isEarned) {
                  <span class="text-[11px] font-bold text-gw-warning uppercase">Earned {{ badge.earnedDate | date:'MMM yyyy' }}</span>
                } @else {
                  <span class="text-[11px] font-semibold text-gw-text-muted uppercase">Locked</span>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-2 gap-3">
        <a routerLink="/user/interview-performance"
           class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col gap-2 hover:border-gw-primary transition-all group">
          <div class="w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="TargetIcon" size="16" class="text-gw-primary"></i-lucide>
          </div>
          <p class="text-[11px] font-black uppercase tracking-wider text-gw-text italic group-hover:text-gw-primary transition-colors">Interview Performance</p>
          <p class="text-[11px] text-gw-text-muted italic">Readiness score & trends</p>
        </a>
        <a routerLink="/user/vocabulary"
           class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col gap-2 hover:border-gw-primary transition-all group">
          <div class="w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="BookIcon" size="16" class="text-gw-primary"></i-lucide>
          </div>
          <p class="text-[11px] font-black uppercase tracking-wider text-gw-text italic group-hover:text-gw-primary transition-colors">Vocabulary Bank</p>
          <p class="text-[11px] text-gw-text-muted italic">Words you've practiced</p>
        </a>
        <a routerLink="/user/pronunciation-timeline"
           class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col gap-2 hover:border-gw-primary transition-all group col-span-2">
          <div class="w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="TrendingIcon" size="16" class="text-gw-primary"></i-lucide>
          </div>
          <p class="text-[11px] font-black uppercase tracking-wider text-gw-text italic group-hover:text-gw-primary transition-colors">Pronunciation Timeline</p>
          <p class="text-[11px] text-gw-text-muted italic">Problem words & session-by-session history</p>
        </a>
      </div>

      <!-- Repractice History -->
      <div class="space-y-3">
        <h3 class="text-sm font-black text-gw-text uppercase tracking-widest border-l-4 border-gw-text pl-3">Repractice History</h3>

        @if ((data()?.repracticeHistory?.length ?? 0) === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border p-8 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 bg-gw-bg rounded-2xl flex items-center justify-center">
              <i-lucide [img]="ZapIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No repractice yet</p>
            <p class="text-xs text-gw-text-muted">Practice your mistakes to see improvement history here.</p>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (item of data()?.repracticeHistory; track item.repracticeSessionId) {
              <div class="bg-white p-5 rounded-2xl border border-gw-card-border flex items-center justify-between group hover:border-gw-primary transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gw-bg rounded-xl flex items-center justify-center group-hover:bg-gw-primary/10 transition-colors">
                    <i-lucide [img]="ZapIcon" size="16" class="text-gw-text-muted group-hover:text-gw-primary transition-colors"></i-lucide>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-gw-text uppercase tracking-tight">Session #{{ item.sourceSessionId }}</p>
                    <p class="text-[11px] text-gw-text-muted mt-0.5">
                      {{ item.generatedDate | date:'MMM d, yyyy' }} · {{ item.completedRounds }}/{{ item.totalMistakes }} rounds
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black"
                     [class.text-gw-success]="item.improvementPercent > 0"
                     [class.text-gw-text-muted]="item.improvementPercent === 0">
                    {{ item.improvementPercent > 0 ? '+' : '' }}{{ item.improvementPercent }}%
                  </p>
                  <p class="text-[11px] font-semibold uppercase"
                     [class.text-gw-success]="item.improvementPercent > 0"
                     [class.text-gw-text-muted]="item.improvementPercent === 0">
                    {{ item.status }}
                  </p>
                </div>
              </div>
            }
          </div>
        }
      </div>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ImprovementTrackerComponent implements OnInit {
  private userService = inject(UserService);
  private mistakeService = inject(MistakeService);

  readonly TrendingIcon  = TrendingUp;
  readonly TrendDownIcon = TrendingDown;
  readonly StableIcon    = Minus;
  readonly AwardIcon     = Award;
  readonly ClockIcon     = Clock;
  readonly TargetIcon    = Target;
  readonly FlameIcon     = Flame;
  readonly ZapIcon       = Zap;
  readonly StarIcon      = Star;
  readonly BookIcon      = BookOpen;

  data             = signal<ImprovementData | null>(null);
  badges           = signal<any[]>([]);
  grammarWithTrend = signal<any[]>([]);
  trackerStats: any[] = [];

  ngOnInit() {
    this.loadData();
    this.loadGrammarTrends();
  }

  private loadGrammarTrends() {
    this.mistakeService.getGrammarProgressWithTrend().pipe(catchError(() => of([]))).subscribe(trends => {
      this.grammarWithTrend.set(trends ?? []);
    });
  }

  loadData() {
    this.userService.getImprovementData().subscribe(res => {
      this.data.set(res);
      // Only populate grammarWithTrend from base data if trend call is still pending
      if (this.grammarWithTrend().length === 0 && res.grammarProgress?.length > 0) {
        this.grammarWithTrend.set(res.grammarProgress);
      }
      this.trackerStats = [
        { label: 'Sessions',  value: res.statsHeader.sessionsCompleted,           icon: Award,     bg: '#EEF2FF', color: '#3D5A99' },
        { label: 'Avg Score', value: res.statsHeader.avgScoreThisWeek + '%',       icon: TrendingUp, bg: '#ECFDF5', color: '#2E7D32' },
        { label: 'Resolved',  value: res.statsHeader.mistakesResolved,             icon: Target,    bg: '#FFF7ED', color: '#E07B39' },
        { label: 'Streak',    value: res.statsHeader.currentStreak + ' days',      icon: Flame,     bg: '#FFFBEB', color: '#F59E0B' }
      ];
      this.badges.set(res.badgesEarned);
    });
  }

  scoreColor(score: number): string {
    if (score >= 75) return '#2E7D32';
    if (score >= 50) return '#B45309';
    return '#D32F2F';
  }

  scoreBg(score: number): string {
    if (score >= 75) return '#ECFDF5';
    if (score >= 50) return '#FFFBEB';
    return '#FEF2F2';
  }

  scoreAccent(score: number): string {
    if (score >= 75) return '#2E7D32';
    if (score > 0 && score < 75) return '#F59E0B';
    return '#E0E4EC';
  }
}

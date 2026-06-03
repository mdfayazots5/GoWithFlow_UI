// File: src/app/modules/user/dashboard/user-dashboard.component.ts
import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Flame, Zap, Trophy, TrendingUp, PlusCircle,
  Book, ChevronRight, AlertCircle, CheckCircle2,
  X, Calendar, Target, BookOpen, RotateCcw, ArrowRight, Clock, Star
} from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserService } from '@core/services/user.service';
import { MistakeService } from '@core/services/mistake.service';
import { ChallengeService } from '@core/services/challenge.service';
import { SessionService } from '@core/services/session.service';
import { WebsocketService } from '@core/services/websocket.service';
import { RouterLink } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

        <!-- ── Greeting Header ──────────────────────────────────────── -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight leading-tight">
              {{ greeting }}, {{ firstName() }}
            </h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">
              {{ today | date:'EEEE, MMMM d' }}
            </p>
          </div>
          <!-- Streak chip — from cached state, no API call -->
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
               style="background: rgba(245,158,11,0.1);">
            <i-lucide [img]="FlameIcon" size="14" style="color:#F59E0B;"></i-lucide>
            <span class="text-xs font-black" style="color:#F59E0B;">
              {{ dashboard()?.currentStreak || 0 }} Day Streak
            </span>
          </div>
        </div>

        <!-- ── Quick Actions ─────────────────────────────────────────── -->
        <div class="grid grid-cols-3 gap-2.5">

          <a routerLink="/session/create"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(224,123,57,0.08);">
              <i-lucide [img]="AddIcon" size="20" style="color:#E07B39;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Create
            </span>
          </a>

          <a routerLink="/scripts"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(46,125,50,0.08);">
              <i-lucide [img]="BookIcon" size="20" style="color:#2E7D32;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Scripts
            </span>
          </a>

          <a routerLink="/user/progress"
             class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center gap-2 py-4 px-2
                    hover:border-gw-primary hover:shadow-md
                    active:scale-95 transition-all no-underline">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                 style="background: rgba(245,158,11,0.08);">
              <i-lucide [img]="TrendIcon" size="20" style="color:#F59E0B;"></i-lucide>
            </div>
            <span class="text-[10px] font-black text-gw-text uppercase tracking-wide text-center leading-tight">
              Progress
            </span>
          </a>

        </div>

        <!-- ── Pending Invitations Banner ──────────────────────────── -->
        @if (pendingInvitationCount() > 0) {
          <a routerLink="/user/invitations"
             class="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl no-underline
                    animate-in slide-in-from-top-2 duration-300"
             style="background: linear-gradient(135deg, rgba(61,90,153,0.08), rgba(224,123,57,0.06));
                    border: 1px solid rgba(61,90,153,0.15);">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-gw-primary flex items-center justify-center shrink-0">
                <span class="text-xs font-black text-white">{{ pendingInvitationCount() }}</span>
              </div>
              <div>
                <p class="text-sm font-black text-gw-text">
                  {{ pendingInvitationCount() === 1 ? '1 session invitation' : pendingInvitationCount() + ' session invitations' }}
                </p>
                <p class="text-[10px] text-gw-text-muted italic">Tap to view and respond</p>
              </div>
            </div>
            <i-lucide [img]="ChevronIcon" size="16" class="text-gw-primary shrink-0"></i-lucide>
          </a>
        }

        <!-- ── Weekly Report Card (shown once per week, dismissible) ── -->
        @if (showWeeklyReport() && weeklyReport()) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div class="flex items-center justify-between px-5 py-3 border-b border-gw-bg">
              <div class="flex items-center gap-2">
                <i-lucide [img]="CalendarIcon" size="14" class="text-gw-primary flex-shrink-0"></i-lucide>
                <p class="text-[10px] font-black text-gw-primary uppercase tracking-widest italic">This Week's Report</p>
              </div>
              <button (click)="dismissWeeklyReport()" class="text-gw-text-muted hover:text-gw-text transition-colors">
                <i-lucide [img]="CloseIcon" size="16"></i-lucide>
              </button>
            </div>

            @if (weeklyReport()!.isReengagement) {
              <div class="px-5 py-4 space-y-2">
                <p class="text-sm font-bold text-gw-text italic">You haven't practiced this week.</p>
                @if (weeklyReport()!.lastSessionDate) {
                  <p class="text-xs text-gw-text-muted italic">Last session: {{ weeklyReport()!.lastSessionDate | date:'MMM d' }}</p>
                }
                @if (weeklyReport()!.recommendedScript1Id) {
                  <a [routerLink]="['/scripts/prepare', weeklyReport()!.recommendedScript1Id]"
                     class="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black text-gw-primary uppercase tracking-widest italic hover:underline">
                    Pick up where you left off <i-lucide [img]="ArrowIcon" size="12"></i-lucide>
                  </a>
                }
              </div>
            } @else {
              <div class="px-5 py-4 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div class="text-center">
                    <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Sessions</p>
                    <p class="text-xl font-black text-gw-text italic">{{ weeklyReport()!.sessionsThisWeek }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Practice</p>
                    <p class="text-xl font-black text-gw-text italic">{{ weeklyReport()!.practiceMinutesThisWeek }}m</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Errors</p>
                    <p class="text-xl font-black text-gw-text italic">{{ weeklyReport()!.errorsDetectedThisWeek }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Resolved</p>
                    <p class="text-xl font-black text-gw-success italic">{{ weeklyReport()!.errorsResolvedThisWeek }}</p>
                  </div>
                </div>
                @if (weeklyReport()!.topImprovementMetric) {
                  <div class="px-3 py-2 bg-gw-success/5 border border-gw-success/20 rounded-xl">
                    <p class="text-[9px] font-bold text-gw-success italic">{{ weeklyReport()!.topImprovementMetric }}</p>
                  </div>
                }
                @if (weeklyReport()!.weakestGrammarTag) {
                  <p class="text-[9px] text-gw-text-muted italic">
                    Work on: <span class="font-black text-gw-text">{{ weeklyReport()!.weakestGrammarTag }}</span>
                  </p>
                }
              </div>
            }
          </div>
        }

        <!-- ── Weekly Challenge Banner ──────────────────────────────── -->
        @if (activeChallenge()?.hasActiveChallenge) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="flex items-center gap-2 px-5 py-3 border-b border-gw-bg"
                 style="background: linear-gradient(135deg, rgba(61,90,153,0.04), rgba(224,123,57,0.04))">
              <i-lucide [img]="StarIcon" size="14" class="text-amber-500 flex-shrink-0"></i-lucide>
              <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest italic">Weekly Challenge</p>
              <span class="ml-auto text-[9px] font-bold text-gw-text-muted">{{ activeChallenge()!.daysRemaining }} days left</span>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div>
                <p class="text-sm font-black text-gw-text">{{ activeChallenge()!.scriptTitle }}</p>
                <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-wide mt-0.5">
                  {{ activeChallenge()!.category }} · Level {{ activeChallenge()!.complexityLevel }}
                </p>
              </div>
              @if (activeChallenge()!.userBestScore > 0) {
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">Your best:</span>
                  <span class="text-sm font-black text-gw-primary">{{ activeChallenge()!.userBestScore | number:'1.0-1' }}%</span>
                </div>
              }
              @if (activeChallenge()!.leaderboard?.length) {
                <div class="space-y-1">
                  @for (entry of activeChallenge()!.leaderboard.slice(0,3); track entry.rank) {
                    <div class="flex items-center gap-2 text-[10px]">
                      <span class="w-4 font-black text-gw-text-muted text-right">{{ entry.rank }}.</span>
                      <span class="flex-1 font-semibold text-gw-text truncate">{{ entry.fullName }}</span>
                      <span class="font-black text-gw-primary">{{ entry.bestScore | number:'1.0-1' }}%</span>
                    </div>
                  }
                </div>
              }
              <a [routerLink]="['/scripts']" [queryParams]="{ scriptId: activeChallenge()!.scriptId }"
                 class="flex items-center justify-center gap-2 h-9 w-full bg-gw-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity no-underline">
                {{ activeChallenge()!.userAttemptCount > 0 ? 'Try Again' : 'Accept Challenge' }}
                <i-lucide [img]="ArrowIcon" size="12"></i-lucide>
              </a>
            </div>
          </div>
        }

        <!-- ── Goal Progress Panel ──────────────────────────────────── -->
        @if (goalProgress()?.hasActiveGoal) {
          <a routerLink="/user/goals"
             class="block bg-white rounded-2xl border border-gw-card-border shadow-sm p-5 hover:border-gw-primary transition-all group no-underline">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted italic">Active Goal</p>
                <p class="text-sm font-black text-gw-text italic mt-0.5">{{ goalProgress()!.goalLabel }}</p>
              </div>
              <span class="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg italic flex-shrink-0"
                [ngClass]="{
                  'bg-gw-success/10': goalProgress()!.trendLabel === 'Improving',
                  'text-gw-success': goalProgress()!.trendLabel === 'Improving',
                  'bg-amber-50': goalProgress()!.trendLabel === 'Stable',
                  'text-amber-500': goalProgress()!.trendLabel === 'Stable',
                  'bg-gw-error/10': goalProgress()!.trendLabel === 'Declining',
                  'text-gw-error': goalProgress()!.trendLabel === 'Declining'
                }">
                {{ goalProgress()!.trendLabel }}
              </span>
            </div>
            <div class="h-2 bg-gw-bg rounded-full overflow-hidden mb-1.5">
              <div class="h-full bg-gw-primary rounded-full transition-all duration-700"
                [style.width.%]="goalProgress()!.progressPercent">
              </div>
            </div>
            <div class="flex items-center justify-between text-[8px] font-bold text-gw-text-muted italic">
              <span>{{ goalProgress()!.sessionsCompleted }}/{{ goalProgress()!.sessionsTarget }} sessions</span>
              <span>{{ goalProgress()!.estimatedWeeksRemaining }} weeks remaining</span>
            </div>
          </a>
        } @else {
          <a routerLink="/user/goals"
             class="block bg-gw-bg border border-dashed border-gw-card-border rounded-2xl p-4 text-center hover:border-gw-primary transition-all group no-underline">
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic group-hover:text-gw-primary">Set a Learning Goal →</p>
          </a>
        }

        <!-- ── Guided Learning Path ─────────────────────────────────── -->
        @if ((learningPath()?.recommendations?.length || 0) > 0) {
          <div id="recommended-next"
            class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors duration-500"
            [class.border-gw-primary]="highlightPath()"
            [class.border-gw-card-border]="!highlightPath()">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
              <div class="flex items-center gap-2">
                <i-lucide [img]="TargetIcon" size="14" class="text-gw-accent flex-shrink-0"></i-lucide>
                <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">Recommended Next</p>
              </div>
            </div>
            <div class="divide-y divide-gw-bg">
              @for (rec of learningPath()!.recommendations; track rec.scriptId) {
                <div class="flex items-start gap-3 px-5 py-4">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       [style.background]="recIconBg(rec.recommendationType)">
                    <i-lucide [img]="recIcon(rec.recommendationType)" size="14"
                              [style.color]="recIconColor(rec.recommendationType)"></i-lucide>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gw-text truncate">{{ rec.scriptTitle }}</p>
                    <p class="text-[9px] font-bold text-gw-text-muted mt-0.5 uppercase tracking-wide">
                      {{ rec.category }} · Level {{ rec.complexityLevel }}
                    </p>
                    <p class="text-[9px] text-gw-text-muted italic mt-1 leading-tight">{{ rec.reasonText }}</p>
                  </div>
                  <a [routerLink]="['/scripts/prepare', rec.scriptId]"
                     class="shrink-0 w-8 h-8 rounded-xl bg-gw-primary/10 flex items-center justify-center text-gw-primary hover:bg-gw-primary hover:text-white transition-all"
                     title="Read script &amp; start session">
                    <i-lucide [img]="ArrowIcon" size="14"></i-lucide>
                  </a>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Pending Repractice Alert ─────────────────────────────── -->
        @if ((dashboard()?.pendingRepracticeCount || 0) > 0) {
          <a routerLink="/user/progress"
             class="flex items-center justify-between gap-3 px-4 py-3.5
                    bg-white rounded-2xl border border-gw-card-border shadow-sm
                    hover:border-gw-primary transition-colors group no-underline">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                   style="background: rgba(61,90,153,0.08);">
                <i-lucide [img]="AlertIcon" size="15" style="color:#3D5A99;"></i-lucide>
              </div>
              <div>
                <p class="text-sm font-bold text-gw-text">Correction rounds waiting</p>
                <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5">
                  {{ dashboard()?.pendingRepracticeCount }} rounds ready to practice
                </p>
              </div>
            </div>
            <div class="w-7 h-7 rounded-lg flex items-center justify-center
                        bg-gw-primary text-white shrink-0 group-hover:opacity-90 transition-opacity">
              <i-lucide [img]="ChevronIcon" size="14"></i-lucide>
            </div>
          </a>
        }

        <!-- ── Reviews Due Today ────────────────────────────────────── -->
        @if ((dueForReview()?.dueCount || 0) > 0) {
          <a routerLink="/user/my-mistakes"
             class="flex items-center justify-between gap-3 px-4 py-3.5
                    bg-white rounded-2xl border border-amber-200 shadow-sm
                    hover:border-amber-400 transition-colors group no-underline">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                   style="background: rgba(245,158,11,0.08);">
                <i-lucide [img]="ClockIcon" size="15" style="color:#F59E0B;"></i-lucide>
              </div>
              <div>
                <p class="text-sm font-bold text-gw-text">Grammar reviews due</p>
                <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5">
                  {{ dueForReview()!.dueCount }} mistake{{ dueForReview()!.dueCount === 1 ? '' : 's' }} ready for spaced review
                </p>
              </div>
            </div>
            <div class="w-7 h-7 rounded-lg flex items-center justify-center
                        shrink-0 group-hover:opacity-90 transition-opacity"
                 style="background: rgba(245,158,11,0.15);">
              <i-lucide [img]="ChevronIcon" size="14" style="color:#F59E0B;"></i-lucide>
            </div>
          </a>
        }


        <!-- ── Recent Sessions ───────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">
              Recent Sessions
            </p>
            <a routerLink="/session/history"
               class="text-[10px] font-bold text-gw-primary hover:underline no-underline">
              View All
            </a>
          </div>

          @if ((dashboard()?.recentSessions?.length || 0) === 0) {
            <div class="flex flex-col items-center justify-center py-8 gap-2">
              <div class="w-10 h-10 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="TrophyIcon" size="18" class="text-gw-text-muted"></i-lucide>
              </div>
              <p class="text-xs font-semibold text-gw-text-muted">No sessions yet</p>
            </div>
          } @else {
            <div class="divide-y divide-gw-bg">
              @for (session of dashboard()?.recentSessions?.slice(0, 3); track session.sessionId) {
                <a [routerLink]="['/session/detail', session.sessionId]"
                   class="flex items-center gap-3 px-5 py-3.5 hover:bg-gw-bg/40 transition-colors no-underline group">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gw-text truncate group-hover:text-gw-primary transition-colors">
                      {{ session.sessionName }}
                    </p>
                    <p class="text-[10px] font-semibold text-gw-text-muted mt-0.5 truncate">
                      {{ session.sessionMode }} · {{ session.duration }}min · {{ session.sessionDate | date:'MMM d, yyyy' }}
                    </p>
                    <p class="text-[9px] text-gw-text-muted/70 mt-0.5 truncate">{{ session.scriptTitle }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold"
                          [style.background]="getScoreBg(session.fluencyScore)"
                          [style.color]="getScoreColor(session.fluencyScore)">
                      {{ session.fluencyScore != null ? (session.fluencyScore | number:'1.0-1') + '%' : '—' }}
                    </span>
                    <span class="text-[8px] font-black uppercase tracking-wider"
                          [style.color]="session.status === 'COMPLETED' ? '#166534' : '#92400E'">
                      {{ session.status }}
                    </span>
                  </div>
                </a>
              }
            </div>
          }
        </div>

        <!-- ── Pending Mistakes ──────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">
              Pending Mistakes
            </p>
            <a routerLink="/user/my-mistakes"
               class="text-[10px] font-bold text-gw-primary hover:underline no-underline">
              View All
            </a>
          </div>

          @if ((dashboard()?.pendingMistakes?.length || 0) === 0) {
            <div class="flex flex-col items-center justify-center py-8 gap-2">
              <div class="w-10 h-10 rounded-2xl bg-gw-bg flex items-center justify-center">
                <i-lucide [img]="CheckIcon" size="18" class="text-gw-text-muted"></i-lucide>
              </div>
              <p class="text-xs font-semibold text-gw-text-muted">No pending mistakes</p>
            </div>
          } @else {
            <div class="divide-y divide-gw-bg">
              @for (mistake of dashboard()?.pendingMistakes?.slice(0, 3); track mistake.mistakeId) {
                <div class="px-5 py-3.5">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0 space-y-1">
                      <!-- Type + grammar tag badges -->
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gw-error/10 text-gw-error">
                          {{ mistake.mistakeType }}
                        </span>
                        @if (mistake.grammarTag) {
                          <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gw-primary/10 text-gw-primary">
                            {{ mistake.grammarTag }}
                          </span>
                        }
                        @if (mistake.contextTag) {
                          <span class="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-gw-bg text-gw-text-muted">
                            {{ mistake.contextTag }}
                          </span>
                        }
                      </div>
                      <!-- What was spoken -->
                      @if (mistake.spokenText) {
                        <p class="text-sm font-semibold text-gw-text truncate">"{{ mistake.spokenText }}"</p>
                      }
                      <!-- Expected utterance -->
                      <p class="text-[10px] text-gw-text-muted truncate">
                        Expected: <span class="font-semibold">{{ mistake.utteranceText }}</span>
                      </p>
                      <!-- Optional detail note -->
                      @if (mistake.mistakeDetail) {
                        <p class="text-[9px] text-gw-text-muted/80 italic truncate">{{ mistake.mistakeDetail }}</p>
                      }
                      <!-- Session / script source -->
                      <p class="text-[9px] text-gw-text-muted/70 truncate">
                        {{ mistake.sessionName }} · {{ mistake.scriptTitle }}
                      </p>
                      <!-- First occurrence date -->
                      <p class="text-[9px] text-gw-text-muted/50">{{ mistake.firstOccurrence | date:'MMM d, yyyy' }}</p>
                    </div>
                    <a routerLink="/user/my-mistakes"
                       class="shrink-0 h-8 px-3 rounded-xl text-[10px] font-bold
                              bg-gw-primary text-white flex items-center mt-0.5
                              hover:opacity-90 transition-opacity no-underline">
                      Practice
                    </a>
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
export class UserDashboardComponent implements OnInit, OnDestroy {
  private auth          = inject(AuthService);
  private userState     = inject(UserStateService);
  private userSvc       = inject(UserService);
  private mistakeSvc    = inject(MistakeService);
  private challengeSvc  = inject(ChallengeService);
  private sessionSvc    = inject(SessionService);
  private wsService     = inject(WebsocketService);

  private invitationSub?: Subscription;

  today = new Date();

  // ── Dashboard state from state service ──────────────────────
  dashboard = this.userState.dashboard;

  // ── Weekly report ────────────────────────────────────────────
  weeklyReport  = signal<any>(null);
  showWeeklyReport = signal(false);

  // ── Learning path ────────────────────────────────────────────
  learningPath  = signal<any>(null);
  highlightPath = signal(false);

  // ── Goal progress ─────────────────────────────────────────────
  goalProgress = signal<any>(null);

  // ── Spaced repetition due reviews ─────────────────────────────
  dueForReview = signal<any>(null);

  // ── Weekly challenge ──────────────────────────────────────────
  activeChallenge = signal<any>(null);

  // ── Pending invitations badge ─────────────────────────────────
  pendingInvitationCount = signal(0);

  firstName = computed(() => {
    const name = this.auth.currentUser?.fullName?.trim();
    return name ? name.split(/\s+/)[0] : 'there';
  });

  readonly FlameIcon   = Flame;
  readonly ZapIcon     = Zap;
  readonly TrophyIcon  = Trophy;
  readonly TrendIcon   = TrendingUp;
  readonly AddIcon     = PlusCircle;
  readonly BookIcon    = Book;
  readonly ChevronIcon = ChevronRight;
  readonly AlertIcon   = AlertCircle;
  readonly CheckIcon   = CheckCircle2;
  readonly CloseIcon   = X;
  readonly CalendarIcon = Calendar;
  readonly TargetIcon   = Target;
  readonly VocabIcon    = BookOpen;
  readonly RepracticeIcon = RotateCcw;
  readonly ArrowIcon    = ArrowRight;
  readonly ClockIcon    = Clock;
  readonly StarIcon     = Star;

  ngOnInit() {
    const scrollTo = (window.history.state as any)?.scrollTo as string | undefined;
    this.loadWeeklyReport();
    this.loadLearningPath(scrollTo);
    this.loadGoalProgress();
    this.loadDueForReview();
    this.loadActiveChallenge();
    this.loadPendingInvitations();
    this.connectForInvitationNotifications();
  }

  ngOnDestroy() {
    this.invitationSub?.unsubscribe();
    this.wsService.disconnect();
  }

  private connectForInvitationNotifications() {
    const userId = localStorage.getItem('gwf_userId') ?? '';
    // Connect to session hub without a sessionId — the server still adds the user
    // to their personal group (user_{userId}) for real-time invitation delivery.
    this.wsService.connect(null, userId, 'session');

    this.invitationSub = this.wsService.on('INVITATION_RECEIVED').subscribe(() => {
      this.pendingInvitationCount.update(count => count + 1);
    });
  }

  private loadWeeklyReport() {
    // Show at most once per calendar week (tracked in localStorage)
    const weekKey = `gwf_weekly_report_${this.currentISOWeek()}`;
    if (localStorage.getItem(weekKey) === 'dismissed') return;

    this.userSvc.getWeeklyReport().pipe(catchError(() => of(null))).subscribe(report => {
      if (report) {
        this.weeklyReport.set(report);
        this.showWeeklyReport.set(true);
      }
    });
  }

  private loadLearningPath(scrollTo?: string) {
    this.userSvc.getLearningPath().pipe(catchError(() => of(null))).subscribe(path => {
      if (path) {
        this.learningPath.set(path);
        if (scrollTo === 'recommended-next') {
          setTimeout(() => {
            document.getElementById('recommended-next')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.highlightPath.set(true);
            setTimeout(() => this.highlightPath.set(false), 1800);
          }, 150);
        }
      }
    });
  }

  private loadGoalProgress() {
    this.userSvc.getGoalProgress().pipe(catchError(() => of(null))).subscribe(goal => {
      this.goalProgress.set(goal);
    });
  }

  private loadDueForReview() {
    this.mistakeSvc.getDueForReview().pipe(catchError(() => of(null))).subscribe(data => {
      if (data?.data) this.dueForReview.set(data.data);
    });
  }

  private loadActiveChallenge() {
    this.challengeSvc.getActiveChallenge().pipe(catchError(() => of(null))).subscribe(data => {
      if (data) this.activeChallenge.set(data);
    });
  }

  private loadPendingInvitations() {
    this.sessionSvc.getMyInvitations().pipe(catchError(() => of([]))).subscribe(invs => {
      this.pendingInvitationCount.set(invs.length);
    });
  }

  dismissWeeklyReport() {
    const weekKey = `gwf_weekly_report_${this.currentISOWeek()}`;
    localStorage.setItem(weekKey, 'dismissed');
    this.showWeeklyReport.set(false);
  }

  private currentISOWeek(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return `${d.getFullYear()}-W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
  }

  recIcon(type: string) {
    if (type === 'repractice') return this.RepracticeIcon;
    if (type === 'low_score')  return this.ZapIcon;
    if (type === 'goal')       return this.TargetIcon;
    return this.VocabIcon;
  }

  recIconBg(type: string): string {
    if (type === 'repractice') return 'rgba(224,123,57,0.08)';
    if (type === 'low_score')  return 'rgba(61,90,153,0.08)';
    if (type === 'goal')       return 'rgba(61,90,153,0.10)';
    return 'rgba(46,125,50,0.08)';
  }

  recIconColor(type: string): string {
    if (type === 'repractice') return '#E07B39';
    if (type === 'low_score')  return '#3D5A99';
    if (type === 'goal')       return '#3D5A99';
    return '#2E7D32';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getScoreBg(score: number): string {
    if (score >= 80) return '#DCFCE7';
    if (score >= 60) return '#FEF3C7';
    return '#FEE2E2';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#166534';
    if (score >= 60) return '#92400E';
    return '#991B1B';
  }
}

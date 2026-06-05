import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Users, TrendingUp, UserX, Award, AlertTriangle } from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { catchError, forkJoin, of } from 'rxjs';

/**
 * Cohort detail screen (`/admin/cohorts/:id`).
 *
 * Renders the cohort header + collective analytics (avg fluency, inactive count,
 * most-improved member, top grammar mistakes) and the member roster. Backed by:
 *   GET /api/admin/cohorts/{id}/analytics  → CohortAnalyticsResponseDto
 *   GET /api/admin/cohorts/{id}/members    → CohortMemberDto[]
 * Members are rendered as a responsive card grid (mobile-safe — no wide table).
 */
@Component({
  selector: 'app-admin-cohort-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UserAvatarComponent],
  template: `
    <div class="min-h-screen bg-gw-bg p-6 space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-3">
        <button (click)="goBack()"
                class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-gw-card-border bg-white text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all">
          <i-lucide [img]="ArrowLeftIcon" size="16"></i-lucide>
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-black text-gw-text uppercase italic tracking-tight">{{ cohortName() || 'Cohort' }}</h1>
            @if (!loading()) {
              <span class="text-[11px] font-black px-2 py-0.5 rounded-lg"
                    [class]="isActive() ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                {{ isActive() ? 'Active' : 'Inactive' }}
              </span>
            }
          </div>
          @if (description()) {
            <p class="text-xs text-gw-text-muted mt-1">{{ description() }}</p>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-8 h-8 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
        </div>
      } @else if (notFound()) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-16 text-center">
          <i-lucide [img]="AlertIcon" size="32" class="text-gw-text-muted mx-auto mb-4"></i-lucide>
          <p class="text-sm font-semibold text-gw-text-muted">Cohort not found or no longer available.</p>
        </div>
      } @else {

        <!-- Stat cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
            <div class="flex items-center gap-2 text-gw-text-muted">
              <i-lucide [img]="UsersIcon" size="14"></i-lucide>
              <span class="text-[11px] font-black uppercase tracking-widest">Members</span>
            </div>
            <p class="text-2xl font-black text-gw-text mt-2">{{ memberCount() }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
            <div class="flex items-center gap-2 text-gw-text-muted">
              <i-lucide [img]="TrendingUpIcon" size="14"></i-lucide>
              <span class="text-[11px] font-black uppercase tracking-widest">Avg Fluency</span>
            </div>
            <p class="text-2xl font-black text-gw-text mt-2">{{ avgFluency() | number:'1.0-1' }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
            <div class="flex items-center gap-2 text-gw-text-muted">
              <i-lucide [img]="UserXIcon" size="14"></i-lucide>
              <span class="text-[11px] font-black uppercase tracking-widest">Inactive</span>
            </div>
            <p class="text-2xl font-black text-gw-text mt-2">{{ inactiveCount() }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
            <div class="flex items-center gap-2 text-gw-text-muted">
              <i-lucide [img]="AwardIcon" size="14"></i-lucide>
              <span class="text-[11px] font-black uppercase tracking-widest">Most Improved</span>
            </div>
            @if (mostImproved(); as mi) {
              <p class="text-sm font-black text-gw-text mt-2 truncate">{{ mi.fullName }}</p>
              <p class="text-[11px] font-bold text-gw-success">+{{ mi.improvementDelta | number:'1.0-1' }}</p>
            } @else {
              <p class="text-sm font-bold text-gw-text-muted mt-2">—</p>
            }
          </div>
        </div>

        <!-- Top grammar mistakes -->
        @if (topGrammarMistakes().length > 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
            <h2 class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted mb-3">Top Grammar Mistakes</h2>
            <div class="flex flex-wrap gap-2">
              @for (g of topGrammarMistakes(); track g.grammarTag) {
                <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gw-bg text-gw-text">
                  {{ g.grammarTag }}
                  <span class="text-[11px] font-black text-gw-primary">{{ g.mistakeCount }}</span>
                </span>
              }
            </div>
          </div>
        }

        <!-- Member roster -->
        <div class="space-y-3">
          <h2 class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Members ({{ members().length }})</h2>
          @if (members().length === 0) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-12 text-center">
              <p class="text-sm font-semibold text-gw-text-muted">No members assigned to this cohort yet.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (m of members(); track m.userId) {
                <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 space-y-3">
                  <div class="flex items-center gap-3">
                    <app-user-avatar [name]="m.fullName" [avatarUrl]="m.avatarUrl" size="sm"></app-user-avatar>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-black text-gw-text truncate">{{ m.fullName }}</p>
                      <p class="text-[11px] text-gw-text-muted">{{ m.ageGroup || '—' }}</p>
                    </div>
                    <span class="text-[11px] font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                          [class]="m.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                      {{ m.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-gw-bg rounded-xl py-2">
                      <p class="text-sm font-black text-gw-text">{{ m.sessionCount }}</p>
                      <p class="text-[11px] text-gw-text-muted">Sessions</p>
                    </div>
                    <div class="bg-gw-bg rounded-xl py-2">
                      <p class="text-sm font-black text-gw-text">{{ m.avgFluencyScore | number:'1.0-1' }}</p>
                      <p class="text-[11px] text-gw-text-muted">Fluency</p>
                    </div>
                    <div class="bg-gw-bg rounded-xl py-2">
                      <p class="text-sm font-black text-gw-text">{{ m.totalMistakes }}</p>
                      <p class="text-[11px] text-gw-text-muted">Mistakes</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminCohortDetailComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);

  cohortId = 0;

  loading  = signal(true);
  notFound = signal(false);

  cohortName   = signal('');
  description   = signal<string | null>(null);
  isActive      = signal(true);
  memberCount   = signal(0);
  avgFluency    = signal(0);
  inactiveCount = signal(0);
  topGrammarMistakes = signal<Array<{ grammarTag: string; mistakeCount: number }>>([]);
  mostImproved  = signal<{ userId: number; fullName: string; improvementDelta: number } | null>(null);
  members       = signal<any[]>([]);

  readonly ArrowLeftIcon  = ArrowLeft;
  readonly UsersIcon      = Users;
  readonly TrendingUpIcon = TrendingUp;
  readonly UserXIcon      = UserX;
  readonly AwardIcon      = Award;
  readonly AlertIcon      = AlertTriangle;

  ngOnInit() {
    this.cohortId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.cohortId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  private load() {
    this.loading.set(true);
    forkJoin({
      analytics: this.adminSvc.getCohortAnalytics(this.cohortId).pipe(catchError(() => of(null))),
      members:   this.adminSvc.getCohortMembers(this.cohortId).pipe(catchError(() => of([])))
    }).subscribe(({ analytics, members }) => {
      if (!analytics) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.cohortName.set(analytics.cohortName ?? '');
      this.description.set(analytics.description ?? null);
      this.memberCount.set(analytics.memberCount ?? members.length);
      this.avgFluency.set(analytics.avgFluencyScore ?? 0);
      this.inactiveCount.set(analytics.inactiveCount ?? 0);
      this.topGrammarMistakes.set(analytics.topGrammarMistakes ?? []);
      this.mostImproved.set(analytics.mostImproved ?? null);
      // isActive is not returned by analytics; infer Active when any member is active.
      this.isActive.set(members.some((m: any) => m.isActive));
      this.members.set(members);
      this.loading.set(false);
    });
  }

  goBack() {
    this.router.navigate(['/admin/cohorts']);
  }
}

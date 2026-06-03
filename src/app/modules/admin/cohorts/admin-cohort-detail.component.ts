import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  LucideAngularModule,
  ChevronLeft, Users, BarChart2, TrendingUp, Trophy, User,
  AlertCircle, CheckCircle, Clock
} from 'lucide-angular';
import { AdminService } from '@core/services/admin.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-cohort-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/cohorts"
           class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm flex-shrink-0">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (headerLoading()) {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        } @else if (analytics()) {
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-black text-gw-text">{{ analytics()!.cohortName }}</h2>
              <span class="text-[10px] font-black px-2.5 py-1 rounded-lg"
                    [class]="analytics()!.memberCount > 0 ? 'bg-gw-success/10 text-gw-success' : 'bg-gray-100 text-gray-500'">
                {{ analytics()!.memberCount }} members
              </span>
            </div>
            @if (analytics()!.description) {
              <p class="text-xs text-gw-text-muted mt-0.5">{{ analytics()!.description }}</p>
            }
          </div>
        } @else {
          <div>
            <h2 class="text-xl font-black text-gw-text">Cohort Details</h2>
          </div>
        }
      </div>

      <!-- Not found -->
      @if (!headerLoading() && !analytics() && !membersLoading() && members().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="UsersIcon" size="28" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="font-black text-gw-text">Cohort not found</p>
          <a routerLink="/admin/cohorts" class="text-sm font-bold text-gw-primary hover:underline">Back to Cohorts</a>
        </div>
      }

      <!-- ── Analytics Stats Row ─────────────────────────────────── -->
      @if (!headerLoading()) {
        @if (analytics()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-gw-text">{{ analytics()!.memberCount }}</p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Members</p>
            </div>
            <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-gw-text">{{ analytics()!.avgFluencyScore | number:'1.0-0' }}%</p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Avg Fluency</p>
            </div>
            <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-amber-500">{{ analytics()!.inactiveCount }}</p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Inactive</p>
            </div>
            <div class="bg-white rounded-2xl border border-gw-card-border p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-gw-success">{{ analytics()!.memberCount - analytics()!.inactiveCount }}</p>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-1">Active</p>
            </div>
          </div>

          <!-- Most Improved + Top Mistakes row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Most Improved -->
            @if (analytics()!.mostImproved) {
              <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <i-lucide [img]="TrophyIcon" size="14" class="text-amber-500"></i-lucide>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Most Improved (30 days)</p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gw-success/10 flex items-center justify-center">
                    <i-lucide [img]="TrendingIcon" size="16" class="text-gw-success"></i-lucide>
                  </div>
                  <div>
                    <p class="text-sm font-black text-gw-text">{{ analytics()!.mostImproved.fullName }}</p>
                    <p class="text-[10px] text-gw-success font-bold">+{{ analytics()!.mostImproved.improvementDelta | number:'1.0-1' }} pts improvement</p>
                  </div>
                </div>
              </div>
            }

            <!-- Top Grammar Mistakes -->
            @if (analytics()!.topGrammarMistakes?.length) {
              <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5">
                <div class="flex items-center gap-2 mb-3">
                  <i-lucide [img]="AlertIcon" size="14" class="text-red-400"></i-lucide>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Top Grammar Mistakes</p>
                </div>
                <div class="space-y-2">
                  @for (mistake of analytics()!.topGrammarMistakes; track mistake.grammarTag) {
                    <div class="flex items-center justify-between px-3 py-2 bg-gw-bg rounded-xl">
                      <span class="text-xs font-semibold text-gw-text">{{ mistake.grammarTag }}</span>
                      <span class="text-xs font-black text-red-500">{{ mistake.mistakeCount }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else if (analyticsError()) {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-semibold">
            Analytics could not be loaded for this cohort.
          </div>
        }
      }

      <!-- ── Members Section ─────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
        <div class="flex items-center gap-2 px-6 py-4 border-b border-gw-bg">
          <i-lucide [img]="UsersIcon" size="16" class="text-gw-text-muted"></i-lucide>
          <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Members</h3>
          @if (!membersLoading()) {
            <span class="ml-auto text-[10px] font-bold text-gw-text-muted">{{ members().length }} total</span>
          }
        </div>

        @if (membersLoading()) {
          <div class="flex justify-center py-12">
            <div class="w-6 h-6 border-4 border-gw-primary/30 border-t-gw-primary rounded-full animate-spin"></div>
          </div>
        } @else if (membersError()) {
          <div class="p-6 text-center">
            <i-lucide [img]="AlertIcon" size="24" class="text-red-400 mx-auto mb-2"></i-lucide>
            <p class="text-sm font-bold text-red-500">Failed to load members</p>
            <button (click)="reload()" class="mt-3 text-xs font-bold text-gw-primary hover:underline">Try again</button>
          </div>
        } @else if (members().length === 0) {
          <div class="py-12 text-center text-xs text-gw-text-muted font-semibold">
            No users assigned to this cohort yet.
          </div>
        } @else {
          <!-- Table header -->
          <div class="hidden md:grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 px-6 py-2 bg-gw-bg text-[9px] font-black uppercase tracking-widest text-gw-text-muted">
            <span>User</span>
            <span class="text-center">Sessions</span>
            <span class="text-center">Fluency</span>
            <span class="text-center">Mistakes</span>
            <span class="text-center">Status</span>
          </div>
          <div class="divide-y divide-gw-bg">
            @for (member of members(); track member.userId) {
              <div class="flex md:grid md:grid-cols-[1fr_80px_80px_80px_60px] gap-4 items-center px-6 py-3.5">
                <!-- User info -->
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
                    <i-lucide [img]="UserIcon" size="14" class="text-gw-primary"></i-lucide>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate">{{ member.fullName }}</p>
                    <p class="text-[10px] text-gw-text-muted">{{ member.mobileNumber }} · {{ member.ageGroup }}</p>
                  </div>
                </div>
                <!-- Stats — hidden on mobile but shown via sub-row -->
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black text-gw-text">{{ member.sessionCount }}</p>
                  <p class="text-[9px] text-gw-text-muted">sessions</p>
                </div>
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black text-gw-text">{{ member.avgFluencyScore | number:'1.0-0' }}%</p>
                  <p class="text-[9px] text-gw-text-muted">fluency</p>
                </div>
                <div class="hidden md:flex flex-col items-center">
                  <p class="text-sm font-black" [class]="member.totalMistakes > 0 ? 'text-amber-500' : 'text-gw-text'">{{ member.totalMistakes }}</p>
                  <p class="text-[9px] text-gw-text-muted">mistakes</p>
                </div>
                <div class="hidden md:flex justify-center">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                        [class]="member.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ member.isActive ? 'Active' : 'Off' }}
                  </span>
                </div>
                <!-- Mobile stats row -->
                <div class="md:hidden ml-auto flex items-center gap-3 text-[10px] text-gw-text-muted font-semibold">
                  <span>{{ member.sessionCount }} sess</span>
                  <span>{{ member.avgFluencyScore | number:'1.0-0' }}%</span>
                  <span class="font-black px-1.5 py-0.5 rounded-lg"
                        [class]="member.isActive ? 'bg-gw-success/10 text-gw-success' : 'bg-red-50 text-red-500'">
                    {{ member.isActive ? 'Active' : 'Off' }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminCohortDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private adminSvc = inject(AdminService);
  private toast    = inject(ToastService);

  members        = signal<any[]>([]);
  analytics      = signal<any>(null);
  membersLoading = signal(true);
  headerLoading  = signal(true);
  membersError   = signal(false);
  analyticsError = signal(false);

  private cohortId = 0;

  readonly BackIcon     = ChevronLeft;
  readonly UsersIcon    = Users;
  readonly BarChart2Icon = BarChart2;
  readonly TrendingIcon = TrendingUp;
  readonly TrophyIcon   = Trophy;
  readonly UserIcon     = User;
  readonly AlertIcon    = AlertCircle;
  readonly CheckIcon    = CheckCircle;
  readonly ClockIcon    = Clock;

  ngOnInit() {
    this.cohortId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.cohortId) return;
    this.load();
  }

  load() {
    this.membersLoading.set(true);
    this.headerLoading.set(true);
    this.membersError.set(false);
    this.analyticsError.set(false);

    forkJoin({
      members:   this.adminSvc.getCohortMembers(this.cohortId).pipe(catchError(() => { this.membersError.set(true); return of([]); })),
      analytics: this.adminSvc.getCohortAnalytics(this.cohortId).pipe(catchError(() => { this.analyticsError.set(true); return of(null); }))
    }).subscribe(({ members, analytics }) => {
      this.members.set((members ?? []).map((m: any) => ({
        userId:          m.userId,
        fullName:        m.fullName,
        mobileNumber:    m.mobileNumber,
        ageGroup:        m.ageGroup,
        isActive:        m.isActive,
        dailyStreakCount: m.dailyStreakCount,
        sessionCount:    m.sessionCount,
        avgFluencyScore: m.avgFluencyScore,
        totalMistakes:   m.totalMistakes
      })));
      this.analytics.set(analytics);
      this.membersLoading.set(false);
      this.headerLoading.set(false);
    });
  }

  reload() { this.load(); }
}

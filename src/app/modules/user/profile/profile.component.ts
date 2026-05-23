// File: src/app/modules/user/profile/profile.component.ts
import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { UserStateService } from '@core/services/user-state.service';
import {
  LucideAngularModule,
  Mail, Smartphone, Calendar, Award, Flame, TrendingUp, Zap,
  Edit2, LogOut, CheckCircle2
} from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto space-y-4 pb-28 px-4 pt-2 animate-in fade-in duration-500">

        <!-- ── Profile Hero ─────────────────────────────────────────── -->
        <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden">

          <!-- Banner — clean gradient -->
          <div class="h-24"
               style="background: linear-gradient(135deg, #3D5A99 0%, #5B7EC9 55%, #E07B39 100%);"></div>

          <!-- Avatar + Identity -->
          <div class="px-6 pb-6 -mt-12 flex flex-col items-center text-center gap-3">

            <!-- Initials avatar -->
            <div class="w-24 h-24 rounded-2xl border-4 border-white shadow-xl
                        flex items-center justify-center shrink-0 select-none"
                 style="background: linear-gradient(135deg, #3D5A99 0%, #5B7EC9 100%);">
              <span class="text-3xl font-black text-white tracking-tight leading-none">
                {{ initials() }}
              </span>
            </div>

            <!-- View mode -->
            @if (!isEditing()) {
              <div class="space-y-2 w-full">
                <div class="flex items-center justify-center gap-2">
                  <h2 class="text-xl font-black text-gw-text tracking-tight">
                    {{ profile()?.fullName }}
                  </h2>
                  @if (isAdmin()) {
                    <button (click)="toggleEdit()"
                            title="Edit name"
                            class="w-7 h-7 rounded-lg border border-gw-card-border bg-gw-bg
                                   flex items-center justify-center text-gw-text-muted
                                   hover:border-gw-primary hover:text-gw-primary transition-all">
                      <i-lucide [img]="EditIcon" size="13"></i-lucide>
                    </button>
                  }
                </div>
                <div class="flex flex-wrap gap-1.5 justify-center">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style="background: rgba(61,90,153,0.08); color: #3D5A99;">
                    {{ profile()?.ageGroup }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style="background: rgba(224,123,57,0.08); color: #E07B39;">
                    {{ profile()?.preferredHintLanguage }} Hint
                  </span>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                               bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide">
                    <i-lucide [img]="FlameIcon" size="10"></i-lucide>
                    {{ profile()?.dailyStreakCount }} Days
                  </span>
                </div>
              </div>
            }

            <!-- Edit form — ADMIN only -->
            @if (isAdmin() && isEditing()) {
              <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="w-full space-y-3 mt-1">
                <input formControlName="fullName"
                       class="w-full h-11 bg-gw-bg border-2 border-gw-card-border rounded-xl
                              px-4 text-sm font-bold text-gw-text text-center
                              focus:border-gw-primary outline-none transition-colors
                              placeholder:text-gw-text-muted"
                       placeholder="Full name">
                <div class="flex gap-2">
                  <button type="button" (click)="toggleEdit()"
                          class="flex-1 h-10 border border-gw-card-border rounded-xl
                                 text-xs font-bold text-gw-text-muted hover:bg-gw-bg transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                          [disabled]="editForm.invalid || isLoading()"
                          class="flex-1 h-10 bg-gw-primary text-white rounded-xl
                                 text-xs font-bold flex items-center justify-center gap-2
                                 disabled:opacity-50 hover:opacity-90 transition-opacity">
                    @if (isLoading()) {
                      <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    } @else {
                      <i-lucide [img]="CheckIcon" size="13"></i-lucide>
                    }
                    Save
                  </button>
                </div>
              </form>
            }
          </div>
        </div>

        <!-- ── Stats Row ─────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 gap-3">
          @for (stat of stats(); track stat.label) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4
                        relative overflow-hidden">
              <div class="absolute -right-3 -bottom-3 opacity-[0.05] pointer-events-none">
                <i-lucide [img]="stat.icon" size="64"></i-lucide>
              </div>
              <div class="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                   [style.background]="stat.bg">
                <i-lucide [img]="stat.icon" size="16" [style.color]="stat.color"></i-lucide>
              </div>
              <p class="text-2xl font-black text-gw-text leading-none tabular-nums">{{ stat.value }}</p>
              <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-widest mt-1">{{ stat.label }}</p>
            </div>
          }
        </div>

        <!-- ── Account Details ───────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">Account</p>
          </div>
          <div class="divide-y divide-gw-bg">

            <div class="flex items-center gap-3.5 px-5 py-4">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="SmartphoneIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-wider">Mobile</p>
                <p class="text-sm font-semibold text-gw-text mt-0.5 truncate">
                  {{ profile()?.mobileNumber }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 px-5 py-4">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="MailIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-wider">Email</p>
                <p class="text-sm font-semibold mt-0.5 truncate"
                   [class.text-gw-text]="profile()?.email"
                   [class.text-gw-text-muted]="!profile()?.email">
                  {{ profile()?.email || 'Not added' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 px-5 py-4">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="CalendarIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <div class="flex-1">
                <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-wider">Member Since</p>
                <p class="text-sm font-semibold text-gw-text mt-0.5">
                  {{ profile()?.registrationDate | date:'MMMM yyyy' }}
                </p>
              </div>
            </div>

          </div>
        </div>

        <!-- ── Sign Out ──────────────────────────────────────────────── -->
        <button (click)="logout()"
                class="w-full h-12 flex items-center justify-center gap-2.5
                       border border-red-200 rounded-2xl
                       text-sm font-bold text-gw-error
                       hover:bg-red-50 active:bg-red-100 transition-colors">
          <i-lucide [img]="LogoutIcon" size="16"></i-lucide>
          Sign Out
        </button>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ProfileComponent {
  private userService = inject(UserService);
  private userState   = inject(UserStateService);
  private authService = inject(AuthService);
  private fb          = inject(FormBuilder);
  private toast       = inject(ToastService);

  readonly EditIcon       = Edit2;
  readonly CheckIcon      = CheckCircle2;
  readonly FlameIcon      = Flame;
  readonly SmartphoneIcon = Smartphone;
  readonly MailIcon       = Mail;
  readonly CalendarIcon   = Calendar;
  readonly LogoutIcon     = LogOut;

  // ── Read directly from state service — no API calls here ──────
  profile   = this.userState.profile;
  streak    = this.userState.streak;

  isEditing = signal(false);
  isLoading = signal(false);

  /** True only for ADMIN role */
  isAdmin = computed(() => this.profile()?.role === 'ADMIN');

  /** Two-letter initials from full name */
  initials = computed(() => {
    const name = this.profile()?.fullName?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  });

  /** Stats built reactively from cached signals — zero extra API calls */
  stats = computed(() => {
    const res = this.profile();
    const s   = this.streak();
    if (!res || !s) return [];
    return [
      { label: 'Sessions',    value: res.totalSessionsPlayed,  icon: Award,      bg: '#EEF2FF', color: '#3D5A99' },
      { label: 'Avg Fluency', value: res.avgFluencyScore + '%', icon: TrendingUp, bg: '#ECFDF5', color: '#2E7D32' },
      { label: 'Day Streak',  value: s.currentStreak,          icon: Flame,      bg: '#FFFBEB', color: '#F59E0B' },
      { label: 'Best Streak', value: s.longestStreak,          icon: Zap,        bg: '#FFF7ED', color: '#E07B39' }
    ];
  });

  editForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    // Reactively patch form when profile loads (or updates)
    effect(() => {
      const p = this.profile();
      if (p && !this.isEditing()) {
        this.editForm.patchValue({ fullName: p.fullName });
      }
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    if (this.isEditing()) {
      this.editForm.patchValue({ fullName: this.profile()?.fullName ?? '' });
    }
  }

  saveProfile() {
    if (this.editForm.invalid) return;
    this.isLoading.set(true);
    const p = this.profile()!;
    this.userService.updateProfile({
      fullName: this.editForm.value.fullName!,
      email: p.email,
      ageGroup: p.ageGroup,
      preferredHintLanguage: p.preferredHintLanguage,
      avatarUrl: p.avatar
    }).subscribe({
      next: (res) => {
        // Push updated profile into state service — no re-fetch needed
        this.userState.setProfile(res);
        this.isEditing.set(false);
        this.isLoading.set(false);
        this.toast.success('Profile updated');
      },
      error: () => this.isLoading.set(false)
    });
  }

  logout() {
    this.authService.logout();
  }
}

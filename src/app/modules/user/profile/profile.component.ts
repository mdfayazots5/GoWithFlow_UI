// File: src/app/modules/user/profile/profile.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { UserProfile, StreakData } from '@core/models/user.model';
import { LucideAngularModule, Mail, Smartphone, Calendar, Award, Flame, TrendingUp, Zap, Edit2, LogOut, Camera } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-28">

      <!-- Profile Hero Card -->
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

        <!-- Gradient banner -->
        <div class="h-20 bg-gradient-to-r from-gw-primary to-blue-400 relative">
          <div class="absolute inset-0 opacity-20"
               style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px); background-size: 18px 18px;"></div>
        </div>

        <!-- Avatar + name -->
        <div class="px-5 pb-5 -mt-10 flex flex-col items-center text-center gap-3">
          <div class="relative">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gw-bg">
              <img [src]="profile()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile()?.fullName"
                   class="w-full h-full object-cover">
            </div>
            <label class="absolute -bottom-1 -right-1 w-7 h-7 bg-gw-primary text-white rounded-lg flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition-opacity">
              <i-lucide [img]="CameraIcon" size="13"></i-lucide>
              <input type="file" class="hidden" (change)="onAvatarChange($event)">
            </label>
          </div>

          @if (!isEditing()) {
            <div>
              <div class="flex items-center justify-center gap-2">
                <h2 class="text-xl font-black text-gw-text uppercase tracking-tight">{{ profile()?.fullName }}</h2>
                <button (click)="toggleEdit()" class="text-gw-text-muted hover:text-gw-primary transition-colors">
                  <i-lucide [img]="EditIcon" size="15"></i-lucide>
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 justify-center mt-2">
                <span class="px-2 py-0.5 bg-gw-accent/10 text-gw-accent rounded-md text-[9px] font-black uppercase tracking-wide">{{ profile()?.ageGroup }}</span>
                <span class="px-2 py-0.5 bg-gw-primary/10 text-gw-primary rounded-md text-[9px] font-black uppercase tracking-wide">{{ profile()?.preferredHintLanguage }} Hint</span>
                <span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black uppercase tracking-wide flex items-center gap-1">
                  <i-lucide [img]="FlameIcon" size="9"></i-lucide>
                  {{ profile()?.dailyStreakCount }} Streak
                </span>
              </div>
            </div>
          } @else {
            <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="w-full space-y-3 mt-1">
              <input formControlName="fullName"
                     class="w-full h-11 bg-gw-bg border-2 border-gw-card-border rounded-xl px-4 text-sm font-bold focus:border-gw-primary outline-none text-center transition-colors"
                     placeholder="Full Name">
              <div class="flex gap-2">
                <button type="button" (click)="toggleEdit()"
                        class="flex-1 h-10 border border-gw-card-border rounded-xl text-xs font-bold text-gw-text-muted hover:bg-gw-bg transition-colors">
                  Cancel
                </button>
                <button type="submit" [disabled]="editForm.invalid || isLoading()"
                        class="flex-1 h-10 bg-gw-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  @if (isLoading()) { <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> }
                  Save
                </button>
              </div>
            </form>
          }
        </div>
      </div>

      <!-- Stats — 2×2 on mobile, 4-col on md+ -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        @for (stat of stats; track stat.label) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden">
            <div class="absolute -right-2 -bottom-2 opacity-[0.06]">
              <i-lucide [img]="stat.icon" size="56"></i-lucide>
            </div>
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                 [style.background]="stat.bg">
              <i-lucide [img]="stat.icon" size="15" [style.color]="stat.color"></i-lucide>
            </div>
            <div>
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-widest">{{ stat.label }}</p>
              <p class="text-xl font-black text-gw-text leading-none mt-0.5">{{ stat.value }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Account Info -->
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-gw-bg">
          <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">Account Details</p>
        </div>
        <div class="divide-y divide-gw-bg">
          <div class="flex items-center gap-3 px-5 py-4">
            <div class="w-8 h-8 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
              <i-lucide [img]="SmartphoneIcon" size="15" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider">Mobile</p>
              <p class="text-sm font-bold text-gw-text mt-0.5 truncate">{{ profile()?.mobileNumber }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 px-5 py-4">
            <div class="w-8 h-8 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
              <i-lucide [img]="MailIcon" size="15" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider">Email</p>
              <p class="text-sm font-bold mt-0.5 truncate"
                 [class.text-gw-text]="profile()?.email"
                 [class.text-gw-text-muted]="!profile()?.email">
                {{ profile()?.email || 'Not provided' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 px-5 py-4">
            <div class="w-8 h-8 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
              <i-lucide [img]="CalendarIcon" size="15" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="flex-1">
              <p class="text-[9px] font-bold text-gw-text-muted uppercase tracking-wider">Member Since</p>
              <p class="text-sm font-bold text-gw-text mt-0.5">{{ profile()?.registrationDate | date:'MMMM yyyy' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-gw-bg">
          <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">Preferences</p>
        </div>
        <div class="divide-y divide-gw-bg">

          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="text-xs font-bold text-gw-text">Hint Language</p>
              <p class="text-[9px] text-gw-text-muted mt-0.5">Language used for grammar hints</p>
            </div>
            <select [value]="profile()?.preferredHintLanguage"
                    (change)="updatePreference('preferredHintLanguage', $any($event.target).value)"
                    class="h-9 bg-gw-bg border border-gw-card-border rounded-xl px-3 text-xs font-bold text-gw-text outline-none appearance-none cursor-pointer focus:border-gw-primary transition-colors">
              <option value="Telugu">Telugu</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Kannada">Kannada</option>
              <option value="None">None</option>
            </select>
          </div>

          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="text-xs font-bold text-gw-text">Age Group</p>
              <p class="text-[9px] text-gw-text-muted mt-0.5">Affects content difficulty</p>
            </div>
            <select [value]="profile()?.ageGroup"
                    (change)="updatePreference('ageGroup', $any($event.target).value)"
                    class="h-9 bg-gw-bg border border-gw-card-border rounded-xl px-3 text-xs font-bold text-gw-text outline-none appearance-none cursor-pointer focus:border-gw-primary transition-colors">
              <option value="Child (6-12)">Child (6–12)</option>
              <option value="Teen (13-17)">Teen (13–17)</option>
              <option value="Adult (18+)">Adult (18+)</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Logout -->
      <button (click)="logout()"
              class="w-full h-12 border border-gw-error/40 text-gw-error text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
        <i-lucide [img]="LogoutIcon" size="16"></i-lucide>
        Sign Out
      </button>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly CameraIcon = Camera;
  readonly EditIcon = Edit2;
  readonly FlameIcon = Flame;
  readonly SmartphoneIcon = Smartphone;
  readonly MailIcon = Mail;
  readonly CalendarIcon = Calendar;
  readonly LogoutIcon = LogOut;
  readonly AwardIcon = Award;
  readonly TrendingIcon = TrendingUp;
  readonly ZapIcon = Zap;

  profile = signal<UserProfile | null>(null);
  streak = signal<StreakData | null>(null);
  isEditing = signal(false);
  isLoading = signal(false);
  stats: any[] = [];

  editForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.loadProfile();
    this.userService.getStreakData().subscribe(s => this.streak.set(s));
  }

  loadProfile() {
    this.userService.getProfile().subscribe(res => {
      this.profile.set(res);
      this.editForm.patchValue({ fullName: res.fullName });
      this.userService.getStreakData().subscribe(s => {
        this.streak.set(s);
        this.stats = [
          { label: 'Sessions',      value: res.totalSessionsPlayed,    icon: Award,      bg: '#EEF2FF', color: '#3D5A99' },
          { label: 'Avg Fluency',   value: res.avgFluencyScore + '%',   icon: TrendingUp, bg: '#ECFDF5', color: '#2E7D32' },
          { label: 'Cur. Streak',   value: s.currentStreak + 'd',       icon: Flame,      bg: '#FFFBEB', color: '#F59E0B' },
          { label: 'Best Streak',   value: s.longestStreak + 'd',       icon: Zap,        bg: '#FFF7ED', color: '#E07B39' }
        ];
      });
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
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
        this.profile.set(res);
        this.isEditing.set(false);
        this.isLoading.set(false);
        this.toast.success('Profile updated successfully');
      },
      error: () => this.isLoading.set(false)
    });
  }

  onAvatarChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading.set(true);
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.profile.update(p => p ? ({ ...p, avatar: res.avatarUrl }) : null);
          this.isLoading.set(false);
          this.toast.success('Avatar updated');
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  updatePreference(key: 'preferredHintLanguage' | 'ageGroup', value: string) {
    const p = this.profile()!;
    this.userService.updateProfile({
      fullName: p.fullName,
      email: p.email,
      ageGroup: key === 'ageGroup' ? value : p.ageGroup,
      preferredHintLanguage: key === 'preferredHintLanguage' ? value : p.preferredHintLanguage,
      avatarUrl: p.avatar
    }).subscribe(res => {
      this.profile.set(res);
      this.toast.success('Preference updated');
    });
  }

  logout() {
    this.authService.logout();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, User, Mail, Phone, Camera, Save, CheckCircle, Mic } from 'lucide-angular';
import { UserService } from '@core/services/user.service';
import { UserStateService } from '@core/services/user-state.service';
import { AuthService } from '@core/services/auth.service';
import { SessionPreferencesService } from '@core/services/session-preferences.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, UserAvatarComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-4 animate-in fade-in duration-500">

        <!-- Page heading -->
        <div>
          <h1 class="text-xl font-black text-gw-text tracking-tight">Account Settings</h1>
          <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Update your profile and preferences</p>
        </div>

        <!-- Avatar Section -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5 flex flex-col items-center gap-3">
          <div class="relative group">
            <app-user-avatar
              [name]="settingsForm?.get('name')?.value || userName"
              [avatarUrl]="avatarPreview"
              size="xl">
            </app-user-avatar>
            <label class="absolute -bottom-2 -right-2 bg-gw-primary text-white p-2.5 rounded-xl shadow-lg border-2 border-white cursor-pointer hover:opacity-90 active:scale-95 transition-all">
              <i-lucide [img]="CameraIcon" size="15"></i-lucide>
              <input type="file" (change)="onFileSelected($event)" class="hidden" accept="image/*">
            </label>
          </div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-gw-text-muted">Tap camera to change photo</p>
        </div>

        <!-- Personal Details -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-widest">Personal Details</p>
          </div>
          <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="divide-y divide-gw-bg">

            <div class="flex items-center gap-3.5 px-5 py-3.5">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="UserIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <input
                formControlName="name"
                type="text"
                placeholder="Full Name"
                class="flex-1 h-10 bg-transparent text-sm font-semibold text-gw-text outline-none placeholder:text-gw-text-muted"
              >
            </div>

            <div class="flex items-center gap-3.5 px-5 py-3.5">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="MailIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <input
                formControlName="email"
                type="email"
                placeholder="Email Address"
                class="flex-1 h-10 bg-transparent text-sm font-semibold text-gw-text outline-none placeholder:text-gw-text-muted opacity-50 pointer-events-none"
              >
            </div>

            <div class="flex items-center gap-3.5 px-5 py-3.5">
              <div class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center shrink-0">
                <i-lucide [img]="PhoneIcon" size="15" class="text-gw-text-muted"></i-lucide>
              </div>
              <input
                formControlName="mobile"
                type="tel"
                placeholder="Mobile Number"
                class="flex-1 h-10 bg-transparent text-sm font-semibold text-gw-text outline-none placeholder:text-gw-text-muted"
              >
            </div>

            <div class="px-5 py-4">
              <button
                type="submit"
                [disabled]="settingsForm.invalid || isSaving"
                class="w-full h-12 bg-gw-primary text-white rounded-xl font-black uppercase tracking-widest text-sm
                       flex items-center justify-center gap-2.5
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i-lucide [img]="isSaved ? CheckIcon : SaveIcon" size="16" [class.animate-bounce]="isSaved"></i-lucide>
                {{ isSaving ? 'Saving...' : (isSaved ? 'Saved!' : 'Update Profile') }}
              </button>
            </div>

          </form>
        </div>

        <!-- Live Session Preferences -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-widest">Session Preferences</p>
          </div>

          <div class="flex items-center justify-between px-5 py-4 gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style="background: rgba(61,90,153,0.08);">
                <i-lucide [img]="MicIcon" size="15" style="color:#3D5A99;"></i-lucide>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-gw-text leading-tight">Default Voice Starter</p>
                <p class="text-[11px] text-gw-text-muted mt-0.5 leading-snug">
                  Auto-start recording when it's your turn
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="toggleVoiceStarter()"
              class="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none"
              [class.bg-gw-primary]="prefs.defaultVoiceStarter"
              [class.bg-gw-card-border]="!prefs.defaultVoiceStarter"
              [attr.aria-checked]="prefs.defaultVoiceStarter"
              role="switch"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
                [class.translate-x-5]="prefs.defaultVoiceStarter"
                [class.translate-x-0]="!prefs.defaultVoiceStarter"
              ></span>
            </button>
          </div>
        </div>

        <!-- Diagnostics -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3.5 border-b border-gw-bg">
            <p class="text-[11px] font-black text-gw-text-muted uppercase tracking-widest">Diagnostics</p>
          </div>
          <button type="button" (click)="openSpeechDebug()"
                  class="w-full flex items-center justify-between px-5 py-4 gap-4 text-left active:bg-gw-bg transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background: rgba(61,90,153,0.08);">
                <i-lucide [img]="MicIcon" size="15" style="color:#3D5A99;"></i-lucide>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-gw-text leading-tight">Speech &amp; Capture Test</p>
                <p class="text-[11px] text-gw-text-muted mt-0.5 leading-snug">Test voice recognition + audio capture without a session</p>
              </div>
            </div>
            <span class="text-gw-text-muted shrink-0">›</span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class UserSettingsComponent implements OnInit {
  readonly UserIcon   = User;
  readonly MailIcon   = Mail;
  readonly PhoneIcon  = Phone;
  readonly CameraIcon = Camera;
  readonly SaveIcon   = Save;
  readonly CheckIcon  = CheckCircle;
  readonly MicIcon    = Mic;

  settingsForm!: FormGroup;
  avatarPreview: string | null = null;
  userName = '';
  isSaving = false;
  isSaved  = false;

  get prefs() { return this.sessionPrefs.prefs; }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private userState: UserStateService,
    private auth: AuthService,
    private sessionPrefs: SessionPreferencesService,
    private router: Router
  ) {}

  openSpeechDebug() {
    this.router.navigate(['/user/speech-debug']);
  }

  ngOnInit() {
    const user = this.auth.currentUser;
    this.userName = user?.fullName ?? '';
    this.settingsForm = this.fb.group({
      name:   [user?.fullName     || '', [Validators.required]],
      email:  [user?.email        || '', [Validators.required, Validators.email]],
      mobile: [user?.mobileNumber || '', [Validators.required]]
    });
    // Use latest presigned URL from state (populated after bootstrap), fall back to stored value
    this.avatarPreview = this.userState.avatarUrl() ?? user?.avatarUrl ?? null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => this.avatarPreview = e.target.result;
    reader.readAsDataURL(file);
    this.userService.uploadAvatar(file).subscribe({
      next: ({ avatarUrl }) => {
        if (avatarUrl) {
          this.avatarPreview = avatarUrl;
          this.userState.updateAvatar(avatarUrl);
        }
      }
    });
  }

  onSubmit() {
    if (!this.settingsForm.valid) return;
    this.isSaving = true;
    this.isSaved  = false;
    this.userService.updateProfile(this.settingsForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.isSaved  = true;
        setTimeout(() => this.isSaved = false, 3000);
      },
      error: () => this.isSaving = false
    });
  }

  toggleVoiceStarter() {
    this.sessionPrefs.update({ defaultVoiceStarter: !this.prefs.defaultVoiceStarter });
  }
}

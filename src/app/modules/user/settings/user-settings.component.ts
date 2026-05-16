import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, User, Mail, Phone, Camera, Save, CheckCircle } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Account Settings" [showBack]="true"></app-header>

      <main class="p-6 space-y-8 animate-in slide-in-from-bottom-4">
        <!-- Avatar Section -->
        <div class="flex flex-col items-center gap-4">
           <div class="relative group">
              <div class="w-32 h-32 rounded-[40px] border-4 border-white shadow-xl overflow-hidden bg-white">
                 <img [src]="avatarPreview" class="w-full h-full object-cover">
              </div>
              <label class="absolute -bottom-2 -right-2 bg-ls-primary text-white p-3 rounded-2xl shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all">
                 <i-lucide [img]="CameraIcon" size="18"></i-lucide>
                 <input type="file" (change)="onFileSelected($event)" class="hidden" accept="image/*">
              </label>
           </div>
           <p class="text-[10px] font-black uppercase tracking-[0.2em] text-ls-text-muted">Tap camera to change avatar</p>
        </div>

        <!-- Form Section -->
        <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="space-y-6">
           <div class="space-y-4">
              <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1">Personal Details</h3>
              
              <div class="space-y-4">
                 <div class="relative">
                    <i-lucide [img]="UserIcon" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                    <input 
                      formControlName="name"
                      type="text" 
                      placeholder="Full Name" 
                      class="form-input"
                    >
                 </div>

                 <div class="relative">
                    <i-lucide [img]="MailIcon" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                    <input 
                      formControlName="email"
                      type="email" 
                      placeholder="Email Address" 
                      class="form-input opacity-60 pointer-events-none"
                    >
                 </div>

                 <div class="relative">
                    <i-lucide [img]="PhoneIcon" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                    <input 
                      formControlName="mobile"
                      type="tel" 
                      placeholder="Mobile Number" 
                      class="form-input"
                    >
                 </div>
              </div>
           </div>

           <button 
             type="submit" 
             [disabled]="settingsForm.invalid || isSaving"
             class="w-full h-16 bg-ls-primary text-white rounded-3xl font-black uppercase tracking-widest text-lg italic shadow-xl shadow-ls-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
           >
              <i-lucide [img]="isSaved ? CheckIcon : SaveIcon" size="20" [class.animate-bounce]="isSaved"></i-lucide>
              {{ isSaving ? 'Saving Changes...' : (isSaved ? 'Changes Saved!' : 'Update Profile') }}
           </button>
        </form>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    .form-input {
      @apply w-full h-16 pl-12 pr-4 bg-white border border-ls-card-border rounded-2xl text-ls-text font-bold focus:outline-none focus:border-ls-primary transition-all shadow-sm;
    }
  `]
})
export class UserSettingsComponent implements OnInit {
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly CameraIcon = Camera;
  readonly SaveIcon = Save;
  readonly CheckIcon = CheckCircle;

  settingsForm!: FormGroup;
  avatarPreview = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi';
  isSaving = false;
  isSaved = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser;
    this.settingsForm = this.fb.group({
      name: [user?.fullName || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      mobile: [user?.mobileNumber || '', [Validators.required]]
    });

    if (user?.avatarUrl) {
      this.avatarPreview = user.avatarUrl;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.avatarPreview = e.target.result;
      reader.readAsDataURL(file);

      this.userService.uploadAvatar(file).subscribe(res => {
        // Handle avatar upload success
      });
    }
  }

  onSubmit() {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      this.isSaved = false;
      this.userService.updateProfile(this.settingsForm.value).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.isSaved = true;
          setTimeout(() => this.isSaved = false, 3000);
        },
        error: () => this.isSaving = false
      });
    }
  }
}

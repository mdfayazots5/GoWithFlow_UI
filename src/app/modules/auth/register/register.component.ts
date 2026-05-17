import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, User, Mail, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gw-bg py-12 font-sans">
      <div class="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        <div class="text-center">
          <h1 class="text-3xl font-black text-gw-primary italic tracking-tight">Create Account</h1>
          <p class="text-gw-text-muted font-medium mt-2">Join GoWithFlow to start speaking</p>
        </div>

        <div class="card bg-gw-card-bg border-gw-card-border shadow-sm p-8 rounded-3xl">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Full Name -->
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Full Name</label>
              <div class="relative">
                <i-lucide [img]="UserIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted"></i-lucide>
                <input 
                  type="text" 
                  formControlName="fullName"
                  class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl pl-12 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all placeholder:font-normal"
                  placeholder="Official Name"
                >
              </div>
              <p *ngIf="registerForm.get('fullName')?.touched && registerForm.get('fullName')?.errors?.['required']" class="text-[10px] font-bold text-gw-error px-1 italic uppercase tracking-wider">
                Full name is required
              </p>
              <p *ngIf="registerForm.get('fullName')?.touched && (registerForm.get('fullName')?.errors?.['minlength'] || registerForm.get('fullName')?.errors?.['maxlength'])" class="text-[10px] font-bold text-gw-error px-1 italic uppercase tracking-wider">
                Name must be 2-60 chars
              </p>
            </div>

            <!-- Mobile -->
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Mobile Number</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted font-bold text-sm">+91</span>
                <input 
                  type="tel" 
                  formControlName="mobileNumber"
                  class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl pl-14 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all"
                  placeholder="10-digit number"
                  maxlength="10"
                >
              </div>
              <p *ngIf="registerForm.get('mobileNumber')?.touched && registerForm.get('mobileNumber')?.errors" class="text-[10px] font-bold text-gw-error px-1 italic uppercase tracking-wider">
                Enter valid 10-digit number
              </p>
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Email Address (Optional)</label>
              <div class="relative">
                <i-lucide [img]="MailIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted"></i-lucide>
                <input 
                  type="email" 
                  formControlName="email"
                  class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl pl-12 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all placeholder:font-normal"
                  placeholder="you@example.com"
                >
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Age Group -->
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Age Group</label>
                <div class="relative">
                  <select 
                    formControlName="ageGroup"
                    class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none appearance-none transition-all"
                  >
                    <option value="Child (6-12)">Child (6-12)</option>
                    <option value="Teen (13-17)">Teen (13-17)</option>
                    <option value="Adult (18+)">Adult (18+)</option>
                  </select>
                  <i-lucide [img]="DownIcon" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
                </div>
              </div>

              <!-- Language -->
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Hint Language</label>
                <div class="relative">
                  <select 
                    formControlName="preferredHintLanguage"
                    class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none appearance-none transition-all"
                  >
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                    <option value="None">None</option>
                  </select>
                  <i-lucide [img]="DownIcon" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
                </div>
              </div>
            </div>

            <!-- Avatar Picker -->
            <div class="space-y-4 pt-2">
               <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-1">Choose Avatar</label>
               <div class="flex justify-between">
                  @for (seed of avatarSeeds; track seed) {
                    <button 
                      type="button"
                      (click)="setAvatar(seed)"
                      class="w-[64px] h-[64px] rounded-full overflow-hidden border-4 transition-all"
                      [class]="selectedAvatar() === seed ? 'border-gw-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'"
                    >
                      <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed" class="w-full h-full object-cover">
                    </button>
                  }
               </div>
            </div>

            <button 
              type="submit" 
              [disabled]="registerForm.invalid || isLoading"
              class="w-full h-[52px] bg-gw-primary text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all mt-4"
            >
              {{ isLoading ? 'Processing...' : 'Create Account' }}
            </button>
          </form>

          <div class="mt-8 text-center border-t border-gw-card-border pt-6">
            <p class="text-sm font-medium text-gw-text-muted">
              Already have an account? 
              <br>
              <a routerLink="/auth/login" class="text-gw-primary font-bold hover:underline">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { @apply bg-white border border-gw-card-border rounded-3xl p-8 shadow-sm; }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly DownIcon = ChevronDown;

  avatarSeeds = ['Felix', 'Aneka', 'Caleb', 'Bella'];
  selectedAvatar = signal<string>('Felix');

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.email]],
    ageGroup: ['Adult (18+)', Validators.required],
    preferredHintLanguage: ['Telugu', Validators.required]
  });

  isLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mobile']) {
        this.registerForm.patchValue({ mobileNumber: params['mobile'] });
      }
    });
  }

  setAvatar(seed: string) {
    this.selectedAvatar.set(seed);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const payload = {
        ...this.registerForm.value,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.selectedAvatar()}`
      };

      const mobile = this.registerForm.get('mobileNumber')?.value ?? '';
      this.auth.register(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Account created! Please log in.');
          this.router.navigate(['/auth/login'], { queryParams: { mobile } });
        },
        error: () => this.isLoading = false
      });
    }
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LucideAngularModule } from 'lucide-angular';

const USE_PASSWORD_LOGIN = false;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gw-bg">
      <div class="w-full max-w-md space-y-8">
        <!-- Logo Section -->
        <div class="text-center">
          <h1 class="text-[32px] font-black text-gw-primary italic tracking-tight">GoWithFlow</h1>
          <p class="text-gw-text-muted font-medium mt-2">Speak. Together. Grow.</p>
        </div>

        <div class="card bg-gw-card-bg border-gw-card-border shadow-sm p-8 rounded-3xl">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-black uppercase tracking-widest text-gw-text-muted px-1">Mobile Number</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted font-bold text-sm">+91</span>
                <input
                  type="tel"
                  formControlName="mobileNumber"
                  class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl pl-14 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all"
                  placeholder="Enter 10-digit number"
                  maxlength="10"
                >
              </div>
              <p *ngIf="loginForm.get('mobileNumber')?.touched && loginForm.get('mobileNumber')?.invalid" class="text-[10px] font-bold text-gw-error px-1 uppercase tracking-wider italic">
                Enter a valid 10-digit mobile number
              </p>
            </div>

            <!-- Password flow -->
            <ng-container *ngIf="usePasswordLogin">
              <div class="space-y-2">
                <label class="text-xs font-black uppercase tracking-widest text-gw-text-muted px-1">Password</label>
                <input
                  type="password"
                  formControlName="password"
                  class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all"
                  placeholder="Enter password"
                >
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="loginForm.invalid || isLoading"
                  class="w-full h-[52px] bg-gw-primary text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all font-sans"
                >
                  {{ isLoading ? 'Logging in...' : 'Login' }}
                </button>
              </div>
            </ng-container>

            <!-- OTP flow -->
            <div *ngIf="!usePasswordLogin" class="pt-2">
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="w-full h-[52px] bg-gw-primary text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all font-sans"
              >
                {{ isLoading ? 'Sending...' : 'Send OTP' }}
              </button>
            </div>
          </form>

          <!-- Registration prompt removed -->
          <div class="mt-8 text-center border-t border-gw-bg pt-6">
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
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly usePasswordLogin = USE_PASSWORD_LOGIN;

  loginForm = this.fb.group({
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', this.usePasswordLogin ? [Validators.required] : []]
  });

  isLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mobile']) {
        this.loginForm.patchValue({ mobileNumber: params['mobile'] });
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const mobile = this.loginForm.get('mobileNumber')?.value!;

      if (this.usePasswordLogin) {
        const password = this.loginForm.get('password')?.value!;
        this.auth.loginWithPassword(mobile, password).subscribe({
          next: (res) => {
            this.isLoading = false;
            const role = res.data?.role ?? this.auth.getRole();
            if (role === 'ADMIN') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/user/dashboard']);
            }
          },
          error: () => this.isLoading = false
        });
      } else {
        this.auth.requestOtp(mobile).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/auth/otp-verify'], { queryParams: { mobile } });
          },
          error: () => this.isLoading = false
        });
      }
    }
  }
}

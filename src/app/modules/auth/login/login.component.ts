import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { DemoService } from '@core/services/demo.service';
import { LucideAngularModule, Phone } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
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

            <div *ngIf="!demo.isDemo" class="pt-2">
              <button 
                type="submit" 
                [disabled]="loginForm.invalid || isLoading"
                class="w-full h-[52px] bg-gw-primary text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all font-sans"
              >
                {{ isLoading ? 'Sending...' : 'Send OTP' }}
              </button>
            </div>

            <!-- Demo Mode Sections -->
            <div *ngIf="demo.isDemo" class="space-y-4 pt-2">
              <div class="relative py-2">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gw-card-border"></div></div>
                <div class="relative flex justify-center text-[10px] uppercase"><span class="px-2 bg-gw-card-bg text-gw-text-muted font-black tracking-widest">Demo Quick Roles</span></div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  (click)="loginAsDemoUser()"
                  class="h-[52px] border-2 border-gw-primary text-gw-primary font-black uppercase italic tracking-widest rounded-2xl hover:bg-gw-primary/5 active:scale-95 transition-all text-[10px]"
                >
                  Login as User
                </button>
                <button 
                  type="button" 
                  (click)="loginAsDemoAdmin()"
                  class="h-[52px] border-2 border-gw-text text-gw-text font-black uppercase italic tracking-widest rounded-2xl hover:bg-gw-text/5 active:scale-95 transition-all text-[10px]"
                >
                  Login as Admin
                </button>
              </div>
            </div>
          </form>

          <div class="mt-8 text-center border-t border-gw-bg pt-6">
            <p class="text-sm font-medium text-gw-text-muted">
              New to GoWithFlow? 
              <br>
              <a routerLink="/auth/register" class="text-gw-accent font-bold hover:underline">Register here</a>
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  public demo = inject(DemoService);

  loginForm = this.fb.group({
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  isLoading = false;

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const mobile = this.loginForm.get('mobileNumber')?.value!;
      this.auth.requestOtp(mobile).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/auth/otp-verify'], { queryParams: { mobile } });
        },
        error: () => this.isLoading = false
      });
    }
  }

  loginAsDemoUser() {
    this.auth.loginAsDemo(this.demo.getUsers()[1]);
    this.router.navigate(['/user/dashboard']);
  }

  loginAsDemoAdmin() {
    this.auth.loginAsDemo(this.demo.getUsers()[0]);
    this.router.navigate(['/admin/dashboard']);
  }
}

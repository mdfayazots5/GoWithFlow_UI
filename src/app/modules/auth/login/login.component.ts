import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Phone, ShieldCheck, Sparkles, ArrowRight } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-ls-bg">
      <div class="w-full max-w-md space-y-8 animate-in fade-in duration-700">
        <!-- Logo Area -->
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 bg-ls-primary rounded-3xl flex items-center justify-center shadow-xl shadow-ls-primary/20 rotate-3">
            <span class="text-white font-black italic text-4xl">F</span>
          </div>
          <div class="text-center">
            <h1 class="text-4xl font-black italic uppercase tracking-tighter text-ls-text">GoWithFlow</h1>
            <p class="text-ls-text-muted font-bold text-xs uppercase tracking-widest mt-1">Real-time English Fluency Engine</p>
          </div>
        </div>

        <div class="card p-8 space-y-8 shadow-2xl shadow-black/5 bg-white relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-32 h-32 bg-ls-accent/10 rounded-full blur-3xl"></div>
          
          <div class="space-y-2 relative">
            <h2 class="text-2xl font-black italic text-ls-text uppercase tracking-tight">{{ step === 1 ? 'Welcome Back' : 'Verify Identity' }}</h2>
            <p class="text-ls-text-muted text-xs font-semibold">{{ step === 1 ? 'Enter your mobile number to access your portal' : 'We sent a 6-digit code to your mobile' }}</p>
          </div>

          <!-- Step 1: Input Mobile -->
          <div *ngIf="step === 1" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Mobile Number</label>
              <div class="relative">
                <i-lucide [img]="PhoneIcon" size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                <input 
                  type="tel" 
                  [(ngModel)]="mobileNumber"
                  placeholder="98765 43210"
                  class="input-field pl-12 h-14 text-lg font-bold"
                >
              </div>
            </div>
            <button 
              (click)="requestOtp()"
              [disabled]="loading || mobileNumber.length < 10"
              class="w-full btn-primary h-14 text-lg gap-3"
            >
              {{ loading ? 'Synchronizing...' : 'Request OTP' }}
              <i-lucide *ngIf="!loading" [img]="NextIcon" size="20"></i-lucide>
            </button>
          </div>

          <!-- Step 2: Verify OTP -->
          <div *ngIf="step === 2" class="space-y-6">
            <div class="flex justify-between gap-2">
               <input 
                 *ngFor="let i of [0,1,2,3,4,5]" 
                 type="text" 
                 maxlength="1"
                 [(ngModel)]="otpDigits[i]"
                 (keyup)="onOtpInput($event, i)"
                 class="w-12 h-14 bg-ls-bg border-none rounded-xl text-center text-2xl font-black italic text-ls-primary outline-none focus:ring-2 focus:ring-ls-primary/20"
               >
            </div>
            
            <button 
              (click)="verifyOtp()"
              [disabled]="loading"
              class="w-full btn-primary h-14 text-lg gap-3"
            >
               {{ loading ? 'Validating...' : 'Secure Access' }}
               <i-lucide *ngIf="!loading" [img]="ShieldIcon" size="20"></i-lucide>
            </button>

            <button 
              (click)="step = 1"
              class="w-full text-xs font-black uppercase tracking-widest text-ls-text-muted hover:text-ls-primary transition-all underline decoration-ls-accent"
            >
              Change Mobile Number
            </button>
          </div>

          <div class="flex items-center gap-2 pt-4 justify-center">
             <i-lucide [img]="SparkleIcon" size="14" class="text-ls-accent"></i-lucide>
             <span class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Proudly Crafted for Families</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  readonly PhoneIcon = Phone;
  readonly ShieldIcon = ShieldCheck;
  readonly SparkleIcon = Sparkles;
  readonly NextIcon = ArrowRight;

  step = 1;
  loading = false;
  mobileNumber = '';
  otpDigits = ['', '', '', '', '', ''];

  constructor(private auth: AuthService, private router: Router) {}

  requestOtp() {
    this.loading = true;
    this.auth.requestOtp(this.mobileNumber).subscribe({
      next: () => {
        this.step = 2;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onOtpInput(event: any, index: number) {
    if (event.key >= 0 && event.key <= 9 && index < 5) {
      const nextInput = event.target.nextElementSibling;
      if (nextInput) nextInput.focus();
    }
  }

  verifyOtp() {
    this.loading = true;
    const code = this.otpDigits.join('');
    this.auth.verifyOtp(this.mobileNumber, code).subscribe({
      next: (res) => {
        this.loading = false;
        
        // Handle new user registration flow
        if (res.isRegistrationRequired) {
          sessionStorage.setItem('temp_reg_mobile', this.mobileNumber);
          this.router.navigate(['/auth/register']);
          return;
        }

        if (res.user?.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/user/dashboard']);
        }
      },
      error: () => this.loading = false
    });
  }
}

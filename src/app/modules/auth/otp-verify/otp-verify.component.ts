import { Component, OnInit, OnDestroy, inject, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { DemoService } from '@core/services/demo.service';
import { LucideAngularModule, ChevronLeft } from 'lucide-angular';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gw-bg font-sans">
      <div class="w-full max-w-md space-y-8">
        <a routerLink="/auth/login" class="flex items-center gap-2 text-gw-text-muted hover:text-gw-text transition-colors group">
          <i-lucide [img]="BackIcon" size="18" class="group-hover:-translate-x-1 transition-transform"></i-lucide>
          <span class="text-xs font-black uppercase tracking-widest italic">Change Number</span>
        </a>

        <div class="text-center space-y-2">
          <h1 class="text-3xl font-black text-gw-text italic tracking-tight">Enter OTP</h1>
          <p class="text-gw-text-muted font-medium">Sent to +91 {{ mobileNumber() }}</p>
        </div>

        <div class="card bg-gw-card-bg border-gw-card-border shadow-sm p-8 rounded-3xl">
          <form (ngSubmit)="onSubmit()" class="space-y-8">
            <div class="flex justify-between gap-2">
              <input 
                *ngFor="let digit of [0,1,2,3,4,5]; let i = index"
                #otpBox
                type="text"
                maxlength="1"
                class="w-[48px] h-[56px] bg-gw-bg/50 border-2 border-gw-card-border rounded-xl text-center text-xl font-black text-gw-text focus:border-gw-primary focus:ring-0 outline-none transition-all"
                (input)="onInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                inputmode="numeric"
                autocomplete="one-time-code"
              >
            </div>

            <div class="text-center space-y-4">
              <div class="flex flex-col items-center gap-1">
                <p class="text-2xl font-black text-gw-text italic tabular-nums tracking-tighter">{{ timeLeftFormatted() }}</p>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gw-text-muted">Wait for code</p>
              </div>

              <button 
                type="button"
                [disabled]="timeLeft() > 0"
                class="text-xs font-black uppercase tracking-widest text-gw-accent disabled:text-gw-text-muted transition-colors hover:scale-105 active:scale-95"
                (click)="resendOtp()"
              >
                Resend OTP
              </button>
            </div>

            <button 
              type="submit" 
              [disabled]="!isOtpComplete() || isLoading"
              class="w-full h-[52px] bg-gw-primary text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
              {{ isLoading ? 'Verifying...' : 'Verify & Login' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { @apply bg-white border border-gw-card-border rounded-3xl p-8 shadow-sm; }
  `]
})
export class OtpVerifyComponent implements OnInit, OnDestroy {
  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  public demo = inject(DemoService);

  readonly BackIcon = ChevronLeft;

  mobileNumber = signal<string>('');
  timeLeft = signal<number>(300); // 5 minutes (300s)
  isLoading = false;
  otpDigits: string[] = ['', '', '', '', '', ''];
  
  private timerSub?: Subscription;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (!params['mobile']) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.mobileNumber.set(params['mobile']);
    });

    this.startTimer();
    
    // Auto focus first box after view init
    setTimeout(() => {
      this.otpBoxes.first?.nativeElement.focus();
    }, 500);
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  startTimer() {
    this.timerSub?.unsubscribe();
    this.timeLeft.set(300);
    this.timerSub = interval(1000).subscribe(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.update(t => t - 1);
      } else {
        this.timerSub?.unsubscribe();
      }
    });
  }

  timeLeftFormatted() {
    const mins = Math.floor(this.timeLeft() / 60);
    const secs = this.timeLeft() % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onInput(event: any, index: number) {
    const val = event.target.value;
    // Keep only the last digit if multiple entered (e.g. paste)
    const cleaned = val.replace(/[^0-9]/g, '').slice(-1);
    event.target.value = cleaned;
    
    if (cleaned) {
      this.otpDigits[index] = cleaned;
      if (index < 5) {
        this.otpBoxes.toArray()[index + 1].nativeElement.focus();
      }
    }
  }

  onKeyDown(event: any, index: number) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      this.otpDigits[index - 1] = '';
      const prevBox = this.otpBoxes.toArray()[index - 1].nativeElement;
      prevBox.value = '';
      prevBox.focus();
    }
  }

  isOtpComplete() {
    return this.otpDigits.every(d => d !== '');
  }

  resendOtp() {
    if (this.timeLeft() === 0) {
      this.auth.requestOtp(this.mobileNumber()).subscribe(() => {
        this.startTimer();
        this.otpDigits = ['', '', '', '', '', ''];
        this.otpBoxes.forEach(box => box.nativeElement.value = '');
        this.otpBoxes.first.nativeElement.focus();
      });
    }
  }

  onSubmit() {
    if (this.isOtpComplete() || this.demo.isDemo) {
      this.isLoading = true;
      const otp = this.otpDigits.join('');
      this.auth.verifyOtp(this.mobileNumber(), otp).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/user/dashboard']);
          }
        },
        error: () => this.isLoading = false
      });
    }
  }
}

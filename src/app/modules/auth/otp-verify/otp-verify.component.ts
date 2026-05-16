import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ShieldCheck, ArrowLeft } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-ls-bg">
      <div class="w-full max-w-md space-y-8 animate-in fade-in duration-700">
        <div class="card p-8 space-y-8 shadow-2xl shadow-black/5 bg-white">
          <div class="space-y-2">
            <h2 class="text-2xl font-black italic text-ls-text uppercase tracking-tight">Verify Identity</h2>
            <p class="text-ls-text-muted text-xs font-semibold">We sent a 6-digit code to {{ mobileNumber }}</p>
          </div>

          <div class="space-y-6">
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
              (click)="goBack()"
              class="w-full text-xs font-black uppercase tracking-widest text-ls-text-muted hover:text-ls-primary transition-all flex items-center justify-center gap-2"
            >
              <i-lucide [img]="BackIcon" size="14"></i-lucide>
              Change Mobile Number
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OtpVerifyComponent implements OnInit {
  readonly ShieldIcon = ShieldCheck;
  readonly BackIcon = ArrowLeft;

  loading = false;
  mobileNumber = '';
  otpDigits = ['', '', '', '', '', ''];

  constructor(
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.mobileNumber = this.route.snapshot.queryParamMap.get('mobile') || '';
    if (!this.mobileNumber && !environment.isDemo) {
      this.router.navigate(['/auth/login']);
    }
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

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gw-bg">
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <h1 class="text-[32px] font-black text-gw-primary italic tracking-tight">GoWithFlow</h1>
          <p class="text-gw-text-muted font-medium mt-2">Speak. Together. Grow.</p>
        </div>

        <div class="bg-white border border-gw-card-border rounded-3xl p-8 shadow-sm">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <div class="space-y-2">
              <label class="text-xs font-black uppercase tracking-widest text-gw-text-muted px-1">Username</label>
              <input
                type="tel"
                formControlName="mobileNumber"
                class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all"
                placeholder="Enter your mobile number"
                maxlength="10"
              >
              <p *ngIf="loginForm.get('mobileNumber')?.touched && loginForm.get('mobileNumber')?.invalid"
                 class="text-[10px] font-bold text-gw-error px-1 uppercase tracking-wider italic">
                Enter a valid 10-digit mobile number
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-black uppercase tracking-widest text-gw-text-muted px-1">Password</label>
              <input
                type="password"
                formControlName="password"
                class="w-full h-14 bg-gw-bg/50 border border-gw-card-border rounded-2xl px-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all"
                placeholder="Enter password"
              >
              <p *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid"
                 class="text-[10px] font-bold text-gw-error px-1 uppercase tracking-wider italic">
                Password is required
              </p>
            </div>

            <p *ngIf="errorMessage()" class="text-xs font-bold text-gw-error text-center uppercase tracking-wider italic">
              {{ errorMessage() }}
            </p>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                style="background-color: var(--gw-primary);"
                class="w-full h-[52px] text-white font-black uppercase italic tracking-widest rounded-2xl hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all font-sans"
              >
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = signal<string>('');

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
      this.errorMessage.set('');
      const mobile = this.loginForm.get('mobileNumber')!.value!;
      const password = this.loginForm.get('password')!.value!;

      this.auth.login(mobile, password).subscribe({
        next: (res) => {
          this.isLoading = false;
          const role = res.data?.role ?? this.auth.getRole();
          if (role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/user/dashboard']);
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          const body = err?.error;
          const msg = (body?.errors?.[0]) || body?.message || 'Invalid credentials. Please try again.';
          this.errorMessage.set(msg);
        }
      });
    }
  }
}

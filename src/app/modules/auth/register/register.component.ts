import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, User, Mail, Globe, Save } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-ls-bg">
      <div class="w-full max-w-md space-y-8 animate-in fade-in duration-700">
        <div class="card p-8 space-y-8 shadow-2xl shadow-black/5 bg-white">
          <div class="space-y-2">
            <h2 class="text-2xl font-black italic text-ls-text uppercase tracking-tight">Complete Profile</h2>
            <p class="text-ls-text-muted text-xs font-semibold">Tell us a bit about yourself to get started</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Full Name</label>
              <div class="relative">
                <i-lucide [img]="UserIcon" size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                <input 
                  type="text" 
                  formControlName="fullName"
                  placeholder="John Doe"
                  class="input-field pl-12 h-14 font-bold"
                >
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Email (Optional)</label>
              <div class="relative">
                <i-lucide [img]="MailIcon" size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                <input 
                  type="email" 
                  formControlName="email"
                  placeholder="john@example.com"
                  class="input-field pl-12 h-14 font-bold"
                >
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Native Language</label>
              <div class="relative">
                <i-lucide [img]="GlobeIcon" size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
                <select 
                  formControlName="language"
                  class="input-field pl-12 h-14 font-bold appearance-none bg-white"
                >
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="None">English Only</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              [disabled]="loading || registerForm.invalid"
              class="w-full btn-primary h-14 text-lg gap-3"
            >
               {{ loading ? 'Saving...' : 'Finish Registration' }}
               <i-lucide *ngIf="!loading" [img]="SaveIcon" size="20"></i-lucide>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent implements OnInit {
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly GlobeIcon = Globe;
  readonly SaveIcon = Save;

  registerForm: FormGroup;
  loading = false;
  mobileNumber = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      language: ['Telugu', [Validators.required]]
    });
  }

  ngOnInit() {
    this.mobileNumber = sessionStorage.getItem('temp_reg_mobile') || '';
    if (!this.mobileNumber) {
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      const payload = {
        ...this.registerForm.value,
        mobileNumber: this.mobileNumber
      };

      // In a real app, this would call authService.register(payload)
      // For now, we simulate success
      setTimeout(() => {
        this.loading = false;
        this.router.navigate(['/user/dashboard']);
      }, 1000);
    }
  }
}

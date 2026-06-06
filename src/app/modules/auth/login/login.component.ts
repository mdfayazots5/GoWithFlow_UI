import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Smartphone, Lock, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../auth.service';
import { LoaderService } from '@core/services/loader.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Icons
  readonly PhoneIcon = Smartphone;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loader = inject(LoaderService);

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
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage.set('');
      // Branded full-screen loader covers the auth round-trip AND the redirect so the user
      // never sees a half-painted landing page. The destination screen's own skeleton takes
      // over once its data starts loading; we hide right after navigation is issued.
      this.loader.show('Signing you in…');
      const mobile = this.loginForm.get('mobileNumber')!.value!;
      const password = this.loginForm.get('password')!.value!;

      this.auth.login(mobile, password).subscribe({
        next: (res) => {
          this.isLoading = false;
          const role = res.data?.role ?? this.auth.getRole();
          const target = role === 'ADMIN' ? ['/admin/dashboard'] : ['/user/dashboard'];
          this.router.navigate(target).finally(() => this.loader.hide());
        },
        error: (err: any) => {
          this.isLoading = false;
          this.loader.hide();
          const body = err?.error;
          const msg = (body?.errors?.[0]) || body?.message || 'Invalid credentials. Please try again.';
          this.errorMessage.set(msg);
        }
      });
    }
  }
}

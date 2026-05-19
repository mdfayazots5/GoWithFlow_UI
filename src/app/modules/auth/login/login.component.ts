import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
    this.loginForm.markAllAsTouched();
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

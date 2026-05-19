// File: src/app/shared/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services/toast.service';
import { LucideAngularModule, CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  styleUrl: './toast.component.scss',
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast) {
        <div class="toast" [ngClass]="'toast-' + toast.type">
          <div [ngSwitch]="toast.type" class="toast-icon" [ngClass]="'toast-icon-' + toast.type">
            <i-lucide *ngSwitchCase="'success'" [img]="CheckIcon" size="18"></i-lucide>
            <i-lucide *ngSwitchCase="'error'"   [img]="ErrorIcon" size="18"></i-lucide>
            <i-lucide *ngSwitchCase="'info'"    [img]="InfoIcon"  size="18"></i-lucide>
            <i-lucide *ngSwitchCase="'warning'" [img]="WarnIcon"  size="18"></i-lucide>
          </div>
          <p class="toast-message">{{ toast.message }}</p>
          <button class="toast-close" (click)="removeToast(toast)">
            <i-lucide [img]="CloseIcon" size="16"></i-lucide>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  readonly CheckIcon = CheckCircle;
  readonly ErrorIcon = XCircle;
  readonly InfoIcon = Info;
  readonly WarnIcon = AlertTriangle;
  readonly CloseIcon = X;

  removeToast(toast: Toast) {
    this.toastService.toasts.update(current => current.filter(t => t !== toast));
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast) {
        <div 
          class="pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border min-w-[280px] max-w-sm animate-in slide-in-from-right duration-300"
          [class.bg-white]="true"
          [class.border-ls-success]="toast.type === 'success'"
          [class.border-ls-error]="toast.type === 'error'"
          [class.border-ls-warning]="toast.type === 'warning'"
          [class.border-ls-primary]="toast.type === 'info'"
        >
          <div class="shrink-0" [ngSwitch]="toast.type">
            <i-lucide *ngSwitchCase="'success'" [img]="SuccessIcon" class="text-ls-success" size="20"></i-lucide>
            <i-lucide *ngSwitchCase="'error'" [img]="ErrorIcon" class="text-ls-error" size="20"></i-lucide>
            <i-lucide *ngSwitchCase="'warning'" [img]="WarningIcon" class="text-ls-warning" size="20"></i-lucide>
            <i-lucide *ngSwitchCase="'info'" [img]="InfoIcon" class="text-ls-primary" size="20"></i-lucide>
          </div>
          
          <div class="flex-1">
            <p class="text-sm font-bold text-ls-text">{{ toast.message }}</p>
          </div>

          <button (click)="remove(toast)" class="text-ls-text-muted hover:text-ls-text shrink-0">
            <i-lucide [img]="CloseIcon" size="16"></i-lucide>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  
  readonly SuccessIcon = CheckCircle;
  readonly ErrorIcon = AlertCircle;
  readonly WarningIcon = AlertTriangle;
  readonly InfoIcon = Info;
  readonly CloseIcon = X;

  remove(toast: any) {
    // Calling internal remove via public if needed but service handles it
    // For manual close we could add a method to service
  }
}

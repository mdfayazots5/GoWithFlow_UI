// File: src/app/shared/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services/toast.service';
import { LucideAngularModule, CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4">
      @for (toast of toasts(); track toast) {
        <div 
          class="w-full bg-white border-l-4 shadow-2xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-auto"
          [class.border-gw-success]="toast.type === 'success'"
          [class.border-gw-error]="toast.type === 'error'"
          [class.border-gw-primary]="toast.type === 'info'"
          [class.border-gw-warning]="toast.type === 'warning'"
        >
          <div [ngSwitch]="toast.type" class="shrink-0 flex items-center justify-center">
             <i-lucide *ngSwitchCase="'success'" [img]="CheckIcon" size="18" class="text-gw-success"></i-lucide>
             <i-lucide *ngSwitchCase="'error'" [img]="ErrorIcon" size="18" class="text-gw-error"></i-lucide>
             <i-lucide *ngSwitchCase="'info'" [img]="InfoIcon" size="18" class="text-gw-primary"></i-lucide>
             <i-lucide *ngSwitchCase="'warning'" [img]="WarnIcon" size="18" class="text-gw-warning"></i-lucide>
          </div>
          
          <p class="text-[13px] font-bold text-gw-text italic flex-1 leading-tight">{{ toast.message }}</p>
          
          <button (click)="toastService.toasts.set(toasts().filter(t => t !== toast))" class="text-gw-text-muted hover:text-gw-text shrink-0">
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
  toasts = this.toastService.toasts;

  readonly CheckIcon = CheckCircle;
  readonly ErrorIcon = XCircle;
  readonly InfoIcon = Info;
  readonly WarnIcon = AlertTriangle;
  readonly CloseIcon = X;
}

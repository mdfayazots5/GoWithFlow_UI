// File: src/app/shared/components/loader/loader.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '@core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="fixed inset-0 z-[10000] bg-white/85 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-200">
         <div class="w-12 h-12 border-[3px] border-gw-bg border-t-gw-primary rounded-full animate-spin"></div>
         <p class="text-[10px] font-black uppercase tracking-widest italic text-gw-primary animate-pulse">Syncing your flow...</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LoaderComponent {
  isLoading = inject(LoaderService).isLoading;
}

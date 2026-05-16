import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';
import { LucideAngularModule, Info } from 'lucide-angular';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="isDemo" class="h-10 bg-ls-accent flex items-center justify-center gap-2 text-white px-4 overflow-hidden relative">
      <div class="flex items-center gap-2 animate-in slide-in-from-left duration-700">
         <i-lucide [img]="InfoIcon" size="14"></i-lucide>
         <p class="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
            Demo Mode Active • Simulation Engine Running • Data is Static
         </p>
      </div>
      <div class="absolute right-4 hidden md:block">
         <span class="text-[8px] font-bold opacity-50 uppercase italic">v1.0.4-beta</span>
      </div>
    </div>
  `,
  styles: []
})
export class DemoBannerComponent {
  readonly InfoIcon = Info;
  isDemo = environment.isDemo;
}

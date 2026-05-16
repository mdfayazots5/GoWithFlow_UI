// File: src/app/shared/components/demo-banner/demo-banner.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@env/environment';
import { LucideAngularModule, Info, X } from 'lucide-angular';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isDemo && !isDismissed() && !isFocusScreen()) {
      <div class="h-9 bg-[#FEF3C7] text-[#92400E] border-b border-[#FDE68A] flex items-center justify-between px-4 z-[9998] relative animate-in slide-in-from-top duration-300">
         <div class="flex items-center gap-2">
            <i-lucide [img]="InfoIcon" size="14"></i-lucide>
            <p class="text-[11px] font-bold uppercase tracking-tight italic">
               Demo Mode — Using sample data. Nothing is saved to servers.
            </p>
         </div>
         <button (click)="dismiss()" class="p-1 hover:bg-[#FDE68A] rounded-lg transition-colors">
            <i-lucide [img]="CloseIcon" size="14"></i-lucide>
         </button>
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class DemoBannerComponent implements OnInit {
  private router = inject(Router);

  isDemo = environment.isDemo;
  isDismissed = signal(false);
  isFocusScreen = signal(false);

  readonly InfoIcon = Info;
  readonly CloseIcon = X;

  ngOnInit() {
    const dismissed = sessionStorage.getItem('demo_banner_dismissed');
    if (dismissed === 'true') this.isDismissed.set(true);

    this.updateFocusScreen(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.updateFocusScreen(e.url);
    });
  }

  private updateFocusScreen(url: string) {
    this.isFocusScreen.set(url.includes('/live-session') || url.includes('/repractice'));
  }

  dismiss() {
    this.isDismissed.set(true);
    sessionStorage.setItem('demo_banner_dismissed', 'true');
  }
}

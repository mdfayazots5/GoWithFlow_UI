import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LogOut, ChevronLeft } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="h-20 bg-white border-b border-ls-card-border flex items-center justify-between px-6 z-40 relative">
      <div class="flex items-center gap-4">
        <button *ngIf="showBack" (click)="onBack()" class="p-2 -ml-2 text-ls-text-muted hover:text-ls-primary transition-all">
           <i-lucide [img]="BackIcon" size="20"></i-lucide>
        </button>
        
        <div class="flex flex-col">
           <h2 class="text-lg font-black italic tracking-tighter uppercase text-ls-text leading-none">{{ title }}</h2>
           <p *ngIf="subtitle" class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted mt-1">{{ subtitle }}</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
         <ng-content select="[actions]"></ng-content>
         <div class="w-10 h-10 bg-ls-bg rounded-xl border border-ls-card-border flex items-center justify-center overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi" alt="avatar" class="w-full h-full object-cover">
         </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  readonly BackIcon = ChevronLeft;

  @Input() title = 'GoWithFlow';
  @Input() subtitle = '';
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();

  constructor(private router: Router) {}

  onBack() {
    if (this.back.observed) {
      this.back.emit();
    } else {
      window.history.back();
    }
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, PlayCircle, BookOpen, User } from 'lucide-angular';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-ls-card-border flex items-center justify-around px-4 z-50 md:hidden">
      <a routerLink="/user/dashboard" routerLinkActive="text-ls-primary" class="flex flex-col items-center gap-1 text-ls-text-muted transition-all active:scale-95">
        <i-lucide [img]="HomeIcon" size="24"></i-lucide>
        <span class="text-[10px] font-black uppercase tracking-widest">Home</span>
      </a>
      <a routerLink="/session/join" routerLinkActive="text-ls-primary" class="flex flex-col items-center gap-1 text-ls-text-muted transition-all active:scale-95">
        <i-lucide [img]="PlayIcon" size="24"></i-lucide>
        <span class="text-[10px] font-black uppercase tracking-widest">Play</span>
      </a>
      <a routerLink="/scripts" routerLinkActive="text-ls-primary" class="flex flex-col items-center gap-1 text-ls-text-muted transition-all active:scale-95">
        <i-lucide [img]="BookIcon" size="24"></i-lucide>
        <span class="text-[10px] font-black uppercase tracking-widest">Scripts</span>
      </a>
      <a routerLink="/user/profile" routerLinkActive="text-ls-primary" class="flex flex-col items-center gap-1 text-ls-text-muted transition-all active:scale-95">
        <i-lucide [img]="UserIcon" size="24"></i-lucide>
        <span class="text-[10px] font-black uppercase tracking-widest">Profile</span>
      </a>
    </nav>
  `,
  styles: []
})
export class BottomNavComponent {
  readonly HomeIcon = Home;
  readonly PlayIcon = PlayCircle;
  readonly BookIcon = BookOpen;
  readonly UserIcon = User;
}

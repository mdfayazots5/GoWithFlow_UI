// File: src/app/shared/components/bottom-nav/bottom-nav.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Home, Play, BookOpen, User } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, RouterLinkActive],
  template: `
    @if (showNav()) {
      <nav class="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gw-card-border flex items-center justify-around px-4 z-50 animate-in slide-in-from-bottom duration-300">
         @for (item of navItems; track item.label) {
            <a 
              [routerLink]="item.path" 
              routerLinkActive="active"
              class="flex flex-col items-center justify-center gap-1.5 w-16 h-full text-gw-text-muted hover:text-gw-primary transition-all relative group"
            >
               <div class="w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-gw-bg transition-all nav-icon">
                  <i-lucide [img]="item.icon" size="24"></i-lucide>
               </div>
               <span class="text-[8px] font-black uppercase tracking-widest italic opacity-60 group-hover:opacity-100">{{ item.label }}</span>
               
               <!-- Active Indicator -->
               <div class="absolute top-0 left-0 right-0 h-[3px] bg-gw-primary rounded-b-full scale-x-0 transition-transform active-indicator"></div>
            </a>
         }
      </nav>
    }
  `,
  styles: [`
    :host { display: block; }
    .active { color: #3D5A99 !important; }
    .active .active-indicator { transform: scaleX(1); }
    .active .nav-icon { background-color: rgba(61, 90, 153, 0.1); transform: scale(1.15); color: #3D5A99; }
    .active span { opacity: 1; font-weight: 900; }
  `]
})
export class BottomNavComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly HomeIcon = Home;
  readonly PlayIcon = Play;
  readonly ScriptsIcon = BookOpen;
  readonly ProfileIcon = User;

  navItems = [
    { label: 'Home', path: '/user/dashboard', icon: Home },
    { label: 'Play', path: '/session/join', icon: Play },
    { label: 'Scripts', path: '/scripts', icon: BookOpen },
    { label: 'Profile', path: '/user/profile', icon: User }
  ];

  showNav(): boolean {
    const url = this.router.url;
    const hideOn = ['/auth', '/live-session', '/repractice', '/admin'];
    const role = this.auth.getRole();
    return role === 'USER' && !hideOn.some(path => url.includes(path));
  }
}

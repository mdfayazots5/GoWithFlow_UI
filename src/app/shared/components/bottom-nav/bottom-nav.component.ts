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
      <nav class="bottom-nav">
         @for (item of navItems; track item.label) {
            <a 
              [routerLink]="item.path" 
              routerLinkActive="active"
              class="nav-tab"
            >
               <i-lucide [img]="item.icon" size="22"></i-lucide>
               <span>{{ item.label }}</span>
            </a>
         }
      </nav>
    }
  `,
  styleUrl: './bottom-nav.component.scss'
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

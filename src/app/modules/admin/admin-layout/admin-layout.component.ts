import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@modules/auth/auth.service';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  pageTitle       = signal('Dashboard');
  profileMenuOpen = signal(false);

  adminName   = 'GoWithFlow Admin';
  adminAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';

  get adminInitials(): string {
    return this.adminName
      .split(' ')
      .filter(w => w.length > 0)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let r = this.route.root;
        while (r.firstChild) r = r.firstChild;
        return r.snapshot.data['title'] || 'Admin';
      })
    ).subscribe(title => this.pageTitle.set(title));
  }

  toggleProfileMenu() {
    this.profileMenuOpen.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.profileMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
  }
}

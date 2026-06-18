import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, BookOpen, BarChart3, UsersRound, LogOut } from 'lucide-angular';
import { AuthService } from '@modules/auth/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { BottomNavComponent, BottomNavItem } from '@shared/components/bottom-nav/bottom-nav.component';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, LucideAngularModule, UserAvatarComponent, BottomNavComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  /** Admin-specific tabs rendered through the shared BottomNavComponent so the
   *  footer matches the user shell's design system exactly. */
  readonly adminNavItems: BottomNavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, exact: false },
    { label: 'Users',     path: '/admin/users',     icon: Users,           exact: false },
    { label: 'Scripts',   path: '/admin/scripts',   icon: BookOpen,        exact: false },
    { label: 'Reports',   path: '/admin/reports',   icon: BarChart3,       exact: false },
    { label: 'Cohorts',   path: '/admin/cohorts',   icon: UsersRound,      exact: false }
  ];

  private auth      = inject(AuthService);
  private userState = inject(UserStateService);
  private router    = inject(Router);
  private route     = inject(ActivatedRoute);

  readonly LogOutIcon = LogOut;

  pageTitle       = signal('Dashboard');
  profileMenuOpen = signal(false);

  // Resolved presigned URL from API — not the raw R2 key stored in localStorage at login
  readonly adminAvatarUrl = computed(() => this.userState.avatarUrl());

  readonly adminName = computed(() =>
    this.userState.profile()?.fullName ?? this.auth.currentUser?.fullName ?? 'Admin'
  );

  readonly adminInitials = computed(() =>
    this.adminName()
      .split(' ')
      .filter((w: string) => w.length > 0)
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('')
  );

  constructor() {
    // Load admin's own profile from API so avatarUrl is a presigned URL, not the raw R2 key
    this.userState.refreshProfile();

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

import { Injectable, inject, signal, computed } from '@angular/core';
import { UserService } from './user.service';
import { UserProfile, StreakData } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userService = inject(UserService);

  // ── Public signals — read directly by components ──────────────
  readonly profile   = signal<UserProfile | null>(null);
  readonly dashboard = signal<any>(null);
  readonly streak    = signal<StreakData | null>(null);

  /** Latest presigned avatar URL for the logged-in user. Updates on every profile load. */
  readonly avatarUrl = computed(() => this.profile()?.avatar ?? null);

  readonly profileLoading   = signal(false);
  readonly dashboardLoading = signal(false);

  private profileLoaded   = false;
  private dashboardLoaded = false;
  private streakLoaded    = false;

  private _bootstrapped = false;
  get isBootstrapped() { return this._bootstrapped; }

  bootstrap(): void {
    if (this._bootstrapped) return;
    this._bootstrapped = true;
    this._loadProfile();
    this._loadDashboard();
    this._loadStreak();
  }

  setProfile(p: UserProfile): void {
    this.profile.set(p);
    this._syncStoredAvatar(p.avatar ?? null);
  }

  refreshProfile(): void {
    this.profileLoaded = false;
    this._loadProfile();
  }

  refreshDashboard(): void {
    this.dashboardLoaded = false;
    this._loadDashboard();
  }

  /** Immediately update the avatar URL in state and localStorage after upload. */
  updateAvatar(presignedUrl: string): void {
    this.profile.update(p => p ? { ...p, avatar: presignedUrl } : p);
    this._syncStoredAvatar(presignedUrl);
  }

  reset(): void {
    this.profile.set(null);
    this.dashboard.set(null);
    this.streak.set(null);
    this.profileLoaded   = false;
    this.dashboardLoaded = false;
    this.streakLoaded    = false;
    this._bootstrapped   = false;
  }

  private _loadProfile(): void {
    if (this.profileLoaded) return;
    this.profileLoading.set(true);
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.profileLoaded = true;
        this.profileLoading.set(false);
        // Keep localStorage in sync with the latest presigned URL from the API
        this._syncStoredAvatar(res.avatar ?? null);
      },
      error: () => this.profileLoading.set(false)
    });
  }

  private _loadDashboard(): void {
    if (this.dashboardLoaded) return;
    this.dashboardLoading.set(true);
    this.userService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res);
        this.dashboardLoaded = true;
        this.dashboardLoading.set(false);
      },
      error: () => this.dashboardLoading.set(false)
    });
  }

  private _loadStreak(): void {
    if (this.streakLoaded) return;
    this.userService.getStreakData().subscribe({
      next: (s) => {
        this.streak.set(s);
        this.streakLoaded = true;
      },
      error: () => {}
    });
  }

  /** Write latest avatarUrl back to gwf_user so currentUser stays fresh between refreshes. */
  private _syncStoredAvatar(avatarUrl: string | null): void {
    try {
      const raw = localStorage.getItem('gwf_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      user.avatarUrl = avatarUrl;
      localStorage.setItem('gwf_user', JSON.stringify(user));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}

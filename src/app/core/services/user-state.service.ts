// File: src/app/core/services/user-state.service.ts
//
// ARCHITECTURE: Single source of truth for all common user data.
// bootstrap() is called ONCE after login / page-refresh confirmation.
// All components read signals — zero per-navigation API calls.
//
import { Injectable, inject, signal } from '@angular/core';
import { UserService } from './user.service';
import { UserProfile, StreakData } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userService = inject(UserService);

  // ── Public signals — read directly by components ──────────────
  readonly profile  = signal<UserProfile | null>(null);
  readonly dashboard = signal<any>(null);
  readonly streak   = signal<StreakData | null>(null);

  // Loading indicators (for skeleton/spinner states in templates)
  readonly profileLoading  = signal(false);
  readonly dashboardLoading = signal(false);

  // ── Internal flags — prevent duplicate HTTP calls ─────────────
  private profileLoaded   = false;
  private dashboardLoaded = false;
  private streakLoaded    = false;

  /** True after bootstrap() has been called at least once per session */
  private _bootstrapped = false;
  get isBootstrapped() { return this._bootstrapped; }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Call once after login is confirmed (AppComponent on NavigationEnd).
   * Idempotent — subsequent calls are a no-op (guarded by _bootstrapped flag).
   */
  bootstrap(): void {
    if (this._bootstrapped) return;
    this._bootstrapped = true;
    this._loadProfile();
    this._loadDashboard();
    this._loadStreak();
  }

  /**
   * Directly push an updated profile into the signal.
   * Use after a successful updateProfile() HTTP call so the UI
   * reflects the change immediately — no extra GET required.
   */
  setProfile(p: UserProfile): void {
    this.profile.set(p);
  }

  /**
   * Force re-fetch profile from the server.
   * Call when the user edits their name or other profile fields.
   */
  refreshProfile(): void {
    this.profileLoaded = false;
    this._loadProfile();
  }

  /**
   * Force re-fetch dashboard from the server.
   * Call after a session ends so stats and pending items update.
   */
  refreshDashboard(): void {
    this.dashboardLoaded = false;
    this._loadDashboard();
  }

  /**
   * Wipe all cached state and reset loaded flags.
   * Called by AuthService.logout() so the next login starts clean.
   */
  reset(): void {
    this.profile.set(null);
    this.dashboard.set(null);
    this.streak.set(null);
    this.profileLoaded   = false;
    this.dashboardLoaded = false;
    this.streakLoaded    = false;
    this._bootstrapped   = false;
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE LOADERS  (each guarded by a loaded flag)
  // ─────────────────────────────────────────────────────────────

  private _loadProfile(): void {
    if (this.profileLoaded) return;
    this.profileLoading.set(true);
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.profileLoaded = true;
        this.profileLoading.set(false);
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
}

// File: src/app/modules/user/dashboard/user-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Flame, Zap, Trophy, TrendingUp, Play, ChevronRight, Book, AlertCircle, Gamepad2, PlusCircle } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);

  user = signal(this.auth.currentUser);
  dashboard = signal<any>(null);
  today = new Date();
  firstName = computed(() => {
    const fullName = this.user()?.fullName?.trim();
    return fullName ? fullName.split(/\s+/)[0] : 'Member';
  });

  readonly FlameIcon = Flame;
  readonly ZapIcon = Zap;
  readonly TrophyIcon = Trophy;
  readonly TrendIcon = TrendingUp;
  readonly PlayIcon = Gamepad2;
  readonly AddIcon = PlusCircle;
  readonly BookIcon = Book;
  readonly ChevronIcon = ChevronRight;
  readonly InfoIcon = AlertCircle;

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  ngOnInit() {
    this.userService.getDashboard().subscribe(res => {
      this.dashboard.set(res);
    });
  }
}

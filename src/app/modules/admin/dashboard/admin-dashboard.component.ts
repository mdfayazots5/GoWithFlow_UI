import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Users, Play, FileText, AlertTriangle, ArrowRight, Upload, BarChart3, UserPlus } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  readonly UsersIcon   = Users;
  readonly SessionIcon = Play;
  readonly FileTextIcon = FileText;
  readonly AlertIcon   = AlertTriangle;
  readonly ArrowIcon   = ArrowRight;
  readonly UploadIcon  = Upload;
  readonly ReportIcon  = BarChart3;
  readonly AddUserIcon = UserPlus;

  stats          = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  weakAreas      = signal<any[]>([]);

  ngOnInit() {
    this.adminService.getDashboard().subscribe(data => {
      this.stats.set([
        { label: 'Total Users',        value: data.stats.totalUsers,     icon: Users,         accentColor: 'var(--gw-primary)', iconBg: 'rgba(61,90,153,0.1)'  },
        { label: 'Active Sessions',    value: data.stats.activeSessions, icon: Play,          accentColor: 'var(--gw-accent)',  iconBg: 'rgba(224,123,57,0.1)' },
        { label: 'Total Scripts',      value: data.stats.totalScripts,   icon: FileText,      accentColor: 'var(--gw-success)', iconBg: 'rgba(46,125,50,0.1)'  },
        { label: 'Mistakes Recorded',  value: data.stats.totalMistakes,  icon: AlertTriangle, accentColor: 'var(--gw-error)',   iconBg: 'rgba(211,47,47,0.1)'  },
      ]);
      this.recentActivity.set(data.recentActivity);
      this.weakAreas.set(data.weakAreas);
    });
  }

  initials(name: string): string {
    return (name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  onAddUser() {
    this.toast.info('Use the standard Registration flow to add users');
  }
}

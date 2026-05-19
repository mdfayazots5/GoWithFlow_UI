import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, Filter, Download, User, Calendar, BarChart3, TrendingUp, TrendingDown, Eye, FileText } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly DownloadIcon = Download;
  readonly TrendUpIcon = TrendingUp;
  readonly TrendDownIcon = TrendingDown;
  readonly ViewIcon = Eye;

  dateFrom = new FormControl('');
  dateTo = new FormControl('');

  reports = signal<any[]>([]);
  displayedColumns = ['user', 'sessions', 'avgScore', 'mistakes', 'improvement', 'lastSession', 'actions'];

  ngOnInit() {
    this.adminService.getReports().subscribe(data => {
      this.reports.set(data.items);
    });
  }

  viewFullReport(userId: string) {
    this.router.navigate(['/admin/reports/user', userId]);
  }

  exportReport() {
    this.adminService.exportReports().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gwf-report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

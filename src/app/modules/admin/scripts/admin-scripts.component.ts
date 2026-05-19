import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, FileText, Plus, Search, Eye, Power, Download, BookOpen, Clock, List } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ScriptService } from '@core/services/script.service';

@Component({
  selector: 'app-admin-scripts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTableModule, MatPaginatorModule, MatIconModule, MatButtonModule],
  templateUrl: './admin-scripts.component.html',
  styleUrls: ['./admin-scripts.component.scss']
})
export class AdminScriptsComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly ScriptIcon = FileText;
  readonly ActiveIcon = BookOpen;
  readonly LineIcon = List;
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly ViewIcon = Eye;
  readonly PowerIcon = Power;
  readonly DownloadIcon = Download;

  scripts = signal<any[]>([]);
  displayedColumns: string[] = ['title', 'category', 'tag', 'lines', 'status', 'actions'];

  ngOnInit() {
    this.scriptService.getScripts({}).subscribe(data => {
      this.scripts.set(data.items || []);
    });
  }

  toggleScript(script: any) {
    const isActive = script.active === false;
    this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive }).subscribe(() => {
      this.toast.success(`Script ${isActive ? 'activated' : 'deactivated'}`);
      this.scriptService.getScripts({}).subscribe(data => this.scripts.set(data.items || []));
    });
  }

  downloadSample() {
    this.toast.info('Downloading admin script template...');
  }

  goToUpload() {
    this.router.navigate(['/admin/scripts/upload']);
  }

  getCategoryClass(category: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('grammar')) return 'chip-grammar';
    if (cat.includes('roleplay')) return 'chip-roleplay';
    if (cat.includes('interview')) return 'chip-interview';
    if (cat.includes('vocabulary')) return 'chip-vocabulary';
    if (cat.includes('fluency')) return 'chip-fluency';
    return 'chip-grammar';
  }
}

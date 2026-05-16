import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '@core/services/admin.service';
import { LucideAngularModule, FileText, Plus, Search, Eye, Power, Download, BookOpen, Clock, List } from 'lucide-angular';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ScriptService } from '@core/services/script.service';

@Component({
  selector: 'app-admin-scripts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTableModule, MatPaginatorModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Stats Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm flex items-center gap-4">
          <div class="p-3 bg-gw-primary/10 text-gw-primary rounded-2xl">
            <i-lucide [img]="ScriptIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text italic tabular-nums leading-none">42</p>
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted mt-1">Total Scripts</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm flex items-center gap-4">
          <div class="p-3 bg-gw-success/10 text-gw-success rounded-2xl">
            <i-lucide [img]="ActiveIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text italic tabular-nums leading-none">38</p>
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted mt-1">Active Now</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl border border-gw-card-border shadow-sm flex items-center gap-4">
          <div class="p-3 bg-gw-accent/10 text-gw-accent rounded-2xl">
            <i-lucide [img]="LineIcon" size="24"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text italic tabular-nums leading-none">1.2k</p>
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted mt-1">Utterances</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted"></i-lucide>
          <input 
            type="text" 
            class="w-full h-14 bg-white border border-gw-card-border rounded-2xl pl-12 pr-4 font-bold text-gw-text focus:border-gw-primary outline-none transition-all shadow-sm"
            placeholder="Search by Title or Tag..."
          >
        </div>
        
        <button 
          routerLink="/admin/scripts/upload"
          class="h-14 px-8 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl shadow-lg shadow-gw-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
        >
          <i-lucide [img]="PlusIcon" size="20"></i-lucide>
          Upload New Script
        </button>
      </div>

      <!-- Scripts Table -->
      <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm overflow-hidden">
        <table mat-table [dataSource]="scripts()" class="w-full">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef class="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Title</th>
            <td mat-cell *matCellDef="let row" class="px-6 py-4">
              <div class="flex flex-col">
                <span class="font-bold text-gw-text">{{ row.scriptTitle }}</span>
                <span class="text-[10px] font-medium text-gw-text-muted">ID: {{ row.id }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Category</th>
            <td mat-cell *matCellDef="let row" class="py-4">
              <span class="text-xs font-bold text-gw-text italic">{{ row.category }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="tag">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted">Grammar Tag</th>
            <td mat-cell *matCellDef="let row" class="py-4">
              <span class="px-2 py-1 bg-gw-accent/10 text-gw-accent rounded-lg text-[10px] font-black uppercase tracking-wider">
                {{ row.grammarFocusTag }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="lines">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Lines</th>
            <td mat-cell *matCellDef="let row" class="py-4 text-center">
              <span class="text-sm font-black italic">{{ row.utteranceCount || 5 }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="py-4 font-black uppercase text-[10px] tracking-widest text-gw-text-muted text-center">Status</th>
            <td mat-cell *matCellDef="let row" class="py-4 text-center">
               <div class="w-2 h-2 rounded-full mx-auto" [class]="row.active !== false ? 'bg-gw-success' : 'bg-gw-error'"></div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="py-4 pr-6"></th>
            <td mat-cell *matCellDef="let row" class="py-4 pr-6 text-right">
              <div class="flex justify-end gap-2">
                <button class="p-2 text-gw-primary hover:bg-gw-primary/10 rounded-xl transition-colors" title="View Details">
                  <i-lucide [img]="ViewIcon" size="18"></i-lucide>
                </button>
                <button (click)="toggleScript(row)" class="p-2 text-gw-text-muted hover:text-gw-accent hover:bg-gw-accent/10 rounded-xl transition-colors" title="Toggle Active">
                  <i-lucide [img]="PowerIcon" size="18"></i-lucide>
                </button>
                <button (click)="downloadSample()" class="p-2 text-gw-text-muted hover:text-gw-success hover:bg-gw-success/10 rounded-xl transition-colors" title="Download Excel">
                  <i-lucide [img]="DownloadIcon" size="18"></i-lucide>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gw-bg/50 transition-colors"></tr>
        </table>
        
        <mat-paginator [pageSize]="10" class="!border-t !border-gw-card-border"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-table { background: transparent; }
    .mat-mdc-header-cell { border-bottom: 1px solid var(--gw-card-border); color: var(--gw-text-muted); }
  `]
})
export class AdminScriptsComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private toast = inject(ToastService);

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
    // In a real app we'd call a toggle endpoint
    this.toast.success(`Script status updated for ${script.title}`);
  }

  downloadSample() {
    this.toast.info('Downloading admin script template...');
  }
}

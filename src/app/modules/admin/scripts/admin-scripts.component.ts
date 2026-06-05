import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { LucideAngularModule, FileText, BookOpen, List, Search, Plus, Eye, Download, CircleCheck, CircleX } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { AdminLoadMoreComponent } from '@shared/components/admin-load-more/admin-load-more.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-admin-scripts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink, AdminLoadMoreComponent],
  template: `
    <div class="max-w-lg mx-auto space-y-4">

      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="ScriptIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-black text-gw-text tracking-tight leading-tight">Scripts</h1>
            <p class="text-[11px] text-gw-text-muted font-semibold">
              {{ loading() ? 'Loading...' : totalCount() + ' total scripts' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <a routerLink="/admin/script-analytics"
            class="flex items-center gap-2 h-10 px-3 bg-white border border-gw-card-border text-gw-text-muted font-black text-[11px] uppercase tracking-widest rounded-xl hover:border-gw-primary hover:text-gw-primary transition-all no-underline">
            Analytics
          </a>
          <button (click)="goToUpload()"
            class="flex items-center gap-2 h-10 px-3 bg-gw-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity">
            <i-lucide [img]="PlusIcon" size="15"></i-lucide>
            <span class="hidden sm:inline">Upload Script</span>
            <span class="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-2.5">
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-gw-text leading-none">{{ totalCount() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Total</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-green-600 leading-none">{{ activeCount() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Active</p>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-3 shadow-sm text-center">
          <p class="text-xl font-black text-orange-500 leading-none">{{ totalUtterances() }}</p>
          <p class="text-[11px] font-bold uppercase tracking-wide text-gw-text-muted mt-1">Lines</p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <i-lucide [img]="SearchIcon" size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
        <input [formControl]="searchControl" type="text" placeholder="Search by title or tag..."
          class="w-full h-11 bg-white border border-gw-card-border rounded-2xl pl-10 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary outline-none transition-all shadow-sm">
      </div>

      <!-- Loading Skeletons -->
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="h-[72px] bg-white rounded-2xl border border-gw-card-border animate-pulse"></div>
        }
      }

      <!-- Empty State -->
      @else if (scripts().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                    flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="ScriptIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">No scripts found</p>
          <p class="text-xs text-gw-text-muted">Upload a script to get started</p>
        </div>
      }

      <!-- Script List -->
      @else {
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="divide-y divide-gw-bg">
            @for (row of scripts(); track row.id) {
              <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gw-bg/50 transition-colors">

                <!-- Icon -->
                <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
                  <i-lucide [img]="ScriptIcon" size="16" class="text-gw-primary"></i-lucide>
                </div>

                <!-- Meta -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gw-text truncate leading-tight">{{ row.scriptTitle }}</p>
                  <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider"
                      [class]="categoryClass(row.category)">{{ row.category }}</span>
                    <span class="text-[11px] font-semibold text-gw-text-muted">v{{ row.version }}</span>
                    <span class="text-[11px] font-semibold text-gw-text-muted">·</span>
                    <span class="text-[11px] font-semibold text-gw-text-muted">{{ row.utteranceCount }} lines</span>
                  </div>
                </div>

                <!-- Status + actions -->
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide"
                    [class]="row.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="row.active ? 'bg-green-500' : 'bg-red-400'"></span>
                    {{ row.active ? 'Active' : 'Inactive' }}
                  </span>
                  <div class="flex items-center gap-0.5">
                    <button (click)="viewDetails(row)" title="View details"
                      class="w-9 h-9 flex items-center justify-center rounded-lg text-gw-primary hover:bg-gw-primary/10 transition-colors">
                      <i-lucide [img]="ViewIcon" size="15"></i-lucide>
                    </button>
                    <button (click)="toggleScript(row)" [title]="row.active ? 'Deactivate' : 'Activate'"
                      class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                      [class]="row.active ? 'text-gw-text-muted hover:text-red-500 hover:bg-red-50' : 'text-gw-text-muted hover:text-green-600 hover:bg-green-50'">
                      <i-lucide [img]="row.active ? DeactivateIcon : ActivateIcon" size="15"></i-lucide>
                    </button>
                    <button (click)="downloadScript(row)" title="Download script"
                      class="w-9 h-9 flex items-center justify-center rounded-lg text-gw-text-muted hover:text-gw-success hover:bg-green-50 transition-colors">
                      <i-lucide [img]="DownloadIcon" size="15"></i-lucide>
                    </button>
                  </div>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Standardized pager -->
        <app-admin-load-more
          [loading]="loadingMore()" [hasMore]="hasMore()"
          [loaded]="scripts().length" [total]="totalCount()"
          (more)="loadMore()"></app-admin-load-more>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminScriptsComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private toast         = inject(ToastService);
  private router        = inject(Router);

  readonly ScriptIcon     = FileText;
  readonly ActiveIcon     = BookOpen;
  readonly LinesIcon      = List;
  readonly SearchIcon     = Search;
  readonly PlusIcon       = Plus;
  readonly ViewIcon       = Eye;
  readonly DeactivateIcon = CircleX;
  readonly ActivateIcon   = CircleCheck;
  readonly DownloadIcon   = Download;

  scripts         = signal<any[]>([]);
  loading         = signal(false);
  loadingMore     = signal(false);
  totalCount      = signal(0);
  activeCount     = signal(0);
  totalUtterances = signal(0);

  private page     = 1;
  private pageSize = 12;

  searchControl = new FormControl('');

  hasMore() {
    return this.scripts().length < this.totalCount();
  }

  ngOnInit() {
    this.loadScripts();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.scripts.set([]);
      this.loading.set(true);
      this.loadScripts();
    });
  }

  loadScripts(append = false) {
    this.scriptService.getScripts({
      pageNumber: this.page,
      pageSize:   this.pageSize,
      search:     this.searchControl.value || undefined,
    }).subscribe({
      next: (res: any) => {
        const incoming = res.items || [];
        this.scripts.update(prev => append ? [...prev, ...incoming] : incoming);
        this.totalCount.set(res.totalCount || res.total || 0);
        const all = this.scripts();
        this.activeCount.set(all.filter((s: any) => s.active).length);
        this.totalUtterances.set(all.reduce((sum: number, s: any) => sum + (s.utteranceCount || 0), 0));
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.toast.error('Failed to load scripts');
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.loadScripts(true);
  }

  viewDetails(script: any) {
    this.router.navigate(['/admin/scripts', script.id]);
  }

  toggleScript(script: any) {
    const goingActive = !script.active;
    this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive: goingActive }).subscribe({
      next: () => {
        this.toast.success(`Script ${goingActive ? 'activated' : 'deactivated'}`);
        this.refresh();
      },
      error: () => this.toast.error('Failed to update script status')
    });
  }

  private refresh() {
    this.page = 1;
    this.scripts.set([]);
    this.loading.set(true);
    this.loadScripts();
  }

  downloadScript(script: Script) {
    this.scriptService.downloadScript(script.id).subscribe({
      next: (blob: Blob) => {
        const url      = URL.createObjectURL(blob);
        const a        = document.createElement('a');
        a.href         = url;
        a.download     = `${script.scriptTitle}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Download failed')
    });
  }

  goToUpload() {
    this.router.navigate(['/admin/scripts/upload']);
  }

  categoryClass(category: string): string {
    const c = (category || '').toLowerCase();
    if (c.includes('grammar'))    return 'bg-gw-primary/10 text-gw-primary';
    if (c.includes('roleplay'))   return 'bg-green-100 text-green-700';
    if (c.includes('interview'))  return 'bg-orange-100 text-orange-600';
    if (c.includes('vocabulary')) return 'bg-gray-100 text-gray-600';
    if (c.includes('fluency'))    return 'bg-purple-100 text-purple-700';
    if (c.includes('repetition')) return 'bg-blue-100 text-blue-700';
    return 'bg-gw-primary/10 text-gw-primary';
  }
}

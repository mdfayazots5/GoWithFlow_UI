import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { LucideAngularModule, FileText, BookOpen, List, Search, Plus, Eye, Power, Download, X, Hash, Tag, Calendar, Layers, Users, CircleCheck, CircleX } from 'lucide-angular';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ScriptService } from '@core/services/script.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-admin-scripts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatPaginatorModule],
  template: `
    <!-- Script Detail Side Panel -->
    @if (selectedScript()) {
      <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedScript.set(null)">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 class="text-base font-black text-gw-text uppercase tracking-wider">Script Details</h2>
            <button (click)="selectedScript.set(null)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gw-text-muted">
              <i-lucide [img]="XIcon" size="18"></i-lucide>
            </button>
          </div>

          <div class="px-6 py-5 border-b border-gray-100">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center mb-4">
              <i-lucide [img]="ScriptIcon" size="22" class="text-gw-primary"></i-lucide>
            </div>
            <h3 class="text-base font-black text-gw-text leading-snug">{{ selectedScript()!.scriptTitle }}</h3>
            <span class="inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              [class]="selectedScript()!.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
              {{ selectedScript()!.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="px-6 py-5 space-y-3 border-b border-gray-100">
            <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Info</p>
            <div class="space-y-2.5">
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="TagIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Category</p><p class="text-sm font-bold text-gw-text">{{ selectedScript()!.category }}</p></div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="HashIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Grammar Tag</p><p class="text-sm font-bold text-gw-text">{{ selectedScript()!.grammarFocusTag }}</p></div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="UsersIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Age Group</p><p class="text-sm font-bold text-gw-text">{{ selectedScript()!.targetAgeGroup }}</p></div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="LayersIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Complexity</p>
                  <div class="flex gap-1 mt-0.5">
                    @for (d of [1,2,3,4,5]; track d) {
                      <span class="w-2.5 h-2.5 rounded-full" [class]="d <= selectedScript()!.complexityLevel ? 'bg-gw-primary' : 'bg-gray-200'"></span>
                    }
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="LinesIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Lines</p><p class="text-sm font-bold text-gw-text">{{ selectedScript()!.utteranceCount }}</p></div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                <i-lucide [img]="CalendarIcon" size="15" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                <div><p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Uploaded</p><p class="text-sm font-bold text-gw-text">{{ selectedScript()!.uploadedDate | date:'d MMM y' }}</p></div>
              </div>
            </div>
          </div>

          <div class="mt-auto px-6 py-5 border-t border-gray-100 flex gap-3">
            <button
              class="flex-1 h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 transition-all"
              [class]="selectedScript()!.active
                ? 'border-red-400 text-red-500 hover:bg-red-50'
                : 'border-green-400 text-green-600 hover:bg-green-50'"
              (click)="toggleScript(selectedScript()!)">
              {{ selectedScript()!.active ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Main Content -->
    <div class="space-y-5">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
            <i-lucide [img]="ScriptIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-lg font-black text-gw-text uppercase tracking-wide">Scripts</h1>
            <p class="text-xs text-gw-text-muted font-medium">
              {{ loading() ? 'Loading...' : totalCount() + ' total scripts' }}
            </p>
          </div>
        </div>
        <button (click)="goToUpload()"
          class="flex items-center gap-2 h-10 px-4 bg-gw-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-opacity">
          <i-lucide [img]="PlusIcon" size="15"></i-lucide>
          Upload Script
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="ScriptIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ totalCount() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Total Scripts</p>
          </div>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="ActiveIcon" size="20" class="text-green-600"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ activeCount() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Active Scripts</p>
          </div>
        </div>
        <div class="bg-white border border-gw-card-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <i-lucide [img]="LinesIcon" size="20" class="text-orange-500"></i-lucide>
          </div>
          <div>
            <p class="text-2xl font-black text-gw-text leading-none">{{ totalUtterances() }}</p>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gw-text-muted mt-0.5">Total Lines</p>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="bg-white border border-gw-card-border rounded-2xl p-4 shadow-sm">
        <div class="relative">
          <i-lucide [img]="SearchIcon" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
          <input [formControl]="searchControl" type="text" placeholder="Search by title or tag..."
            class="w-full h-10 bg-gw-bg border border-transparent rounded-xl pl-9 pr-4 text-sm font-medium text-gw-text placeholder:text-gw-text-muted focus:border-gw-primary focus:bg-white outline-none transition-all">
        </div>
      </div>

      <!-- Table Card -->
      <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-8 h-8 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-gw-text-muted">Loading scripts...</p>
          </div>
        }

        @else if (scripts().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="ScriptIcon" size="28" class="text-gw-text-muted"></i-lucide>
            </div>
            <div class="text-center">
              <p class="font-black text-gw-text">No scripts found</p>
              <p class="text-sm text-gw-text-muted mt-1">Upload a script to get started</p>
            </div>
          </div>
        }

        @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gw-card-border">
                  <th class="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Title</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Category</th>
                  <th class="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden lg:table-cell">Grammar Tag</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Lines</th>
                  <th class="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Status</th>
                  <th class="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of scripts(); track row.id) {
                  <tr class="border-b border-gw-card-border/50 hover:bg-gw-bg/40 transition-colors group">

                    <!-- Title -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center flex-shrink-0">
                          <i-lucide [img]="ScriptIcon" size="15" class="text-gw-primary"></i-lucide>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-gw-text truncate">{{ row.scriptTitle }}</p>
                          <p class="text-[11px] text-gw-text-muted font-medium">v{{ row.version }} · {{ row.targetAgeGroup }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Category -->
                    <td class="px-4 py-4 hidden md:table-cell">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                        [class]="categoryClass(row.category)">
                        {{ row.category }}
                      </span>
                    </td>

                    <!-- Grammar Tag -->
                    <td class="px-4 py-4 hidden lg:table-cell">
                      <span class="text-xs font-bold text-gw-text-muted bg-gw-bg px-2.5 py-1 rounded-lg">{{ row.grammarFocusTag }}</span>
                    </td>

                    <!-- Lines -->
                    <td class="px-4 py-4 text-center hidden sm:table-cell">
                      <span class="text-sm font-black text-gw-text">{{ row.utteranceCount }}</span>
                    </td>

                    <!-- Status -->
                    <td class="px-4 py-4 text-center">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                        [class]="row.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          [class]="row.active ? 'bg-green-500' : 'bg-red-400'"></span>
                        {{ row.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-4 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          (click)="viewDetails(row)"
                          title="View Details"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gw-primary hover:bg-gw-primary/10 transition-colors">
                          <i-lucide [img]="ViewIcon" size="15"></i-lucide>
                        </button>
                        <button
                          (click)="toggleScript(row)"
                          [title]="row.active ? 'Deactivate' : 'Activate'"
                          class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                          [class]="row.active
                            ? 'text-gw-text-muted hover:text-red-500 hover:bg-red-50'
                            : 'text-gw-text-muted hover:text-green-600 hover:bg-green-50'">
                          <i-lucide [img]="row.active ? DeactivateIcon : ActivateIcon" size="15"></i-lucide>
                        </button>
                        <button
                          (click)="downloadTemplate()"
                          title="Download Template"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gw-text-muted hover:text-gw-success hover:bg-green-50 transition-colors">
                          <i-lucide [img]="DownloadIcon" size="15"></i-lucide>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-5 py-3.5 border-t border-gw-card-border bg-gw-bg/30">
            <p class="text-xs font-medium text-gw-text-muted">
              Showing {{ currentPage() * currentPageSize() + 1 }}–{{ pageEnd() }} of {{ totalCount() }}
            </p>
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="currentPageSize()"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              class="!bg-transparent"
            ></mat-paginator>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-paginator { background: transparent; }
    .mat-mdc-paginator-container { padding: 0; min-height: unset; }
  `]
})
export class AdminScriptsComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private toast         = inject(ToastService);
  private router        = inject(Router);

  readonly ScriptIcon    = FileText;
  readonly ActiveIcon    = BookOpen;
  readonly LinesIcon     = List;
  readonly SearchIcon    = Search;
  readonly PlusIcon      = Plus;
  readonly ViewIcon      = Eye;
  readonly DeactivateIcon = CircleX;
  readonly ActivateIcon  = CircleCheck;
  readonly DownloadIcon  = Download;
  readonly XIcon         = X;
  readonly HashIcon      = Hash;
  readonly TagIcon       = Tag;
  readonly CalendarIcon  = Calendar;
  readonly LayersIcon    = Layers;
  readonly UsersIcon     = Users;

  scripts         = signal<any[]>([]);
  loading         = signal(false);
  totalCount      = signal(0);
  activeCount     = signal(0);
  totalUtterances = signal(0);
  currentPage     = signal(0);
  currentPageSize = signal(12);
  selectedScript  = signal<any | null>(null);

  searchControl = new FormControl('');

  pageEnd() {
    return Math.min((this.currentPage() + 1) * this.currentPageSize(), this.totalCount());
  }

  ngOnInit() {
    this.loadScripts();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => { this.currentPage.set(0); this.loadScripts(); });
  }

  loadScripts(page = this.currentPage(), size = this.currentPageSize()) {
    this.loading.set(true);
    this.scriptService.getScripts({
      pageNumber: page + 1,
      pageSize:   size,
      search:     this.searchControl.value || undefined,
    }).subscribe({
      next: (res: any) => {
        const items = res.items || [];
        this.scripts.set(items);
        this.totalCount.set(res.totalCount || res.total || 0);
        this.activeCount.set(items.filter((s: any) => s.active).length);
        this.totalUtterances.set(items.reduce((sum: number, s: any) => sum + (s.utteranceCount || 0), 0));
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load scripts');
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.loadScripts(event.pageIndex, event.pageSize);
  }

  viewDetails(script: any) {
    this.selectedScript.set(script);
  }

  toggleScript(script: any) {
    const goingActive = !script.active;
    this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive: goingActive }).subscribe({
      next: () => {
        this.toast.success(`Script ${goingActive ? 'activated' : 'deactivated'}`);
        if (this.selectedScript()?.id === script.id) {
          this.selectedScript.update(s => s ? { ...s, active: goingActive } : null);
        }
        this.loadScripts();
      },
      error: () => this.toast.error('Failed to update script status')
    });
  }

  downloadTemplate() {
    this.scriptService.getSampleTemplate().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'GoWithFlow_ScriptTemplate.xlsx';
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

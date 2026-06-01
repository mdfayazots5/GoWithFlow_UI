// File: src/app/modules/scripts/script-library/script-library.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { LucideAngularModule, Search, BookOpen, Layers, Eye, Play, Trash2, Plus } from 'lucide-angular';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ScriptPreviewComponent } from './script-preview.component';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-script-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatBottomSheetModule, MatPaginatorModule, RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-24">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-gw-text uppercase tracking-tight">Script Library</h2>
          <p class="text-[10px] font-semibold text-gw-text-muted uppercase tracking-widest mt-0.5">Choose a script to start your fluency journey</p>
        </div>
        @if (isAdmin()) {
          <a routerLink="/admin/scripts/upload"
             class="h-10 px-4 bg-gw-text text-white text-xs font-bold uppercase tracking-wide rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md">
            <i-lucide [img]="PlusIcon" size="16"></i-lucide>
            <span class="hidden sm:inline">New Script</span>
          </a>
        }
      </div>

      <!-- Search -->
      <div class="relative">
        <i-lucide [img]="SearchIcon" size="16"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
        <input [formControl]="searchControl" type="text" placeholder="Search scripts..."
               class="w-full h-11 bg-white border border-gw-card-border rounded-xl pl-11 pr-4 text-sm font-medium text-gw-text outline-none focus:border-gw-primary transition-colors shadow-sm placeholder:text-gw-text-muted/60">
      </div>

      <!-- Filter chips — horizontal scroll on mobile -->
      <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <select [formControl]="categoryControl"
                class="shrink-0 h-9 bg-white border border-gw-card-border rounded-xl px-3 text-[11px] font-bold text-gw-text outline-none appearance-none cursor-pointer focus:border-gw-primary transition-colors shadow-sm">
          <option value="">All Categories</option>
          <option value="Grammar Drill">Grammar Drill</option>
          <option value="Roleplay">Roleplay</option>
          <option value="Interview">Interview</option>
          <option value="Vocabulary">Vocabulary</option>
          <option value="Fluency Drill">Fluency Drill</option>
        </select>

        <select [formControl]="grammarControl"
                class="shrink-0 h-9 bg-white border border-gw-card-border rounded-xl px-3 text-[11px] font-bold text-gw-text outline-none appearance-none cursor-pointer focus:border-gw-primary transition-colors shadow-sm">
          <option value="">All Grammar Focus</option>
          <option value="Have Been">Have Been</option>
          <option value="Has Been">Has Been</option>
          <option value="Must Be">Must Be</option>
          <option value="Should Be">Should Be</option>
          <option value="Would Have">Would Have</option>
        </select>

        <select [formControl]="ageControl"
                class="shrink-0 h-9 bg-white border border-gw-card-border rounded-xl px-3 text-[11px] font-bold text-gw-text outline-none appearance-none cursor-pointer focus:border-gw-primary transition-colors shadow-sm">
          <option value="">All Ages</option>
          <option value="Child (6-12)">Child (6–12)</option>
          <option value="Teen (13-17)">Teen (13–17)</option>
          <option value="Adult (18+)">Adult (18+)</option>
        </select>
      </div>

      <!-- Scripts Grid -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="h-48 bg-white border border-gw-card-border rounded-2xl animate-pulse"></div>
          }
        </div>
      } @else if (scripts().length === 0) {
        <div class="bg-white rounded-2xl border border-gw-card-border p-12 flex flex-col items-center gap-3 text-center">
          <div class="w-14 h-14 bg-gw-bg rounded-2xl flex items-center justify-center">
            <i-lucide [img]="BookOpenIcon" size="26" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">No scripts found</p>
          <p class="text-xs text-gw-text-muted">Try adjusting your search or filters.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (script of scripts(); track script.id) {
            <div class="group bg-white rounded-2xl border border-gw-card-border shadow-sm hover:shadow-lg hover:border-gw-primary hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden relative">

              <!-- Top color bar based on category -->
              <div class="h-1 w-full"
                   [style.background]="categoryColor(script.category)"></div>

              <div class="p-5 flex flex-col flex-1 gap-4">

                <!-- Tags row -->
                <div class="flex flex-wrap gap-1.5">
                  <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                        [style.background]="categoryBg(script.category)"
                        [style.color]="categoryColor(script.category)">
                    {{ script.category }}
                  </span>
                  @if (script.grammarFocusTag && script.grammarFocusTag !== 'None') {
                    <span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-100">
                      {{ script.grammarFocusTag }}
                    </span>
                  }
                </div>

                <!-- Title -->
                <h3 class="text-base font-black text-gw-text uppercase tracking-tight leading-tight group-hover:text-gw-primary transition-colors line-clamp-2">
                  {{ script.scriptTitle }}
                </h3>

                <!-- Meta row -->
                <div class="flex items-center gap-4 mt-auto">
                  <div class="flex items-center gap-1.5 text-gw-text-muted">
                    <i-lucide [img]="LinesIcon" size="13"></i-lucide>
                    <span class="text-xs font-bold">{{ script.utteranceCount }} lines</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    @for (dot of [1,2,3,4,5]; track dot) {
                      <div class="w-2 h-2 rounded-full transition-colors"
                           [style.background]="dot <= (script.complexityLevel || 0) ? categoryColor(script.category) : '#E0E4EC'"></div>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-1 border-t border-gw-bg">
                  <button (click)="previewScript(script)"
                          class="flex-1 h-9 bg-gw-bg text-gw-text text-xs font-bold rounded-xl hover:bg-gw-primary/10 hover:text-gw-primary transition-all flex items-center justify-center gap-1.5">
                    <i-lucide [img]="PreviewIcon" size="13"></i-lucide>
                    Preview
                  </button>
                  <button (click)="startSession(script)" style="background:var(--gw-primary);" class="w-9 h-9 text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm">
                    <i-lucide [img]="PlayIcon" size="16"></i-lucide>
                  </button>
                  @if (isAdmin()) {
                    <button (click)="deactivateScript(script)"
                            class="w-9 h-9 bg-gw-bg rounded-xl flex items-center justify-center text-gw-text-muted hover:bg-red-50 hover:text-gw-error transition-all">
                      <i-lucide [img]="TrashIcon" size="14"></i-lucide>
                    </button>
                  }
                </div>

              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalCount() > 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-2 flex justify-center">
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="12"
              [pageSizeOptions]="[12, 24, 48]"
              (page)="handlePageChange($event)"
              class="!border-none">
            </mat-paginator>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    .mat-mdc-paginator { background: transparent; }
  `]
})
export class ScriptLibraryComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private authService = inject(AuthService);
  private bottomSheet = inject(MatBottomSheet);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly SearchIcon = Search;
  readonly LinesIcon = Layers;
  readonly PreviewIcon = Eye;
  readonly PlayIcon = Play;
  readonly TrashIcon = Trash2;
  readonly PlusIcon = Plus;
  readonly BookOpenIcon = BookOpen;

  scripts = signal<Script[]>([]);
  totalCount = signal(0);
  isLoading = signal(true);
  isAdmin = signal(false);

  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  grammarControl = new FormControl('');
  ageControl = new FormControl('');

  ngOnInit() {
    this.isAdmin.set(this.authService.getRole() === 'ADMIN');
    this.loadScripts();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadScripts());

    this.categoryControl.valueChanges.subscribe(() => this.loadScripts());
    this.grammarControl.valueChanges.subscribe(() => this.loadScripts());
    this.ageControl.valueChanges.subscribe(() => this.loadScripts());
  }

  loadScripts(pageIndex = 0, pageSize = 12) {
    this.isLoading.set(true);
    const filters: any = {
      search: this.searchControl.value,
      category: this.categoryControl.value,
      grammarFocusTag: this.grammarControl.value,
      targetAgeGroup: this.ageControl.value,
      page: pageIndex,
      limit: pageSize
    };
    if (!this.isAdmin()) {
      filters.isActive = true;
    }

    this.scriptService.getScripts(filters).subscribe({
      next: (res) => {
        this.scripts.set(res.items);
        this.totalCount.set(res.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  handlePageChange(event: PageEvent) {
    this.loadScripts(event.pageIndex, event.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previewScript(script: Script) {
    this.bottomSheet.open(ScriptPreviewComponent, {
      data: script,
      panelClass: 'preview-bottom-sheet'
    });
  }

  categoryColor(cat: string): string {
    const map: Record<string, string> = {
      'Grammar Drill': '#3D5A99',
      'Roleplay':      '#2E7D32',
      'Interview':     '#E07B39',
      'Vocabulary':    '#7C3AED',
      'Fluency Drill': '#0891B2',
    };
    return map[cat] ?? '#6B7280';
  }

  categoryBg(cat: string): string {
    const map: Record<string, string> = {
      'Grammar Drill': '#EEF2FF',
      'Roleplay':      '#ECFDF5',
      'Interview':     '#FFF7ED',
      'Vocabulary':    '#F5F3FF',
      'Fluency Drill': '#ECFEFF',
    };
    return map[cat] ?? '#F4F6F9';
  }

  startSession(script: Script) {
    this.router.navigate(['/session/create'], { state: { script } });
  }

  deactivateScript(script: Script) {
    if (confirm(`Are you sure you want to deactivate "${script.scriptTitle}"?`)) {
      this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive: false }).subscribe(() => {
        this.toast.success('Script deactivated');
        this.loadScripts();
      });
    }
  }
}

// File: src/app/modules/scripts/script-library/script-library.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Search, BookOpen, Layers, Eye, Play, Trash2, Plus, BookMarked, Loader2
} from 'lucide-angular';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ScriptPreviewComponent } from './script-preview.component';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-script-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatBottomSheetModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 gwf-page-bottom space-y-4 animate-in fade-in duration-500">

        <!-- ── Page Heading ─────────────────────────────────────── -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight leading-tight">Script Library</h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Choose a script to start your session</p>
          </div>
          @if (isAdmin()) {
            <a routerLink="/admin/scripts/upload"
               class="h-9 px-4 bg-gw-primary text-white text-[11px] font-black uppercase
                      tracking-widest rounded-xl flex items-center gap-2
                      hover:opacity-90 active:scale-95 transition-all shrink-0 no-underline">
              <i-lucide [img]="PlusIcon" size="14"></i-lucide>
              New
            </a>
          }
        </div>

        <!-- ── Search ────────────────────────────────────────────── -->
        <div class="relative">
          <i-lucide [img]="SearchIcon" size="15"
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none">
          </i-lucide>
          <input [formControl]="searchControl" type="text" placeholder="Search scripts..."
                 class="w-full h-11 bg-white border border-gw-card-border rounded-2xl
                        pl-11 pr-4 text-sm font-medium text-gw-text shadow-sm
                        outline-none focus:border-gw-primary transition-colors
                        placeholder:text-gw-text-muted/60">
        </div>

        <!-- ── Filter Row ────────────────────────────────────────── -->
        <div class="flex gap-2 overflow-x-auto pb-0.5"
             style="-ms-overflow-style:none;scrollbar-width:none;">
          <select [formControl]="categoryControl"
                  class="shrink-0 h-9 bg-white border border-gw-card-border rounded-full
                         px-4 text-[11px] font-black uppercase tracking-widest text-gw-text
                         outline-none appearance-none cursor-pointer
                         focus:border-gw-primary transition-colors shadow-sm">
            <option value="">All Categories</option>
            <option value="Grammar Drill">Grammar Drill</option>
            <option value="Roleplay">Roleplay</option>
            <option value="Interview">Interview</option>
            <option value="Vocabulary">Vocabulary</option>
            <option value="Fluency Drill">Fluency Drill</option>
          </select>

          <select [formControl]="grammarControl"
                  class="shrink-0 h-9 bg-white border border-gw-card-border rounded-full
                         px-4 text-[11px] font-black uppercase tracking-widest text-gw-text
                         outline-none appearance-none cursor-pointer
                         focus:border-gw-primary transition-colors shadow-sm">
            <option value="">All Grammar</option>
            <option value="Have Been">Have Been</option>
            <option value="Has Been">Has Been</option>
            <option value="Must Be">Must Be</option>
            <option value="Should Be">Should Be</option>
            <option value="Would Have">Would Have</option>
          </select>

          <select [formControl]="ageControl"
                  class="shrink-0 h-9 bg-white border border-gw-card-border rounded-full
                         px-4 text-[11px] font-black uppercase tracking-widest text-gw-text
                         outline-none appearance-none cursor-pointer
                         focus:border-gw-primary transition-colors shadow-sm">
            <option value="">All Ages</option>
            <option value="Child (6-12)">Child (6–12)</option>
            <option value="Teen (13-17)">Teen (13–17)</option>
            <option value="Adult (18+)">Adult (18+)</option>
          </select>
        </div>

        <!-- ── Loading Skeletons ────────────────────────────────── -->
        @if (isLoading()) {
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-[88px] bg-white rounded-2xl border border-gw-card-border animate-pulse"></div>
          }
        }

        <!-- ── Empty State ──────────────────────────────────────── -->
        @else if (scripts().length === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm
                      flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="BookOpenIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No scripts found</p>
            <p class="text-xs text-gw-text-muted">Try adjusting your search or filters.</p>
          </div>
        }

        <!-- ── Script List ──────────────────────────────────────── -->
        @else {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="divide-y divide-gw-bg">
              @for (script of scripts(); track script.id) {
                <div class="px-4 py-3.5 hover:bg-gw-bg/50 transition-colors">

                  <div class="flex items-center gap-3.5">

                    <!-- Category icon -->
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                         [style.background]="categoryBg(script.category)">
                      <i-lucide [img]="BookOpenIcon" size="18"
                                [style.color]="categoryColor(script.category)"></i-lucide>
                    </div>

                    <!-- Title + meta -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-gw-text truncate leading-tight">
                        {{ script.scriptTitle }}
                      </p>
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                              [style.background]="categoryBg(script.category)"
                              [style.color]="categoryColor(script.category)">
                          {{ script.category }}
                        </span>
                        @if (script.grammarFocusTag && script.grammarFocusTag !== 'None') {
                          <span class="text-[11px] font-bold text-amber-600 bg-amber-50
                                       px-2 py-0.5 rounded-full border border-amber-100">
                            {{ script.grammarFocusTag }}
                          </span>
                        }
                        <span class="text-[11px] font-semibold text-gw-text-muted">
                          {{ script.utteranceCount }} lines
                        </span>
                        <!-- Complexity dots -->
                        <span class="flex items-center gap-0.5">
                          @for (dot of [1,2,3,4,5]; track dot) {
                            <span class="w-1.5 h-1.5 rounded-full"
                                  [style.background]="dot <= (script.complexityLevel || 0)
                                    ? categoryColor(script.category) : '#E0E4EC'"></span>
                          }
                        </span>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button (click)="previewScript(script)"
                              class="w-10 h-10 rounded-xl flex items-center justify-center
                                     text-gw-text-muted bg-gw-bg
                                     hover:text-gw-primary hover:bg-gw-primary/10 transition-all"
                              title="Preview">
                        <i-lucide [img]="PreviewIcon" size="15"></i-lucide>
                      </button>
                      <a [routerLink]="['/scripts/prepare', script.id]"
                         class="w-10 h-10 rounded-xl flex items-center justify-center
                                text-gw-text-muted bg-gw-bg
                                hover:text-gw-primary hover:bg-gw-primary/10 transition-all no-underline"
                         title="Prepare">
                        <i-lucide [img]="PrepareIcon" size="15"></i-lucide>
                      </a>
                      <button (click)="startSession(script)"
                              class="w-10 h-10 rounded-xl flex items-center justify-center
                                     text-white hover:opacity-90 active:scale-95 transition-all"
                              style="background:var(--gw-primary);"
                              title="Start session">
                        <i-lucide [img]="PlayIcon" size="15"></i-lucide>
                      </button>
                      @if (isAdmin()) {
                        <button (click)="deactivateScript(script)"
                                class="w-10 h-10 rounded-xl flex items-center justify-center
                                       text-gw-text-muted bg-gw-bg
                                       hover:text-gw-error hover:bg-red-50 transition-all"
                                title="Deactivate">
                          <i-lucide [img]="TrashIcon" size="14"></i-lucide>
                        </button>
                      }
                    </div>

                  </div>
                </div>
              }
            </div>
          </div>

          <!-- ── Load More ──────────────────────────────────────── -->
          @if (hasMore()) {
            <button (click)="loadMore()"
                    [disabled]="loadingMore()"
                    class="w-full py-3 rounded-2xl bg-white border border-gw-card-border
                           text-[11px] font-black uppercase tracking-widest text-gw-text-muted
                           hover:border-gw-primary hover:text-gw-primary transition-all
                           flex items-center justify-center gap-2 disabled:opacity-50">
              @if (loadingMore()) {
                <i-lucide [img]="LoaderIcon" size="14" class="animate-spin"></i-lucide>
                Loading...
              } @else {
                Load More
              }
            </button>
          }
        }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ScriptLibraryComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private authService   = inject(AuthService);
  private bottomSheet   = inject(MatBottomSheet);
  private toast         = inject(ToastService);
  private router        = inject(Router);

  readonly SearchIcon   = Search;
  readonly BookOpenIcon = BookOpen;
  readonly LinesIcon    = Layers;
  readonly PreviewIcon  = Eye;
  readonly PlayIcon     = Play;
  readonly TrashIcon    = Trash2;
  readonly PlusIcon     = Plus;
  readonly PrepareIcon  = BookMarked;
  readonly LoaderIcon   = Loader2;

  scripts    = signal<Script[]>([]);
  isLoading  = signal(true);
  loadingMore = signal(false);
  isAdmin    = signal(false);

  private total    = 0;
  private pageSize = 20;
  private page     = 0;

  hasMore = signal(false);

  searchControl   = new FormControl('');
  categoryControl = new FormControl('');
  grammarControl  = new FormControl('');
  ageControl      = new FormControl('');

  ngOnInit() {
    this.isAdmin.set(this.authService.getRole() === 'ADMIN');
    this.load();

    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.reset());
    this.categoryControl.valueChanges.subscribe(() => this.reset());
    this.grammarControl.valueChanges.subscribe(() => this.reset());
    this.ageControl.valueChanges.subscribe(() => this.reset());
  }

  loadMore() {
    this.page++;
    this.loadingMore.set(true);
    this.load(true);
  }

  previewScript(script: Script) {
    this.bottomSheet.open(ScriptPreviewComponent, {
      data: script,
      panelClass: 'preview-bottom-sheet'
    });
  }

  startSession(script: Script) {
    this.router.navigate(['/session/create'], { state: { script } });
  }

  deactivateScript(script: Script) {
    if (confirm(`Deactivate "${script.scriptTitle}"?`)) {
      this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive: false }).subscribe(() => {
        this.toast.success('Script deactivated');
        this.reset();
      });
    }
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
      'Grammar Drill': 'rgba(61,90,153,0.08)',
      'Roleplay':      'rgba(46,125,50,0.08)',
      'Interview':     'rgba(224,123,57,0.08)',
      'Vocabulary':    'rgba(124,58,237,0.08)',
      'Fluency Drill': 'rgba(8,145,178,0.08)',
    };
    return map[cat] ?? 'rgba(107,114,128,0.08)';
  }

  private reset() {
    this.page = 0;
    this.scripts.set([]);
    this.isLoading.set(true);
    this.load();
  }

  private load(append = false) {
    const filters: any = {
      search:          this.searchControl.value || undefined,
      category:        this.categoryControl.value || undefined,
      grammarFocusTag: this.grammarControl.value || undefined,
      targetAgeGroup:  this.ageControl.value || undefined,
      page:            this.page,
      limit:           this.pageSize
    };
    if (!this.isAdmin()) filters.isActive = true;

    this.scriptService.getScripts(filters).subscribe({
      next: (res) => {
        const items = res.items ?? [];
        this.total  = res.total ?? res.totalCount ?? items.length;
        this.scripts.update(prev => append ? [...prev, ...items] : items);
        this.hasMore.set(this.scripts().length < this.total);
        this.isLoading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadingMore.set(false);
      }
    });
  }
}

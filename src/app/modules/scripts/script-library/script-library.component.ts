// File: src/app/modules/scripts/script-library/script-library.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { LucideAngularModule, Search, Filter, BookOpen, Layers, Clock, Eye, Play, Edit3, Trash2, Plus, ArrowRight } from 'lucide-angular';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ScriptPreviewComponent } from './script-preview.component';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-script-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, MatBottomSheetModule, MatPaginatorModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500 pb-20">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-1">
          <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tighter">SCRIPT LIBRARY</h2>
          <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Choose a script to start your fluency journey</p>
        </div>

        @if (isAdmin()) {
          <a routerLink="/admin/scripts/upload" class="h-14 px-8 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl flex items-center gap-2 hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-gw-text/20">
            <i-lucide [img]="PlusIcon" size="20"></i-lucide>
            New Script
          </a>
        }
      </div>

      <!-- Filters Row -->
      <div class="bg-white p-4 rounded-[32px] border border-gw-card-border shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="relative group">
            <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted group-focus-within:text-gw-primary transition-colors"></i-lucide>
            <input 
              [formControl]="searchControl"
              type="text" 
              placeholder="Search scripts..." 
              class="w-full h-12 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl pl-12 pr-4 font-bold text-gw-text outline-none transition-all placeholder:italic"
            >
          </div>

          <select [formControl]="categoryControl" class="h-12 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-4 font-black uppercase text-[10px] tracking-widest italic text-gw-text outline-none appearance-none transition-all cursor-pointer">
            <option value="">All Categories</option>
            <option value="Grammar Drill">Grammar Drill</option>
            <option value="Roleplay">Roleplay</option>
            <option value="Interview">Interview</option>
            <option value="Vocabulary">Vocabulary</option>
            <option value="Fluency Drill">Fluency Drill</option>
          </select>

          <select [formControl]="grammarControl" class="h-12 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-4 font-black uppercase text-[10px] tracking-widest italic text-gw-text outline-none appearance-none transition-all cursor-pointer">
            <option value="">All Grammar Focus</option>
            <option value="Have Been">Have Been</option>
            <option value="Has Been">Has Been</option>
            <option value="Must Be">Must Be</option>
            <option value="Should Be">Should Be</option>
          </select>

          <select [formControl]="ageControl" class="h-12 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-4 font-black uppercase text-[10px] tracking-widest italic text-gw-text outline-none appearance-none transition-all cursor-pointer">
            <option value="">All Age Groups</option>
            <option value="All">All Ages</option>
            <option value="Child (6-12)">Child</option>
            <option value="Teen (13-17)">Teen</option>
            <option value="Adult (18+)">Adult</option>
          </select>
        </div>
      </div>

      <!-- Scripts Grid -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           @for (i of [1,2,3,4,5,6]; track i) {
             <div class="h-80 bg-white border border-gw-card-border rounded-[40px] animate-pulse"></div>
           }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (script of scripts(); track script.id) {
            <div class="group bg-white p-8 rounded-[48px] border border-gw-card-border shadow-sm hover:shadow-2xl hover:border-gw-primary hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden">
               <!-- Tags -->
               <div class="flex flex-wrap gap-2 mb-6">
                  <span 
                    class="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest italic shadow-sm"
                    [class.bg-gw-primary/10]="script.category === 'Grammar Drill'"
                    [class.text-gw-primary]="script.category === 'Grammar Drill'"
                    [class.bg-gw-success/10]="script.category === 'Roleplay'"
                    [class.text-gw-success]="script.category === 'Roleplay'"
                    [class.bg-gw-accent/10]="script.category === 'Interview'"
                    [class.text-gw-accent]="script.category === 'Interview'"
                  >
                    {{ script.category }}
                  </span>
                  @if (script.grammarFocusTag !== 'None') {
                    <span class="px-3 py-1 bg-gw-accent/5 text-gw-accent rounded-lg text-[8px] font-black uppercase tracking-widest italic border border-gw-accent/10">
                      {{ script.grammarFocusTag }}
                    </span>
                  }
               </div>

               <h3 class="text-2xl font-black text-gw-text leading-tight italic uppercase tracking-tight group-hover:text-gw-primary transition-colors">{{ script.scriptTitle }}</h3>
               
               <div class="mt-8 grid grid-cols-2 gap-4">
                  <div class="flex items-center gap-2">
                     <div class="p-2 bg-gw-bg rounded-xl text-gw-text-muted">
                        <i-lucide [img]="LinesIcon" size="14"></i-lucide>
                     </div>
                     <div>
                        <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Lines</p>
                        <p class="text-sm font-black italic">{{ script.utteranceCount }}</p>
                     </div>
                  </div>
                  <div class="flex items-center gap-2">
                     <div class="p-2 bg-gw-bg rounded-xl text-gw-text-muted">
                        <i-lucide [img]="ClockIcon" size="14"></i-lucide>
                     </div>
                     <div>
                        <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Level</p>
                        <div class="flex gap-0.5 mt-0.5">
                           @for (i of [1,2,3,4,5]; track i) {
                             <div class="w-1.5 h-1.5 rounded-full" [class.bg-gw-accent]="i <= script.complexityLevel" [class.bg-gw-bg]="i > script.complexityLevel"></div>
                           }
                        </div>
                     </div>
                  </div>
               </div>

               <div class="mt-auto pt-8 flex items-center justify-between">
                  <button (click)="previewScript(script)" class="h-12 px-6 bg-gw-bg text-gw-text font-black uppercase tracking-widest text-[10px] italic rounded-2xl hover:bg-gw-primary/10 hover:text-gw-primary transition-all flex items-center gap-2">
                    <i-lucide [img]="PreviewIcon" size="14"></i-lucide>
                    Preview
                  </button>
                  <button class="w-12 h-12 bg-gw-text text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gw-text/20">
                    <i-lucide [img]="PlayIcon" size="20"></i-lucide>
                  </button>
               </div>

               @if (isAdmin()) {
                 <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <button class="p-2 bg-white border border-gw-card-border rounded-lg text-gw-text-muted hover:text-gw-primary transition-colors">
                      <i-lucide [img]="EditIcon" size="14"></i-lucide>
                    </button>
                    <button (click)="deactivateScript(script)" class="p-2 bg-white border border-gw-card-border rounded-lg text-gw-text-muted hover:text-gw-error transition-colors">
                      <i-lucide [img]="TrashIcon" size="14"></i-lucide>
                    </button>
                 </div>
               }
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm p-2 flex justify-center">
        <mat-paginator 
          [length]="totalCount()" 
          [pageSize]="12" 
          [pageSizeOptions]="[12, 24, 48]"
          (page)="handlePageChange($event)"
          class="!border-none"
        ></mat-paginator>
      </div>
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

  readonly SearchIcon = Search;
  readonly LinesIcon = Layers;
  readonly ClockIcon = Clock;
  readonly PreviewIcon = Eye;
  readonly PlayIcon = Play;
  readonly EditIcon = Edit3;
  readonly TrashIcon = Trash2;
  readonly PlusIcon = Plus;

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

  deactivateScript(script: Script) {
    if (confirm(`Are you sure you want to deactivate "${script.scriptTitle}"?`)) {
      this.scriptService.updateScriptStatus({ scriptId: Number(script.id), isActive: false }).subscribe(() => {
        this.toast.success('Script deactivated');
        this.loadScripts();
      });
    }
  }
}

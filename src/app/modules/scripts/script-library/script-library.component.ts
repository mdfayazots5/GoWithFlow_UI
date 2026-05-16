import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, BookOpen, Play, ChevronRight, Tags } from 'lucide-angular';
import { ScriptService, Script } from '@core/services/script.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-script-library',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-8 animate-in fade-in duration-500">
      <div class="space-y-1">
        <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Script Library</h1>
        <p class="text-ls-text-muted font-medium">Choose a scenario to practice your fluency.</p>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <i-lucide [img]="SearchIcon" size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
          <input 
            type="text" 
            [(ngModel)]="filters.SearchTerm"
            (ngModelChange)="loadScripts()"
            placeholder="Search scenarios..."
            class="input-field pl-12"
          >
        </div>
        <div class="flex gap-2">
          <select 
            [(ngModel)]="filters.Category"
            (ngModelChange)="loadScripts()"
            class="h-14 bg-white border border-ls-card-border rounded-2xl px-4 font-bold text-xs uppercase tracking-widest outline-none focus:border-ls-primary transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Grammar Drill">Grammar Drill</option>
            <option value="Roleplay">Roleplay</option>
            <option value="Mock Interview">Mock Interview</option>
          </select>
        </div>
      </div>

      <!-- Script Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let script of scripts" class="card group hover:border-ls-primary transition-all cursor-pointer">
           <div class="flex flex-col h-full gap-6">
              <div class="flex items-start justify-between">
                 <div class="w-12 h-12 bg-ls-bg rounded-2xl flex items-center justify-center text-ls-primary group-hover:bg-ls-primary group-hover:text-white transition-all">
                    <i-lucide [img]="BookIcon" size="24"></i-lucide>
                 </div>
                 <span class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-2 py-1 bg-ls-bg rounded-lg">
                    v{{ script.version }}
                 </span>
              </div>

              <div class="space-y-1 flex-1">
                 <h3 class="text-lg font-black italic text-ls-text group-hover:text-ls-primary transition-all">{{ script.title }}</h3>
                 <p class="text-xs text-ls-text-muted font-medium line-clamp-2">{{ script.description || 'Practice conversational English in this realistic scenario.' }}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                 <div class="flex items-center gap-1.5 px-2 py-1 bg-ls-bg rounded-lg text-[10px] font-black uppercase tracking-widest text-ls-text">
                    <i-lucide [img]="TagsIcon" size="12" class="text-ls-accent"></i-lucide>
                    {{ script.grammarFocusTag }}
                 </div>
                 <div class="px-2 py-1 bg-ls-bg rounded-lg text-[10px] font-black uppercase tracking-widest text-ls-text">
                    {{ script.targetAgeGroup }}
                 </div>
              </div>

              <button class="w-full btn-primary h-12 gap-2 text-xs">
                 <i-lucide [img]="PlayIcon" size="14"></i-lucide>
                 Start Session
              </button>
           </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center py-20">
         <div class="w-8 h-8 border-4 border-ls-primary border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && scripts.length === 0" class="text-center py-20 card border-dashed">
         <p class="text-ls-text-muted font-black italic uppercase tracking-widest">No scripts found matches your filter</p>
      </div>
    </div>
  `,
  styles: []
})
export class ScriptLibraryComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly BookIcon = BookOpen;
  readonly PlayIcon = Play;
  readonly TagsIcon = Tags;

  scripts: Script[] = [];
  loading = false;
  filters = {
    SearchTerm: '',
    Category: '',
    PageNumber: 1,
    PageSize: 12
  };

  constructor(private scriptService: ScriptService) {}

  ngOnInit() {
    this.loadScripts();
  }

  loadScripts() {
    this.loading = true;
    this.scriptService.getScripts(this.filters).subscribe({
      next: (res) => {
        this.scripts = res.items;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Search, Headphones, Play, BookOpen } from 'lucide-angular';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { SkeletonListComponent } from '@shared/ui/skeleton';

/**
 * Listen Script — picker. Landing page for the bottom-nav "Listen" tab: choose a script,
 * then open the lyrics-style player at /scripts/listen/:scriptId.
 */
@Component({
  selector: 'app-listen-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink, SkeletonListComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-4 animate-in fade-in duration-500">

        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
            <i-lucide [img]="HeadphonesIcon" size="20" class="text-gw-primary"></i-lucide>
          </div>
          <div>
            <h1 class="text-xl font-black text-gw-text tracking-tight leading-tight">Listen Script</h1>
            <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Hear a script read aloud — hands-free practice</p>
          </div>
        </div>

        <div class="relative">
          <i-lucide [img]="SearchIcon" size="15"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
          <input [formControl]="searchControl" type="text" placeholder="Search scripts..."
            class="w-full h-11 bg-white border border-gw-card-border rounded-2xl pl-11 pr-4 text-sm font-medium text-gw-text shadow-sm outline-none focus:border-gw-primary transition-colors placeholder:text-gw-text-muted/60">
        </div>

        @if (isLoading()) {
          <app-skeleton-list [rows]="6"></app-skeleton-list>
        }
        @else if (scripts().length === 0) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
              <i-lucide [img]="BookIcon" size="22" class="text-gw-text-muted"></i-lucide>
            </div>
            <p class="text-sm font-bold text-gw-text">No scripts found</p>
            <p class="text-xs text-gw-text-muted">Try adjusting your search.</p>
          </div>
        }
        @else {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
            <div class="divide-y divide-gw-bg">
              @for (script of scripts(); track script.id) {
                <a [routerLink]="['/scripts/listen', script.id]"
                  class="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gw-bg/50 transition-colors no-underline">
                  <div class="w-10 h-10 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
                    <i-lucide [img]="HeadphonesIcon" size="18" class="text-gw-primary"></i-lucide>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gw-text truncate leading-tight">{{ script.scriptTitle }}</p>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted">{{ script.category }}</span>
                      <span class="text-[11px] font-semibold text-gw-text-muted">{{ script.utteranceCount }} lines</span>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-xl bg-gw-primary text-white flex items-center justify-center shrink-0">
                    <i-lucide [img]="PlayIcon" size="15"></i-lucide>
                  </div>
                </a>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ListenPickerComponent implements OnInit {
  private scriptService = inject(ScriptService);

  readonly SearchIcon = Search;
  readonly HeadphonesIcon = Headphones;
  readonly PlayIcon = Play;
  readonly BookIcon = BookOpen;

  scripts = signal<Script[]>([]);
  isLoading = signal(true);

  searchControl = new FormControl('');

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.load());
  }

  private load(): void {
    this.isLoading.set(true);
    const filters: any = {
      search: this.searchControl.value || undefined,
      isActive: true,
      page: 0,
      limit: 50,
    };
    this.scriptService.getScripts(filters).subscribe({
      next: res => {
        this.scripts.set(res.items ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

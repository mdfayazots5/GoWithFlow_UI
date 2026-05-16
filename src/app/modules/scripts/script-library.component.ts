import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Book, Filter, ChevronRight, Play } from 'lucide-angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { DemoBannerComponent } from '@shared/components/demo-banner/demo-banner.component';
import { ScriptService, Script } from '@core/services/script.service';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-script-library',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HeaderComponent, BottomNavComponent, DemoBannerComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-ls-bg pb-24">
      <app-demo-banner></app-demo-banner>
      <app-header title="Script Library" subtitle="Discover new practice dialogues"></app-header>

      <main class="p-6 space-y-6">
        <!-- Search Bar -->
        <div class="relative">
           <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-ls-text-muted"></i-lucide>
           <input 
             type="text" 
             placeholder="Search grammar, context, or title..." 
             class="w-full h-14 pl-12 pr-4 bg-white border border-ls-card-border rounded-2xl text-ls-text text-sm focus:outline-none focus:border-ls-primary transition-all shadow-sm"
           >
        </div>

        <!-- Categories -->
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           <button *ngFor="let cat of categories" class="px-5 py-2 white-nowrap rounded-full bg-white border border-ls-card-border text-[10px] font-black uppercase tracking-widest text-ls-text-muted active:bg-ls-primary active:text-white transition-all">
              {{ cat }}
           </button>
        </div>

        <!-- Script List -->
        <div class="space-y-4" *ngIf="scripts$ | async as res">
           <div *ngFor="let s of res.items" 
              class="card bg-white border border-ls-card-border p-5 flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.99]"
           >
              <div class="flex items-center gap-4">
                 <div class="w-12 h-12 bg-ls-bg rounded-xl flex items-center justify-center text-ls-primary border border-ls-card-border">
                    <i-lucide [img]="BookIcon" size="24"></i-lucide>
                 </div>
                 <div>
                    <h4 class="font-black italic text-ls-text uppercase tracking-tight">{{ s.title }}</h4>
                    <div class="flex items-center gap-2 mt-1">
                       <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-ls-primary rounded">{{ s.category }}</span>
                       <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-orange-50 text-ls-accent rounded">{{ s.grammarFocusTag }}</span>
                    </div>
                 </div>
              </div>
              
              <button 
                [routerLink]="['/session/join']" 
                class="w-10 h-10 rounded-full bg-ls-bg flex items-center justify-center text-ls-text-muted group-hover:bg-ls-primary group-hover:text-white transition-all shadow-sm"
              >
                 <i-lucide [img]="PlayIcon" size="18"></i-lucide>
              </button>
           </div>
        </div>
      </main>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ScriptLibraryComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly BookIcon = Book;
  readonly FilterIcon = Filter;
  readonly ChevronIcon = ChevronRight;
  readonly PlayIcon = Play;

  categories = ['All', 'Grammar', 'Interview', 'Social', 'Kids', 'Kitchen'];
  scripts$!: Observable<{ items: Script[], total: number }>;

  constructor(private scriptService: ScriptService) {}

  ngOnInit() {
    this.scripts$ = this.scriptService.getScripts({});
  }
}

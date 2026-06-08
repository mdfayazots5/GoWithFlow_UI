import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScriptService } from '@core/services/script.service';
import { LucideAngularModule, BarChart2, AlertTriangle, TrendingUp, ChevronRight, Filter } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface ScriptAnalyticsItem {
  scriptId: number;
  scriptTitle: string;
  category: string;
  totalSessionsStarted: number;
  completionRate: number;
  avgFluencyScore: number;
  avgMistakeCount: number;
  avgDurationMinutes: number;
  avgReReadRate: number;
  repracticeConversionRate: number;
  lastUsedDate?: string;
  isInactive: boolean;
}

@Component({
  selector: 'app-admin-script-analytics',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">Script Analytics</h1>
          <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest italic mt-0.5">Performance metrics for all scripts</p>
        </div>
        <a routerLink="/admin/scripts"
          class="px-4 py-2 bg-gw-bg text-gw-text-muted text-xs font-bold rounded-xl hover:bg-gw-primary/10 hover:text-gw-primary transition-all">
          ← All Scripts
        </a>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @else {
        <!-- Summary cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white rounded-xl border border-gw-card-border p-4">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Total Scripts</p>
            <p class="text-2xl font-black text-gw-primary italic mt-1">{{ filteredByCategory().length }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gw-card-border p-4">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Avg Completion</p>
            <p class="text-2xl font-black text-gw-success italic mt-1">{{ avgCompletion() | number:'1.0-0' }}%</p>
          </div>
          <div class="bg-white rounded-xl border border-gw-card-border p-4">
            <p class="text-[11px] font-black uppercase tracking-widest text-amber-600 italic">Inactive Scripts</p>
            <p class="text-2xl font-black text-amber-500 italic mt-1">{{ inactiveCount() }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gw-card-border p-4">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Avg Fluency</p>
            <p class="text-2xl font-black text-gw-primary italic mt-1">{{ avgFluency() | number:'1.0-0' }}</p>
          </div>
        </div>

        <!-- Filter / count bar -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2 bg-white border border-gw-card-border rounded-xl px-3 py-2">
            <i-lucide [img]="FilterIcon" size="13" class="text-gw-text-muted"></i-lucide>
            <select [ngModel]="selectedCategory()" (ngModelChange)="selectedCategory.set($event)"
              class="text-[11px] font-bold uppercase tracking-wider text-gw-text bg-transparent outline-none cursor-pointer">
              <option value="">All Categories</option>
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
          <div class="flex items-center gap-2 bg-white border border-gw-card-border rounded-xl px-3 py-2">
            <span class="text-[11px] font-bold text-gw-text-muted uppercase tracking-wider">Sort by</span>
            <select [ngModel]="sortField()" (ngModelChange)="sortField.set($event)"
              class="text-[11px] font-bold uppercase tracking-wider text-gw-text bg-transparent outline-none cursor-pointer">
              <option value="sessions">Sessions</option>
              <option value="completion">Completion Rate</option>
              <option value="fluency">Avg Fluency</option>
              <option value="mistakes">Avg Mistakes</option>
              <option value="lastUsed">Last Used</option>
            </select>
          </div>
          <p class="text-[11px] font-bold text-gw-text-muted italic">{{ filtered().length }} scripts</p>
        </div>

        <!-- Analytics table (desktop only — avoids horizontal scroll on mobile) -->
        <div class="hidden md:block bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gw-bg border-b border-gw-card-border">
                <tr>
                  <th class="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted">Script</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Sessions</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Completion</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Avg Fluency</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Mistakes</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Duration</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Re-reads</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Repractice</th>
                  <th class="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-gw-text-muted text-right">Last Used</th>
                  <th class="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gw-bg">
                @for (item of filtered(); track item.scriptId) {
                  <tr class="hover:bg-gw-bg/50 transition-colors"
                    [ngClass]="{'bg-amber-50/30': item.isInactive}">
                    <td class="px-4 py-3.5">
                      <div class="flex items-start gap-2">
                        @if (item.isInactive) {
                          <i-lucide [img]="AlertIcon" size="12" class="text-amber-500 mt-0.5 flex-shrink-0"></i-lucide>
                        }
                        <div class="min-w-0">
                          <p class="text-xs font-black text-gw-text italic truncate max-w-[180px]">{{ item.scriptTitle }}</p>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-[11px] font-black uppercase tracking-wider text-gw-primary bg-gw-primary/10 px-1.5 py-0.5 rounded">{{ item.category }}</span>
                            @if (item.isInactive) {
                              <span class="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Inactive</span>
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-black text-gw-text">{{ item.totalSessionsStarted }}</span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-black"
                        [class.text-gw-success]="item.completionRate >= 80"
                        [class.text-amber-500]="item.completionRate >= 50 && item.completionRate < 80"
                        [class.text-gw-error]="item.completionRate < 50">
                        {{ item.completionRate | number:'1.0-0' }}%
                      </span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-black"
                        [class.text-gw-success]="item.avgFluencyScore >= 75"
                        [class.text-amber-500]="item.avgFluencyScore >= 50 && item.avgFluencyScore < 75"
                        [class.text-gw-text-muted]="item.avgFluencyScore === 0"
                        [class.text-gw-error]="item.avgFluencyScore > 0 && item.avgFluencyScore < 50">
                        {{ item.avgFluencyScore > 0 ? (item.avgFluencyScore | number:'1.0-0') : '—' }}
                      </span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-bold text-gw-text-muted">{{ item.avgMistakeCount | number:'1.1-1' }}</span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-bold text-gw-text-muted">{{ item.avgDurationMinutes | number:'1.0-0' }}m</span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-bold"
                        [class.text-gw-error]="item.avgReReadRate > 1.5"
                        [class.text-gw-text-muted]="item.avgReReadRate <= 1.5">
                        {{ item.avgReReadRate | number:'1.1-1' }}
                      </span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-xs font-black"
                        [class.text-gw-success]="item.repracticeConversionRate >= 30"
                        [class.text-gw-text-muted]="item.repracticeConversionRate < 30">
                        {{ item.repracticeConversionRate | number:'1.0-0' }}%
                      </span>
                    </td>
                    <td class="px-3 py-3.5 text-right">
                      <span class="text-[11px] font-semibold text-gw-text-muted">
                        {{ item.lastUsedDate ? (item.lastUsedDate | date:'MMM d') : 'Never' }}
                      </span>
                    </td>
                    <td class="px-3 py-3.5">
                      <a [routerLink]="['/admin/scripts']" [queryParams]="{ scriptId: item.scriptId }"
                        class="w-7 h-7 rounded-lg bg-gw-bg flex items-center justify-center text-gw-text-muted hover:bg-gw-primary/10 hover:text-gw-primary transition-all">
                        <i-lucide [img]="ChevronIcon" size="13"></i-lucide>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filtered().length === 0) {
            <div class="py-16 flex flex-col items-center gap-3 text-center">
              <i-lucide [img]="ChartIcon" size="32" class="text-gw-text-muted opacity-40"></i-lucide>
              <p class="text-sm font-black text-gw-text italic">No scripts found</p>
            </div>
          }
        </div>

        <!-- Analytics cards (mobile only — stacked, no horizontal scroll) -->
        <div class="md:hidden space-y-3">
          @for (item of filtered(); track item.scriptId) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 space-y-3"
              [ngClass]="{'border-amber-200 bg-amber-50/30': item.isInactive}">

              <!-- Card header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2 min-w-0">
                  @if (item.isInactive) {
                    <i-lucide [img]="AlertIcon" size="13" class="text-amber-500 mt-0.5 flex-shrink-0"></i-lucide>
                  }
                  <div class="min-w-0">
                    <p class="text-sm font-black text-gw-text italic truncate">{{ item.scriptTitle }}</p>
                    <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span class="text-[11px] font-black uppercase tracking-wider text-gw-primary bg-gw-primary/10 px-1.5 py-0.5 rounded">{{ item.category }}</span>
                      @if (item.isInactive) {
                        <span class="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Inactive</span>
                      }
                    </div>
                  </div>
                </div>
                <a [routerLink]="['/admin/scripts']" [queryParams]="{ scriptId: item.scriptId }"
                  class="w-8 h-8 rounded-lg bg-gw-bg flex items-center justify-center text-gw-text-muted hover:bg-gw-primary/10 hover:text-gw-primary transition-all flex-shrink-0">
                  <i-lucide [img]="ChevronIcon" size="14"></i-lucide>
                </a>
              </div>

              <!-- Metrics grid -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-gw-bg">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Sessions</span>
                  <span class="text-xs font-black text-gw-text">{{ item.totalSessionsStarted }}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Completion</span>
                  <span class="text-xs font-black"
                    [class.text-gw-success]="item.completionRate >= 80"
                    [class.text-amber-500]="item.completionRate >= 50 && item.completionRate < 80"
                    [class.text-gw-error]="item.completionRate < 50">
                    {{ item.completionRate | number:'1.0-0' }}%
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Avg Fluency</span>
                  <span class="text-xs font-black"
                    [class.text-gw-success]="item.avgFluencyScore >= 75"
                    [class.text-amber-500]="item.avgFluencyScore >= 50 && item.avgFluencyScore < 75"
                    [class.text-gw-text-muted]="item.avgFluencyScore === 0"
                    [class.text-gw-error]="item.avgFluencyScore > 0 && item.avgFluencyScore < 50">
                    {{ item.avgFluencyScore > 0 ? (item.avgFluencyScore | number:'1.0-0') : '—' }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Mistakes</span>
                  <span class="text-xs font-bold text-gw-text-muted">{{ item.avgMistakeCount | number:'1.1-1' }}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Duration</span>
                  <span class="text-xs font-bold text-gw-text-muted">{{ item.avgDurationMinutes | number:'1.0-0' }}m</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Re-reads</span>
                  <span class="text-xs font-bold"
                    [class.text-gw-error]="item.avgReReadRate > 1.5"
                    [class.text-gw-text-muted]="item.avgReReadRate <= 1.5">
                    {{ item.avgReReadRate | number:'1.1-1' }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Repractice</span>
                  <span class="text-xs font-black"
                    [class.text-gw-success]="item.repracticeConversionRate >= 30"
                    [class.text-gw-text-muted]="item.repracticeConversionRate < 30">
                    {{ item.repracticeConversionRate | number:'1.0-0' }}%
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-gw-text-muted">Last Used</span>
                  <span class="text-[11px] font-semibold text-gw-text-muted">
                    {{ item.lastUsedDate ? (item.lastUsedDate | date:'MMM d') : 'Never' }}
                  </span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm py-16 flex flex-col items-center gap-3 text-center">
              <i-lucide [img]="ChartIcon" size="32" class="text-gw-text-muted opacity-40"></i-lucide>
              <p class="text-sm font-black text-gw-text italic">No scripts found</p>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminScriptAnalyticsComponent implements OnInit {
  private scriptService = inject(ScriptService);

  readonly ChartIcon  = BarChart2;
  readonly AlertIcon  = AlertTriangle;
  readonly TrendIcon  = TrendingUp;
  readonly ChevronIcon = ChevronRight;
  readonly FilterIcon = Filter;

  categories = ['Grammar Drill', 'Roleplay', 'Mock Interview', 'Vocabulary Sprint', 'Fluency Drill', 'Repractice Round'];
  selectedCategory = signal('');
  sortField = signal('sessions');
  isLoading = signal(true);
  data = signal<ScriptAnalyticsItem[]>([]);

  // Category-filtered set (no sort) — drives both the table and the summary KPIs
  filteredByCategory = computed(() => {
    const cat = this.selectedCategory();
    return cat ? this.data().filter(d => d.category === cat) : this.data();
  });

  filtered = computed(() => this.sort(this.filteredByCategory()));

  avgCompletion = computed(() => {
    const items = this.filteredByCategory();
    return items.length ? items.reduce((s, i) => s + i.completionRate, 0) / items.length : 0;
  });
  inactiveCount = computed(() => this.filteredByCategory().filter(i => i.isInactive).length);
  avgFluency = computed(() => {
    const active = this.filteredByCategory().filter(i => i.avgFluencyScore > 0);
    return active.length ? active.reduce((s, i) => s + i.avgFluencyScore, 0) / active.length : 0;
  });

  ngOnInit() { this.loadData(); }

  // Load the full analytics set once; category filter + sort run client-side
  // off signals so both dropdowns react instantly without a server round-trip.
  loadData() {
    this.isLoading.set(true);
    this.scriptService.getScriptAnalytics().pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.data.set(data ?? []);
      this.isLoading.set(false);
    });
  }

  private sort(items: ScriptAnalyticsItem[]): ScriptAnalyticsItem[] {
    const field = this.sortField();
    return [...items].sort((a, b) => {
      switch (field) {
        case 'completion':  return b.completionRate - a.completionRate;
        case 'fluency':     return b.avgFluencyScore - a.avgFluencyScore;
        case 'mistakes':    return b.avgMistakeCount - a.avgMistakeCount;
        case 'lastUsed':    return (b.lastUsedDate ?? '').localeCompare(a.lastUsedDate ?? '');
        default:            return b.totalSessionsStarted - a.totalSessionsStarted;
      }
    });
  }
}

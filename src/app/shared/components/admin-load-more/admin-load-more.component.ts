// File: src/app/shared/components/admin-load-more/admin-load-more.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

/**
 * Standardized Admin mobile pagination control. Replaces `mat-paginator` across all
 * Admin list screens with the same Load-More pattern used in the user Session History,
 * giving one consistent, touch-friendly, horizontal-scroll-free pager everywhere.
 *
 * Usage:
 *   <app-admin-load-more
 *     [loading]="loadingMore()" [hasMore]="hasMore()"
 *     [loaded]="items().length" [total]="total()"
 *     (more)="loadMore()"></app-admin-load-more>
 */
@Component({
  selector: 'app-admin-load-more',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (hasMore || loaded > 0) {
      <div class="flex flex-col items-center gap-2 pt-1">
        @if (hasMore) {
          <button (click)="more.emit()" [disabled]="loading"
                  class="w-full py-3 rounded-2xl bg-white border border-gw-card-border
                         text-[11px] font-black uppercase tracking-widest text-gw-text-muted
                         hover:border-gw-primary hover:text-gw-primary transition-all
                         flex items-center justify-center gap-2 disabled:opacity-50">
            @if (loading) {
              <i-lucide [img]="LoaderIcon" size="14" class="animate-spin"></i-lucide>
              Loading...
            } @else {
              Load More
            }
          </button>
        }
        @if (total > 0) {
          <p class="text-[11px] font-semibold text-gw-text-muted">
            Showing {{ loaded }} of {{ total }}
          </p>
        }
      </div>
    }
  `,
  styles: [`:host { display: block; }`]
})
export class AdminLoadMoreComponent {
  @Input() loading = false;
  @Input() hasMore = false;
  @Input() loaded = 0;
  @Input() total = 0;
  @Output() more = new EventEmitter<void>();

  readonly LoaderIcon = Loader2;
}

// File: src/app/shared/ui/skeleton/skeleton-presets.component.ts
// Reusable skeleton presets composed from the SkeletonComponent primitive.
// These mirror the geometry of the most common content blocks across GoWithFlow
// (cards, lists, stat grids, tables) so any screen gets a consistent loading state
// with a single tag. Import only what a screen needs.
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

/** N lines of text. Last line is shorter to mimic a real paragraph. */
@Component({
  selector: 'app-skeleton-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="flex flex-col" [style.gap]="gap">
      @for (line of lines; track $index; let last = $last) {
        <app-skeleton height="{{ lineHeight }}"
                      width="{{ last && lines.length > 1 ? lastWidth : '100%' }}"
                      rounded="sm"></app-skeleton>
      }
    </div>
  `,
})
export class SkeletonTextComponent {
  @Input() set count(n: number) { this.lines = Array.from({ length: Math.max(1, n) }); }
  @Input() lineHeight = '12px';
  @Input() gap = '8px';
  @Input() lastWidth = '60%';
  lines = Array.from({ length: 3 });
}

/** A card shell: optional avatar + title + body lines. Matches `.gwf-card` geometry. */
@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent, SkeletonTextComponent],
  template: `
    <div class="bg-gw-card-bg rounded-2xl border border-gw-card-border shadow-sm p-5">
      <div class="flex items-center gap-3 mb-4">
        @if (avatar) {
          <app-skeleton width="40px" height="40px" rounded="xl" [block]="false"></app-skeleton>
        }
        <div class="flex-1">
          <app-skeleton width="55%" height="14px" rounded="sm"></app-skeleton>
        </div>
      </div>
      <app-skeleton-text [count]="bodyLines"></app-skeleton-text>
    </div>
  `,
})
export class SkeletonCardComponent {
  @Input() avatar = true;
  @Input() bodyLines = 2;
}

/** A vertical list of rows (avatar + 2 text lines + trailing chip).
 *  `bare` omits the card wrapper + header so it can drop inside an existing card. */
@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <ng-template #rowsTpl>
      <div class="divide-y divide-gw-bg">
        @for (row of rowsArr; track $index) {
          <div class="flex items-center gap-3 px-5 py-3.5">
            @if (avatar) {
              <app-skeleton width="40px" height="40px" rounded="xl" [block]="false"></app-skeleton>
            }
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <app-skeleton width="65%" height="13px" rounded="sm"></app-skeleton>
              <app-skeleton width="40%" height="11px" rounded="sm"></app-skeleton>
            </div>
            @if (trailing) {
              <app-skeleton width="48px" height="22px" rounded="lg" [block]="false"></app-skeleton>
            }
          </div>
        }
      </div>
    </ng-template>

    @if (bare) {
      <ng-container [ngTemplateOutlet]="rowsTpl"></ng-container>
    } @else {
      <div class="bg-gw-card-bg rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
        @if (header) {
          <div class="px-5 py-3.5 border-b border-gw-bg">
            <app-skeleton width="40%" height="11px" rounded="sm"></app-skeleton>
          </div>
        }
        <ng-container [ngTemplateOutlet]="rowsTpl"></ng-container>
      </div>
    }
  `,
})
export class SkeletonListComponent {
  @Input() set rows(n: number) { this.rowsArr = Array.from({ length: Math.max(1, n) }); }
  @Input() avatar = true;
  @Input() trailing = true;
  @Input() header = true;
  /** Render only the rows (no card chrome) for nesting inside an existing card. */
  @Input() bare = false;
  rowsArr = Array.from({ length: 3 });
}

/** A responsive grid of stat cards (mirrors `.stats-grid`). */
@Component({
  selector: 'app-skeleton-stat-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="grid gap-3" [style.gridTemplateColumns]="'repeat(' + cols + ', minmax(0, 1fr))'">
      @for (c of cellsArr; track $index) {
        <div class="bg-gw-card-bg rounded-2xl border border-gw-card-border shadow-sm p-4 flex flex-col gap-3">
          <app-skeleton width="28px" height="28px" rounded="lg" [block]="false"></app-skeleton>
          <app-skeleton width="50%" height="20px" rounded="sm"></app-skeleton>
          <app-skeleton width="70%" height="10px" rounded="sm"></app-skeleton>
        </div>
      }
    </div>
  `,
})
export class SkeletonStatGridComponent {
  @Input() cols = 3;
  @Input() set count(n: number) { this.cellsArr = Array.from({ length: Math.max(1, n) }); }
  cellsArr = Array.from({ length: 3 });
}

/** A table-style block: header row + N body rows × M columns. */
@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="bg-gw-card-bg rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 px-5 py-3 border-b border-gw-card-border bg-[#F8F9FC]">
        @for (col of colsArr; track $index) {
          <div class="flex-1"><app-skeleton width="60%" height="10px" rounded="sm"></app-skeleton></div>
        }
      </div>
      @for (row of rowsArr; track $index) {
        <div class="flex items-center gap-4 px-5 py-4 border-b border-gw-bg last:border-0">
          @for (col of colsArr; track $index) {
            <div class="flex-1"><app-skeleton width="80%" height="13px" rounded="sm"></app-skeleton></div>
          }
        </div>
      }
    </div>
  `,
})
export class SkeletonTableComponent {
  @Input() set rows(n: number) { this.rowsArr = Array.from({ length: Math.max(1, n) }); }
  @Input() set columns(n: number) { this.colsArr = Array.from({ length: Math.max(1, n) }); }
  rowsArr = Array.from({ length: 6 });
  colsArr = Array.from({ length: 4 });
}

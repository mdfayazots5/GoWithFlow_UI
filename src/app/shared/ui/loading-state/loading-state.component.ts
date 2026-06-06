// File: src/app/shared/ui/loading-state/loading-state.component.ts
//
// The scalable per-section loading pattern. Wrap any data-driven region and pass it the
// section's `loading` / `error` / `empty` flags plus a skeleton via the [skeleton] slot.
// This guarantees every screen handles all four states consistently with no extra logic:
//
//   <app-loading-state [loading]="loading()" [error]="error()" [empty]="rows().length === 0">
//     <ng-container skeleton><app-skeleton-list [rows]="5"></app-skeleton-list></ng-container>
//     <!-- default slot: the real content, only rendered once data is ready -->
//     ...rows...
//     <ng-container empty>Custom empty UI (optional)</ng-container>
//     <ng-container error>Custom error UI (optional)</ng-container>
//   </app-loading-state>
//
// State precedence: loading → error → empty → content. Content is NOT rendered until
// loading is false (Rule 1: never paint partial data), eliminating layout shift.
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, Inbox, RotateCcw } from 'lucide-angular';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (loading) {
      <ng-content select="[skeleton]"></ng-content>
    } @else if (error) {
      @if (hasErrorSlot) {
        <ng-content select="[error]"></ng-content>
      } @else {
        <div class="flex flex-col items-center justify-center text-center gap-3 py-12 px-6
                    bg-gw-card-bg rounded-2xl border border-gw-card-border">
          <div class="w-12 h-12 rounded-2xl bg-gw-error/10 flex items-center justify-center">
            <i-lucide [img]="ErrorIcon" size="22" class="text-gw-error"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">{{ errorMessage }}</p>
          @if (retryable) {
            <button (click)="retry.emit()"
              class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest
                     text-gw-primary hover:underline">
              <i-lucide [img]="RetryIcon" size="13"></i-lucide> Try again
            </button>
          }
        </div>
      }
    } @else if (empty) {
      @if (hasEmptySlot) {
        <ng-content select="[empty]"></ng-content>
      } @else {
        <div class="flex flex-col items-center justify-center text-center gap-2 py-12 px-6
                    bg-gw-card-bg rounded-2xl border border-gw-card-border">
          <div class="w-12 h-12 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="EmptyIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-sm font-bold text-gw-text">{{ emptyMessage }}</p>
        </div>
      }
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`:host { display: block; }`],
})
export class LoadingStateComponent {
  @Input() loading = false;
  @Input() error = false;
  @Input() empty = false;
  @Input() errorMessage = 'Something went wrong while loading.';
  @Input() emptyMessage = 'Nothing here yet.';
  @Input() retryable = true;

  /** Set these when projecting custom [error]/[empty] content so the defaults are skipped. */
  @Input() hasErrorSlot = false;
  @Input() hasEmptySlot = false;

  @Output() retry = new EventEmitter<void>();

  readonly ErrorIcon = AlertTriangle;
  readonly EmptyIcon = Inbox;
  readonly RetryIcon = RotateCcw;
}

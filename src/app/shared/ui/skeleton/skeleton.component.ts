// File: src/app/shared/ui/skeleton/skeleton.component.ts
// Skeleton primitive — the single shimmer building block every preset composes from.
// Keeps placeholder geometry identical to the real content so swapping skeleton → data
// produces ZERO layout shift (CLS). Uses the global `gwf-shimmer` keyframe (styles.scss).
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

type Rounded = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const RADIUS: Record<Rounded, string> = {
  sm: '6px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px', full: '9999px',
};

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="gwf-skeleton" [style.width]="width" [style.height]="height"
                   [style.borderRadius]="radius" [style.display]="block ? 'block' : 'inline-block'"
                   aria-hidden="true"></span>`,
  styles: [`
    :host { display: contents; }
    .gwf-skeleton {
      position: relative;
      overflow: hidden;
      background: var(--gwf-skeleton-base, #E7EAF1);
      will-change: background-position;
    }
    .gwf-skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--gwf-skeleton-sheen, rgba(255, 255, 255, 0.65)) 50%,
        transparent 100%
      );
      transform: translateX(-100%);
      animation: gwf-shimmer 1.4s ease-in-out infinite;
    }
    /* Respect users who prefer reduced motion — keep a static placeholder */
    @media (prefers-reduced-motion: reduce) {
      .gwf-skeleton::after { animation: none; }
    }
  `],
})
export class SkeletonComponent {
  /** CSS width, e.g. '100%', '120px', '6rem'. */
  @Input() width = '100%';
  /** CSS height, e.g. '16px', '2.5rem'. */
  @Input() height = '16px';
  /** Corner radius preset. */
  @Input() set rounded(value: Rounded) { this.radius = RADIUS[value] ?? RADIUS.md; }
  /** Render as block (default true) so it occupies its own line like the real element. */
  @Input() block = true;

  radius = RADIUS.md;
}

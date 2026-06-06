// File: src/app/shared/components/loader/loader.component.ts
// Full-screen BRANDED loader for blocking operations (initial load, login, route data).
// Driven by LoaderService. Selector kept as `app-loader` so the app shell is unchanged.
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LoaderService } from '@core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './loader.component.scss',
  template: `
    @if (loader.isLoading()) {
      <div class="gwf-loader" role="status" aria-live="polite" aria-label="Loading">
        <div class="gwf-loader__brand">
          <div class="gwf-loader__ring">
            <span class="gwf-loader__dot"></span>
          </div>
          <div class="gwf-loader__wordmark">
            Go<span>With</span>Flow
          </div>
          <p class="gwf-loader__msg">{{ loader.message() }}</p>
        </div>
      </div>
    }
  `,
})
export class LoaderComponent {
  readonly loader = inject(LoaderService);
}

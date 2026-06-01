// File: src/app/shared/components/loader/loader.component.ts
import { Component, inject } from '@angular/core';
import { LoaderService } from '@core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  styleUrl: './loader.component.scss',
  template: `
    @if (isLoading()) {
      <div class="loader-overlay">
        <div class="loader-spinner">
          <div class="spinner"></div>
          <p class="loader-message">Syncing your flow...</p>
        </div>
      </div>
    }
  `
})
export class LoaderComponent {
  isLoading = inject(LoaderService).isLoading;
}

import { ApplicationConfig } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { TabReuseStrategy } from './core/strategies/tab-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      // loadingInterceptor runs first so it counts every foreground request for the top bar.
      withInterceptors([loadingInterceptor, authInterceptor])
    ),
    { provide: RouteReuseStrategy, useClass: TabReuseStrategy },
  ]
};

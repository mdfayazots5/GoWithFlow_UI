import { Injectable } from '@angular/core';
import {
  RouteReuseStrategy,
  DetachedRouteHandle,
  ActivatedRouteSnapshot,
} from '@angular/router';

// Only the 4 primary bottom-nav tabs are kept alive.
// Everything else (detail pages, forms, session room) recreates normally.
const TAB_ROUTES = new Set([
  'user/dashboard',
  'user/my-mistakes',
  'user/progress',
  'session/history',
]);

function routeKey(route: ActivatedRouteSnapshot): string {
  return route.pathFromRoot
    .flatMap(v => v.url)
    .map(s => s.toString())
    .filter(s => s.length > 0)
    .join('/');
}

@Injectable({ providedIn: 'root' })
export class TabReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, DetachedRouteHandle>();

  // Called when leaving a route — should we store this component?
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return TAB_ROUTES.has(routeKey(route));
  }

  // Store the detached component tree
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = routeKey(route);
    if (handle) {
      this.cache.set(key, handle);
    } else {
      this.cache.delete(key);
    }
  }

  // Called when entering a route — do we have a cached version?
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = routeKey(route);
    return TAB_ROUTES.has(key) && this.cache.has(key);
  }

  // Return the cached component tree
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.get(routeKey(route)) ?? null;
  }

  // Standard same-route reuse (e.g. navigating to the route you're already on)
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  // Call this on logout to prevent stale authenticated components from being reattached
  clearCache(): void {
    this.cache.clear();
  }
}

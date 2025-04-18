import { Route } from '@angular/router';

export const FALLBACK_PAGE_ROUTE = 'player';

export const defaultRoutes: Route[] = [
  {
    path: '',
    redirectTo: `/${FALLBACK_PAGE_ROUTE}`,
    pathMatch: 'full'
  },
]

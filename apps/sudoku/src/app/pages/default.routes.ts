import { Route } from '@angular/router';
import { PLAYER_PAGE_ROUTE } from './player/player.manifest';

export const FALLBACK_PAGE_ROUTE = PLAYER_PAGE_ROUTE;

export const defaultRoutes: Route[] = [
  {
    path: '',
    redirectTo: `/${FALLBACK_PAGE_ROUTE}`,
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: `/${FALLBACK_PAGE_ROUTE}`,
    pathMatch: 'full'
  },
]

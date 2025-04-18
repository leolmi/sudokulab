import { Route } from '@angular/router';
import { PlayerComponent } from './player.component';
import { PLAYER_PAGE_ROUTE } from './player.manifest';

export const playerRoutes: Route[] = [
  {
    path: `${PLAYER_PAGE_ROUTE}/:id`,
    component: PlayerComponent
  },
  {
    path: PLAYER_PAGE_ROUTE,
    component: PlayerComponent
  }
]

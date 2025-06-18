import { Route } from '@angular/router';
import { MapsComponent } from './maps.component';
import { MAPS_PAGE_ROUTE } from './maps.manifest';

export const mapsRoutes: Route[] = [
  {
    path: MAPS_PAGE_ROUTE,
    component: MapsComponent
  }
]

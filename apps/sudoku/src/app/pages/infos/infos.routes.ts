import { Route } from '@angular/router';
import { INFOS_PAGE_ROUTE } from './infos.manifest';
import { InfosComponent } from './infos.component';

export const infosRoutes: Route[] = [
  {
    path: INFOS_PAGE_ROUTE,
    component: InfosComponent
  },
];

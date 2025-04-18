import { Route } from '@angular/router';
import { ManagementComponent } from './management.component';
import { MANAGEMENT_PAGE_ROUTE } from './management.manifest';
import { canActivatePage } from '../can-activate';

export const managementRoutes: Route[] = [
  {
    path: MANAGEMENT_PAGE_ROUTE,
    component: ManagementComponent,
    canActivate: [canActivatePage(MANAGEMENT_PAGE_ROUTE)]
  },
];

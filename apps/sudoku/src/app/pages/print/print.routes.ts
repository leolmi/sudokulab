import { Route } from '@angular/router';
import { PRINT_PAGE_ROUTE } from './print.manifest';
import { PrintComponent } from './print.component';

export const printRoutes: Route[] = [
  {
    path: PRINT_PAGE_ROUTE,
    component: PrintComponent
  },
];

import { Route } from '@angular/router';
import {
  generatorRoutes,
  infosRoutes,
  playerRoutes,
  printRoutes,
  managementRoutes,
  defaultRoutes,
  mapsRoutes
} from './pages';


export const appRoutes: Route[] = [
  ...playerRoutes,
  ...generatorRoutes,
  ...infosRoutes,
  ...printRoutes,
  ...managementRoutes,
  // ...mapsRoutes,
  ...defaultRoutes
];

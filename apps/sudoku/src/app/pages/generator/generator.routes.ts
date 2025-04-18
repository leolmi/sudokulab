import { Route } from '@angular/router';
import { GeneratorComponent } from './generator.component';
import { GENERATOR_PAGE_ROUTE } from './generator.manifest';

export const generatorRoutes: Route[] = [
  {
    path: GENERATOR_PAGE_ROUTE,
    component: GeneratorComponent
  },
]

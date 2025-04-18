import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { SUDOKU_PAGES } from '../model';
import { FALLBACK_PAGE_ROUTE } from './default.routes';


export function canActivatePage(route: string): CanActivateFn {
  return (aroute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const pages = inject(SUDOKU_PAGES);
    const router = inject(Router);
    if (state.url.startsWith(`/${route}`)) {
      const page = pages.find(p => p.route === route);
      const cannav = !page?.disabled;
      if (!cannav) router.navigate([FALLBACK_PAGE_ROUTE]);
      return cannav;
    }
    return true;
  };
}

import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, Observable, take } from 'rxjs';
import { cloneDeep as _clone, keys as _keys, values as _values } from 'lodash';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Dictionary, Layout } from '@olmi/model';
import { SUDOKU_PAGES } from './sudoku-page.manifest';
import { MenuItem } from './menu-item';

const MAX_WIDTH = 1400;
const COMPACT_WIDTH = 800;
const MATCHES: Dictionary<string> = {
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  narrow: `(max-width: ${MAX_WIDTH}px)`,
  compact: `(max-width: ${COMPACT_WIDTH}px)`,
}

export class SudokuState {
  private readonly _router = inject(Router);
  private readonly _manifests = inject(SUDOKU_PAGES);
  private readonly _layout = inject(BreakpointObserver);

  page$: BehaviorSubject<string>;
  menu$: BehaviorSubject<MenuItem[]>;
  title$: BehaviorSubject<string>;
  status$: BehaviorSubject<any>;
  layout$: BehaviorSubject<Layout>;

  route$: Observable<string>;

  menuHandler?: (item: MenuItem) => void;

  get pages() {
    return (this._manifests||[]).filter(m => !m.disabled);
  }

  constructor() {
    this.page$ = new BehaviorSubject<string>('');
    this.menu$ = new BehaviorSubject<MenuItem[]>([]);
    this.title$ = new BehaviorSubject<string>('');
    this.status$ = new BehaviorSubject<any>({});
    this.layout$ = new BehaviorSubject<Layout>({});

    this.route$ = this._router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects));

    this._layout
      .observe(_values(MATCHES))
      .subscribe(s => {
        const l: Layout = {};
        _keys(MATCHES).forEach(k => (<any>l)[k] = s.breakpoints[MATCHES[k]]);
        this.layout$.next(l);
        // console.log('LAYOUT', l);
      });

    combineLatest([this.route$, this.layout$])
      .subscribe(([url, l]: [string, Layout]) => this._loadState(url, l));
  }

  private _loadState(url: string, layout: Layout) {
    const manifest = this.pages.find(m => url.startsWith(`/${m.route}`));
    if (manifest) {
      const menu = (!!layout?.narrow) ? manifest.narrowMenu : manifest.menu;
      this.page$.next(manifest.route);
      this.title$.next(manifest.title);
      this.menu$.next(menu || []);
    }
  }

  checkState() {
    combineLatest([this.route$, this.layout$])
      .pipe(take(1))
      .subscribe(([url, l]: [string, Layout]) => this._loadState(url, l));
  }

  updateStatus(chs: any) {
    this.status$.next({ ...this.status$.value, ...chs });
  }

  updateStatusEx(handler: (status: any) => void) {
    const actual = _clone(this.status$.value);
    handler(actual);
    this.status$.next(actual);
  }

  updateRoute(route: string) {
    const page = this.pages.find(p => p.route === this.page$.value);
    if (page) page.lastRoute = route;
  }

  updateGeneratedSchemas(schema: string) {

  }
}

export const SUDOKU_STATE = new InjectionToken<SudokuState>('SUDOKU_STATE');

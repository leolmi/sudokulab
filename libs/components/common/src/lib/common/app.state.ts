import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, Observable, take } from 'rxjs';
import { cloneDeep as _clone, keys as _keys, values as _values } from 'lodash';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  DEFAULT_THEME,
  Dictionary,
  Layout,
  MenuItem, SDK_PREFIX,
  setBodyClass,
  SUDOKU_USER_OPTIONS_FEATURE,
  SYSTEM_MENU_CODE,
  THEME_CLASS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_OTHER,
  toggleClass
} from '@olmi/model';
import { SUDOKU_PAGES, SudokuPageManifest } from './sudoku-page.manifest';
import { AppUserOptions } from './user-options';
import { DOCUMENT } from '@angular/common';

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
  private readonly _doc = inject(DOCUMENT);
  private readonly _manifests = inject(SUDOKU_PAGES);
  private readonly _layout = inject(BreakpointObserver);

  page$: BehaviorSubject<string>;
  menu$: BehaviorSubject<MenuItem[]>;
  title$: BehaviorSubject<string>;
  status$: BehaviorSubject<any>;
  layout$: BehaviorSubject<Layout>;
  theme$: BehaviorSubject<string>;

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

    const o = AppUserOptions.getFeatures(SUDOKU_USER_OPTIONS_FEATURE, { theme: DEFAULT_THEME });
    this.theme$ = new BehaviorSubject<string>(o.theme);

    this.route$ = this._router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects));

    this._layout
      .observe(_values(MATCHES))
      .subscribe(s => {
        const l: Layout = {};
        _keys(MATCHES).forEach(k => (<any>l)[k] = s.breakpoints[MATCHES[k]]);
        this.layout$.next(l);
      });

    combineLatest([this.route$, this.layout$])
      .subscribe(([url, l]: [string, Layout]) => this._loadState(url, l));

    this.theme$.subscribe(theme => {
      const other = THEME_OTHER[theme];
      setBodyClass(this._doc, THEME_CLASS[theme], THEME_CLASS[other]);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, { theme });
      this._updateSystemMenu();
    });

    this.layout$.subscribe(l =>
      _keys(l).forEach(k =>
        toggleClass(this._doc.body, `layout-${k}`, (<any>l)[k])));
  }

  private _loadState(url: string, layout: Layout) {
    const manifest = this.pages.find(m => !!m.route && url.startsWith(`/${m.route}`));
    const menu = (!!layout?.narrow) ? manifest?.narrowMenu : manifest?.menu;
    if (manifest) {
      this.page$.next(manifest.route);
      this.title$.next(manifest.title);
    }
    this._updateSystemMenuItems(menu);
    this.menu$.next(menu||[]);
  }

  private _updateSystemMenuItems(menu?: MenuItem[]) {
    (menu||[]).forEach(mi => {
      if (mi.logic === 'system') {
        switch (mi.code) {
          case SYSTEM_MENU_CODE.darkTheme:
            mi.hidden = this.theme$.value === THEME_DARK;
            break;
          case SYSTEM_MENU_CODE.lightTheme:
            mi.hidden = this.theme$.value === THEME_LIGHT;
            break;
        }
      } else if ((mi.subMenu||[]).length>0) {
        this._updateSystemMenuItems(mi.subMenu);
      }
    })
  }

  private _updateSystemMenu() {
    const menu = _clone(this.menu$.value);
    this._updateSystemMenuItems(menu);
    this.menu$.next(menu || []);
  }

  private _handleSystemMenu(item: MenuItem) {
    switch (item.code) {
      case SYSTEM_MENU_CODE.restoreSettings:
        AppUserOptions.reset();
        break;
      case SYSTEM_MENU_CODE.darkTheme:
        this.theme$.next(THEME_DARK);
        break;
      case SYSTEM_MENU_CODE.lightTheme:
        this.theme$.next(THEME_LIGHT);
        break;
      default:
        console.warn(...SDK_PREFIX, 'unknown system menu item', item);
        break
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


  updateRoute(route: string) {
    const page = this.pages.find(p => p.route === this.page$.value);
    if (page) page.lastRoute = route;
  }

  handleMenuItem(item?: MenuItem) {
    if (!item) return;
    switch (item.logic) {
      case 'system':
        this._handleSystemMenu(item);
        break;
      default:
        if (this.menuHandler) {
          this.menuHandler(item);
        } else {
          console.warn(...SDK_PREFIX, 'unknown page menu item', item);
        }
        break;
    }
  }

  navigateToPage(page: SudokuPageManifest) {
    this._router.navigate([page.lastRoute || page.route]);
  }
}

export const SUDOKU_STATE = new InjectionToken<SudokuState>('SUDOKU_STATE');

import { inject, InjectionToken } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, take } from 'rxjs';
import { keys as _keys, values as _values } from 'lodash';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  DEFAULT_THEME,
  Dictionary,
  Layout,
  LocalContext,
  MenuItem,
  SDK_PREFIX,
  setBodyClass,
  SUDOKU_USER_OPTIONS_FEATURE,
  SudokulabInfo,
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
import { SUDOKU_API } from './interaction';

const MAX_WIDTH = 1400;
const COMPACT_WIDTH = 800;
const MATCHES: Dictionary<string> = {
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  narrow: `(max-width: ${MAX_WIDTH}px)`,
  compact: `(max-width: ${COMPACT_WIDTH}px)`,
}

export class SudokuState {
  static version: string = '';
  private readonly _router = inject(Router);
  private readonly _doc = inject(DOCUMENT);
  private readonly _manifests = inject(SUDOKU_PAGES);
  private readonly _layout = inject(BreakpointObserver);
  private readonly _interaction = inject(SUDOKU_API);
  private readonly _changed$: BehaviorSubject<any>;

  info$: BehaviorSubject<SudokulabInfo>;
  page$: BehaviorSubject<string>;
  manifest$: BehaviorSubject<SudokuPageManifest|undefined>;
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
    this._changed$ = new BehaviorSubject<any>({});
    this.info$ = new BehaviorSubject<SudokulabInfo>(new SudokulabInfo());
    this.page$ = new BehaviorSubject<string>('');
    this.manifest$ = new BehaviorSubject<SudokuPageManifest|undefined>(this._manifests.find(m => m.default));
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

    this.route$.pipe(distinctUntilChanged())
      .subscribe(url => {
        const manifest = this.pages.find(m => !!m.route && url.startsWith(`/${m.route}`));
        if (manifest && this.manifest$.value?.route !== manifest.route) this.manifest$.next(manifest);
      });

    this.theme$.subscribe(theme => {
      const other = THEME_OTHER[theme];
      setBodyClass(this._doc, THEME_CLASS[theme], THEME_CLASS[other]);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, { theme });
      this._changed$.next({});
    });

    this.layout$.subscribe(l =>
      _keys(l).forEach(k =>
        toggleClass(this._doc.body, `layout-${k}`, (<any>l)[k])));

    combineLatest([this.manifest$, this.info$, this.layout$, this.status$, this._changed$]).pipe(
      filter(([m,i,l,s,c]) => !!m && !!i))
      .subscribe(([manifest, info, layout, status, c]) => {
        const menu = (!!layout?.narrow) ? manifest?.narrowMenu : manifest?.menu;
        if (manifest) {
          this.page$.next(manifest.route);
          this.title$.next(`${manifest.title} ${info.version}`);
        }
        this._updateMenuStatus(menu, status);
        this.menu$.next(menu||[]);
      })

    this._interaction.ping()
      .pipe(filter(i => !!i), take(1))
      .subscribe((i: SudokulabInfo) => {
        SudokuState.version = i?.version||'';
        this.info$.next(i);
      });
  }

  private _updateSystemMenuItemStatus(item: MenuItem, status?: any) {
    switch (item.code) {
      case SYSTEM_MENU_CODE.darkTheme:
        item.hidden = this.theme$.value === THEME_DARK;
        break;
      case SYSTEM_MENU_CODE.lightTheme:
        item.hidden = this.theme$.value === THEME_LIGHT;
        break;
      case SYSTEM_MENU_CODE.globalDebug:
        item.active = LocalContext.isLevel('debug');
        break;
    }
  }

  private _updateMenuItemStatus(item: MenuItem, status?: any) {
    if (item.logic === 'system') {
      this._updateSystemMenuItemStatus(item, status);
    } else {
      item.disabled = calcItemDisabled(item, status);
      item.active = calcItemActive(item, status);
      item.routeActive = calcItemRoute(item, status);
    }
  }

  private _updateMenuStatus(menu?: MenuItem[], status?: any) {
    status = status || this.status$.value || {};
    (menu||[]).forEach(mi => {
      this._updateMenuItemStatus(mi, status);
      if ((mi.subMenu || []).length > 0) {
        this._updateMenuStatus(mi.subMenu, status);
      }
    });
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
      case SYSTEM_MENU_CODE.globalDebug:
        LocalContext.toggleLevel('debug');
        this._changed$.next({});
        break;
      default:
        console.warn(...SDK_PREFIX, 'unknown system menu item', item);
        break
    }
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


const calcItemDisabled = (item: MenuItem, status: any, pn?: string) => {
  const spn = `${(<any>item||{})[pn||'code'] || ''}`;
  return ['execute', 'private'].includes(item?.logic || '') && (status||{})[spn] === false;
}

const calcItemActive = (item: MenuItem, status: any, pn?: string) => {
  const spn = `${(<any>item||{})[pn||'code'] || ''}`;
  return item?.logic === 'switch' && !!(status||{})[spn];
}

const calcItemRoute = (item: MenuItem, status: any, pn?: string) => {
  const spn = `${(<any>item || {})[pn||'owner'] || ''}`;
  return item?.logic === 'navigate' && (status||{})[spn] === item?.property;
}

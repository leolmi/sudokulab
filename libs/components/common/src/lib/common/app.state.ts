import {
  computed,
  DOCUMENT,
  effect,
  inject,
  InjectionToken,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { keys as _keys, values as _values } from 'lodash';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ButtonsStatus,
  DEFAULT_THEME,
  Dictionary,
  Layout,
  LocalContext,
  MenuItem,
  mergeStatus,
  SDK_PREFIX,
  setBodyClass,
  SUDOKU_USER_OPTIONS_FEATURE,
  SudokulabInfo,
  SYSTEM_MENU_CODE,
  THEME_CLASS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_OTHER,
  toggleClass,
} from '@olmi/model';
import { SUDOKU_PAGES, SudokuPageManifest } from './sudoku-page.manifest';
import { AppUserOptions } from './user-options';

import { SUDOKU_API } from './interaction';

const MAX_WIDTH = 1400;
const COMPACT_WIDTH = 800;
const MATCHES: Dictionary<string> = {
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  narrow: `(max-width: ${MAX_WIDTH}px)`,
  compact: `(max-width: ${COMPACT_WIDTH}px)`,
}

/**
 * Stato globale dell'applicazione (page corrente, layout, tema, menu, ecc.).
 *
 * API signal-first:
 *  - lo stato è esposto come `Signal<T>` readonly
 *  - i derivati sono `computed()` o `toSignal(...)` di sorgenti esterne
 *  - i side-effect sul DOM e su `localStorage` sono in `effect()`
 *
 * `isRunning` è statico perché letto/scritto in modo cross-instance dai
 * worker manager: signal readonly + metodo `setIsRunning(v)` per mutarlo.
 */
export class SudokuState {
  static version = '';
  static algorithmsVersion = '';

  private static readonly _isRunning: WritableSignal<boolean> = signal<boolean>(false);
  static readonly isRunning: Signal<boolean> = SudokuState._isRunning.asReadonly();
  static setIsRunning(v: boolean) {
    SudokuState._isRunning.set(v);
  }

  private readonly _router = inject(Router);
  private readonly _doc = inject(DOCUMENT);
  private readonly _manifests = inject(SUDOKU_PAGES);
  private readonly _layoutObs = inject(BreakpointObserver);
  private readonly _interaction = inject(SUDOKU_API);

  private readonly _info = signal<SudokulabInfo>(new SudokulabInfo());
  private readonly _manifest = signal<SudokuPageManifest|undefined>(this._manifests.find(m => m.default));
  private readonly _status = signal<ButtonsStatus>(new ButtonsStatus());
  private readonly _layout = signal<Layout>({});
  private readonly _theme: WritableSignal<string>;
  private readonly _androidBottomBarBugFix: WritableSignal<boolean>;

  readonly info = this._info.asReadonly();
  readonly manifest = this._manifest.asReadonly();
  readonly status = this._status.asReadonly();
  readonly layout = this._layout.asReadonly();
  readonly theme: Signal<string>;
  readonly androidBottomBarBugFix: Signal<boolean>;
  readonly isDebugMode: Signal<boolean>;
  readonly route: Signal<string>;

  readonly page = computed<string>(() => this._manifest()?.route ?? '');
  readonly title = computed<string>(() => {
    const m = this._manifest();
    const i = this._info();
    return m ? `${m.title} ${i?.version || ''}` : '';
  });
  readonly menu: Signal<MenuItem[]>;

  menuHandler?: (item: MenuItem) => void;

  get pages() {
    return (this._manifests||[]).filter(m => !m.disabled);
  }

  constructor() {
    const o = AppUserOptions.getFeatures(SUDOKU_USER_OPTIONS_FEATURE, {
      theme: DEFAULT_THEME,
      androidBottomBarBugFix: false
    });
    this._theme = signal<string>(o.theme);
    this._androidBottomBarBugFix = signal<boolean>(!!o.androidBottomBarBugFix);
    this.theme = this._theme.asReadonly();
    this.androidBottomBarBugFix = this._androidBottomBarBugFix.asReadonly();

    this.isDebugMode = toSignal(
      LocalContext.changed$.pipe(map(() => LocalContext.isLevel('debug'))),
      { initialValue: LocalContext.isLevel('debug') }
    );

    this.route = toSignal(
      this._router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(e => e.urlAfterRedirects)
      ),
      { initialValue: this._router.url }
    );

    // menu derivato da manifest + info + layout + status. La mutazione in-place
    // dei MenuItem (`_updateMenuStatus`) è uno side-effect tollerato qui per
    // non rompere il contratto attuale dei consumer; verrà ripulito quando il
    // menu sarà reso interamente immutabile.
    // Restituiamo sempre uno shallow clone: la sorgente `manifest.menu` è la
    // stessa reference tra recompute, ma il signal deve emettere a ogni cambio
    // di `status` perché i flag dei MenuItem sono stati aggiornati in-place.
    this.menu = computed<MenuItem[]>(() => {
      const manifest = this._manifest();
      const info = this._info();
      const layout = this._layout();
      const status = this._status();
      if (!manifest || !info) return [];
      const menu = (layout?.narrow) ? manifest?.narrowMenu : manifest?.menu;
      this._updateMenuStatus(menu, status);
      return [...(menu || [])];
    });

    // breakpoint observer → layout signal
    this._layoutObs
      .observe(_values(MATCHES))
      .subscribe(s => {
        const l: Layout = {};
        _keys(MATCHES).forEach(k => (<any>l)[k] = s.breakpoints[MATCHES[k]]);
        this._layout.set(l);
      });

    // route → manifest sync
    effect(() => {
      const url = this.route();
      if (!url) return;
      const manifest = this.pages.find(m => !!m.route && url.startsWith(`/${m.route}`));
      if (manifest && this._manifest()?.route !== manifest.route) this._manifest.set(manifest);
    });

    // theme → DOM body class + persist su localStorage
    effect(() => {
      const theme = this._theme();
      const other = THEME_OTHER[theme];
      setBodyClass(this._doc, THEME_CLASS[theme], THEME_CLASS[other]);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, { theme });
    });

    // androidBottomBarBugFix → DOM body class + persist su localStorage
    effect(() => {
      const abbf = this._androidBottomBarBugFix();
      toggleClass(this._doc.body, 'android-bottom-bar-bug-fix', abbf);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, { androidBottomBarBugFix: abbf });
    });

    // isDebugMode → DOM body class
    effect(() => {
      const isDebug = this.isDebugMode();
      toggleClass(this._doc.body, 'debug-mode', isDebug);
    });

    // layout → DOM body classes (layout-portrait, layout-narrow, ecc.)
    effect(() => {
      const l = this._layout();
      _keys(l).forEach(k =>
        toggleClass(this._doc.body, `layout-${k}`, (<any>l)[k]));
    });

    // theme/abbf/debug → ricalcolo dello stato del menu di sistema
    effect(() => {
      this._theme();
      this._androidBottomBarBugFix();
      this.isDebugMode();
      this.updateStatus(this._calcStatusForSystemMenu());
    });

    // ping iniziale per recuperare versione e algoritmi dal server
    this._interaction.ping()
      .pipe(filter(i => !!i), take(1))
      .subscribe((i: SudokulabInfo) => {
        SudokuState.version = i?.version||'';
        SudokuState.algorithmsVersion = i?.algorithmsVersion||'';
        this._info.set(i);
      });
  }

  private _updateMenuStatus(menu?: MenuItem[], status?: ButtonsStatus) {
    const s = status || this._status() || new ButtonsStatus();
    (menu||[]).forEach(mi => {
      mi.hidden = !!s.hidden[mi.code||''];
      mi.disabled = !!s.disabled[mi.code||''];
      mi.active = !!s.active[mi.code||''];
      mi.routeActive = !!s.routeActive[mi.code||''];
      if (s.text[mi.code||'']) mi.text = s.text[mi.code||''];
      if (s.icon[mi.code||'']) mi.icon = s.icon[mi.code||''];
      if (s.color[mi.code||'']) mi.color = s.color[mi.code||''];
      if ((mi.subMenu || []).length > 0) {
        this._updateMenuStatus(mi.subMenu, s);
      }
    });
  }

  private _calcStatusForSystemMenu(): Partial<ButtonsStatus> {
    return {
      hidden: {
        [SYSTEM_MENU_CODE.darkTheme]: this._theme() === THEME_DARK,
        [SYSTEM_MENU_CODE.lightTheme]: this._theme() === THEME_LIGHT,
        [SYSTEM_MENU_CODE.androidBottomBarBugFix]: !LocalContext.isLevel('debug'),
      },
      active: {
        [SYSTEM_MENU_CODE.globalDebug]: LocalContext.isLevel('debug'),
        [SYSTEM_MENU_CODE.androidBottomBarBugFix]: this._androidBottomBarBugFix()
      }
    }
  }

  private _handleSystemMenu(item: MenuItem) {
    switch (item.code) {
      case SYSTEM_MENU_CODE.restoreSettings:
        AppUserOptions.reset();
        break;
      case SYSTEM_MENU_CODE.darkTheme:
        this._theme.set(THEME_DARK);
        break;
      case SYSTEM_MENU_CODE.lightTheme:
        this._theme.set(THEME_LIGHT);
        break;
      case SYSTEM_MENU_CODE.globalDebug:
        LocalContext.toggleLevel('debug');
        break;
      case SYSTEM_MENU_CODE.androidBottomBarBugFix:
        this._androidBottomBarBugFix.update(v => !v);
        break;
      default:
        console.warn(...SDK_PREFIX, 'unknown system menu item', item);
        break
    }
  }

  updateStatus(chs: Partial<ButtonsStatus>) {
    this._status.update(s => mergeStatus(s, chs));
  }

  updateRoute(route: string) {
    const page = this.pages.find(p => p.route === this.page());
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

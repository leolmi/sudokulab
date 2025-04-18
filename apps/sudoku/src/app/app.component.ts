import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import {
  DEFAULT_THEME,
  setBodyClass,
  SUDOKU_AUTHOR_LINK,
  SUDOKU_USER_OPTIONS_FEATURE,
  THEME_CLASS,
  THEME_ICON,
  THEME_OTHER,
  toggleClass
} from '@olmi/model';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { SUDOKU_PAGE_PLAYER_LOGIC } from './pages';
import { LayoutModule } from '@angular/cdk/layout';
import { keys as _keys } from 'lodash';
import { AppUserOptions, MenuItem, SUDOKU_STATE, SUDOKU_STORE, SudokuPageManifest } from '@olmi/common';


@Component({
  imports: [
    CommonModule,
    LayoutModule,
    RouterModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatIcon,
    MatIconButton
  ],
  selector: 'app-root',
  templateUrl: '/app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly _doc = inject(DOCUMENT);
  private readonly _router = inject(Router);

  logic = inject(SUDOKU_PAGE_PLAYER_LOGIC);
  state = inject(SUDOKU_STATE);
  store = inject(SUDOKU_STORE);

  pageSubMenu$: BehaviorSubject<MenuItem[]>;
  theme$: BehaviorSubject<string>;
  themeIcon$: Observable<string>;

  constructor() {
    const o = AppUserOptions.getFeatures(SUDOKU_USER_OPTIONS_FEATURE, { theme: DEFAULT_THEME });
    this.theme$ = new BehaviorSubject<string>(o.theme)

    this.themeIcon$ = this.theme$.pipe(map(theme => THEME_ICON[theme || DEFAULT_THEME]));
    this.pageSubMenu$ = new BehaviorSubject<MenuItem[]>([]);

    this.theme$.subscribe(theme => {
      const other = THEME_OTHER[theme];
      setBodyClass(this._doc, THEME_CLASS[theme], THEME_CLASS[other]);
      AppUserOptions.updateFeature(SUDOKU_USER_OPTIONS_FEATURE, { theme });
    });

    this.store.init(this.logic);

    this.state.layout$.subscribe(l =>
      _keys(l).forEach(k =>
        toggleClass(this._doc.body, `layout-${k}`, (<any>l)[k])));
  }

  clickOnLogo = () => window.open(SUDOKU_AUTHOR_LINK, "_blank");
  pageButtonClick = (page: SudokuPageManifest) => this._router.navigate([page.lastRoute || page.route]);
  toggleTheme = () => this.theme$.next(THEME_OTHER[this.theme$.value || DEFAULT_THEME]);
  toolbarButtonClick = (item: MenuItem) => (this.state.menuHandler) ? this.state.menuHandler(item) : null;
  buildSubMenu = (item: MenuItem) => this.pageSubMenu$.next(item.subMenu || []);
  resetSettings = () => AppUserOptions.reset();
}

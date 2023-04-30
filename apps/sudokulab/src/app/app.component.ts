import { AfterViewInit, Component, HostListener, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Facade,
  GeneratorFacade,
  LabFacade,
  OptionsFacade, PrintFacade, setApplicationTheme,
  SUDOKU_AUTHOR_LINK,
  SudokuFacade, SUDOKULAB_DARK_THEME,
  SudokulabPage,
  SudokulabPagesService,
  SudokulabWindowService,
  use
} from '@sudokulab/model';
import { BehaviorSubject, Observable } from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, take} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AvailablePages } from './model';
import { Dictionary } from '@ngrx/entity';
import { environment } from '../environments/environment';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  page$: Observable<SudokulabPage|undefined>;
  pages$: BehaviorSubject<SudokulabPage[]>;
  status$: Observable<Dictionary<boolean>>;
  compact$: Observable<boolean>;
  isLoadedSchemas$: Observable<boolean>;

  constructor(private _http: HttpClient,
              private _pagesProvider: SudokulabPagesService,
              private _router: Router,
              private _snack: MatSnackBar,
              private _sudoku: SudokuFacade,
              private _lab: LabFacade,
              private _generator: GeneratorFacade,
              private _print: PrintFacade,
              private _options: OptionsFacade,
              private _window: SudokulabWindowService) {
    this.pages$ = new BehaviorSubject<SudokulabPage[]>(_pagesProvider.pages);
    this.page$ = _sudoku.selectActivePage$;
    this.status$ = _sudoku.selectPageStatus$;
    this.compact$ = _sudoku.selectIsCompact$;
    this.isLoadedSchemas$ = _sudoku.selectIsLoadedSchemas$
      .pipe(distinctUntilChanged(), debounceTime(1000));

    _sudoku.setEnvironment(environment);
    _sudoku.fillDocuments();

    _sudoku.selectActiveMessage$
      .pipe(filter(a => !!a?.message))
      .subscribe(a =>
        this._snack.open(a?.message||'unknown', a?.action, {
          duration: a?.duration||3000,
          panelClass: `message-type-${a?.type||'info'}`,
        }).afterDismissed()
          .subscribe(r => {
            if (r.dismissedByAction && a?.actionCode) {
              setTimeout(() => _sudoku.raiseGenericAction(a?.actionCode||'', a.data));
            }
          }));

    _sudoku.selectTheme$.pipe(take(1)).subscribe(theme => setApplicationTheme(_window, theme));
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: any) {
    this._sudoku.checkCompactStatus();
  }

  ngAfterViewInit() {
    const codes = location.hash.substr(2).split('/');
    let page = this._pagesProvider.pages.find(page => page.code === codes[0]);
    if (!page) page = this._pagesProvider.pages.find(page => page.default);
    if (!!page) setTimeout(() => this._sudoku.setActivePage(page, {id: codes[1]}));
  }

  ngOnDestroy() {
    this._sudoku.saveUserSettings();
  }

  openPage(pag: SudokulabPage) {
    this._sudoku.setActivePage(pag);
  }

  private _getFacade = (code: string): Facade|undefined => {
    switch (code) {
      case AvailablePages.options: return this._options;
      case AvailablePages.lab: return this._lab;
      case AvailablePages.generator: return this._generator;
      case AvailablePages.print: return this._print;
      default: return undefined;
    }
  }

  execute(code: string) {
    use(this.page$, p => {
      const page = this._pagesProvider.pages.find(xp => xp.code === p?.code);
      const facade = this._getFacade(p?.code || '') || this._sudoku;
      if (!!page) page.execute(facade, code);
    });
  }

  clickOnLogo() {
    this._window.nativeWindow.open(SUDOKU_AUTHOR_LINK, "_blank");
  }
}

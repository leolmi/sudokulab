import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Facade,
  GeneratorFacade,
  LabFacade,
  OptionsFacade,
  SUDOKU_AUTHOR_LINK,
  SudokuFacade,
  SudokulabPage,
  SudokulabPagesService,
  SudokulabWindowService,
  use
} from '@sudokulab/model';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {AvailablePages} from './model';
import {Dictionary} from '@ngrx/entity';

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  page$: Observable<SudokulabPage|undefined>;
  pages$: BehaviorSubject<SudokulabPage[]>;
  status$: Observable<Dictionary<boolean>>;
  compact$: Observable<boolean>;

  constructor(private _http: HttpClient,
              private _pagesProvider: SudokulabPagesService,
              private _router: Router,
              private _snack: MatSnackBar,
              private _sudoku: SudokuFacade,
              private _lab: LabFacade,
              private _generator: GeneratorFacade,
              private _options: OptionsFacade,
              private _window: SudokulabWindowService) {
    this.pages$ = new BehaviorSubject<SudokulabPage[]>(_pagesProvider.pages);
    this.page$ = _sudoku.selectActivePage$;
    this.status$ = _sudoku.selectPageStatus$;
    this.compact$ = _sudoku.selectIsCompact$;

    _sudoku.selectActiveMessage$
      .pipe(filter(a => !!a?.message))
      .subscribe(a => this._snack.open(a?.message||'unknown', undefined, {
        duration: 3000,
        panelClass: `message-type-${a?.type||'info'}`
      }));
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: any) {
    this._sudoku.checkCompactStatus();
  }

  ngOnInit() {
    this._sudoku.fillDocuments();
  }

  ngAfterViewInit() {
    const codes = location.hash.substr(2).split('/');
    let page = this._pagesProvider.pages.find(page => page.code===codes[0]);
    if (!page) page = this._pagesProvider.pages.find(page => page.default);
    if (!!page) setTimeout(() => this._sudoku.setActivePage(page, { id: codes[1] }));
  }

  openPage(pag: SudokulabPage) {
    this._sudoku.setActivePage(pag);
  }

  private _getFacade = (code: string): Facade|undefined => {
    switch (code) {
      case AvailablePages.options: return this._options;
      case AvailablePages.lab: return this._lab;
      case AvailablePages.generator: return this._generator;
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

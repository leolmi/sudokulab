import {AfterViewInit, Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Sudoku, SudokuFacade, SudokulabPage, use} from '@sudokulab/model';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SudokulabPagesService} from "./services/sudokulab-pages.service";
import {Router} from "@angular/router";

@Component({
  selector: 'sudokulab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  page$: Observable<SudokulabPage|undefined>;
  pages$: BehaviorSubject<SudokulabPage[]>;

  constructor(private _http: HttpClient,
              private _pagesProvider: SudokulabPagesService,
              private _router: Router,
              private _snack: MatSnackBar,
              private _sudoku: SudokuFacade) {
    this.pages$ = new BehaviorSubject<SudokulabPage[]>(_pagesProvider.pages);
    this.page$ = _sudoku.selectActivePage$;
    // const sudoku = new Sudoku({
    //   values: '',
    //   rank: 9,
    //   fixed: '824070060560002000090000000019800020000000070206500000000005002000081009032000100'
    // });
    // _sudoku.loadSudoku(sudoku);

    _sudoku.selectActiveMessage$
      .pipe(filter(a => !!a?.message))
      .subscribe(a => this._snack.open(a?.message||'unknown', undefined, {
        duration: 3000,
        panelClass: `message-type-${a?.type||'info'}`
      }));
  }

  ngAfterViewInit() {
    const code = location.hash.substr(2);
    let page = this._pagesProvider.pages.find(page => page.code===code);
    if (!page) page = this._pagesProvider.pages.find(page => page.default);
    if (!!page) setTimeout(() => this._sudoku.setActivePage(page));
  }

  openPage(pag: SudokulabPage) {
    this._sudoku.setActivePage(pag);
  }

  execute(code: string) {
    use(this.page$, p => {
      const page = this._pagesProvider.pages.find(xp => xp.code === p?.code);
      if (!!page) page.execute(this._sudoku, code);
    });
  }
}

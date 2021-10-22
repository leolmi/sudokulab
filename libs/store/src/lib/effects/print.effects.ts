import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import { SudokulabWindowService } from '@sudokulab/model';
import * as SudokuActions from '../actions';
import { map, withLatestFrom } from 'rxjs/operators';
import * as SudokuSelectors from '../selectors';
import { composePage } from './print.builder';

@Injectable()
export class PrintEffects {

  print$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.print),
    withLatestFrom(this._store.select(SudokuSelectors.selectPrintPages)),
    map(([a, pages]) => {
      const html = pages.map(p => composePage(p)).join('\n');
      const print_page: any = this._window.nativeWindow.open(`../assets/templates/print.html`);
      if (!!print_page) print_page.data = { html };
    })
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>,
              private _window: SudokulabWindowService) {
  }
}


import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import { SUDOKULAB_DEFAULT_TEMPLATE_FILE, SudokulabWindowService } from '@sudokulab/model';
import * as SudokuActions from '../actions';
import { map, withLatestFrom } from 'rxjs/operators';
import * as SudokuSelectors from '../selectors';
import { cloneDeep as _clone } from 'lodash';

@Injectable()
export class PrintEffects {

  print$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.print),
    withLatestFrom(this._store.select(SudokuSelectors.selectPrintData)),
    map(([a, data]) => {
      const LN = (data?.codes||[]).length||1;
      const step = data?.schemaCount||1;
      for(let i = 0; i<LN; i+=step) {
        const tmpl: any = this._window.nativeWindow.open(`../assets/templates/${data?.file||SUDOKULAB_DEFAULT_TEMPLATE_FILE}`);
        if (!!tmpl) tmpl.data = { ...data?.bookmark, schemas: [] };
      }
    })
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>,
              private _window: SudokulabWindowService) {
  }
}

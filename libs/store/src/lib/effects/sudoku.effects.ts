import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as SudokuActions from '../actions';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getHash, PlaySudoku, Sudoku } from '@sudokulab/model';
import { cloneDeep as _clone } from 'lodash';

@Injectable()
export class SudokuEffects {

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    map(a => this._router.navigate([`${a.page?.code}`]))
  ), { dispatch: false });

  checkSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.checkSudoku),
    switchMap((a) => {
      const sdk: Sudoku = <Sudoku>_clone(a.schema);
      sdk._id = sdk._id || getHash(sdk.fixed);
      sdk.values = sdk.fixed;
      return this._http.post<Sudoku>('/api/sudoku/check', sdk).pipe(
        switchMap((res) => {
          console.log('CHECK RESULT', res);
          return !!res ? [SudokuActions.fillSchemas()] : [];
        }));
    })
  ));

  fillSchemas$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.fillSchemas),
    switchMap(() => this._http.get<Sudoku[]>('/api/sudoku/list').pipe(
      map(schemas => schemas.map(sudoku => new PlaySudoku({ sudoku }))),
      switchMap((schemas) => [SudokuActions.loadSchemas({ schemas })])))
  ));

  constructor(private _actions$: Actions,
              private _router: Router,
              private _http: HttpClient) {
  }
}

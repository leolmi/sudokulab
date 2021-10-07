import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as SudokuActions from '../actions';
import { concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  checkAvailables,
  getHash,
  PlaySudoku,
  saveUserSetting, setApplicationTheme,
  Sudoku,
  SudokulabWindowService
} from '@sudokulab/model';
import { cloneDeep as _clone } from 'lodash';
import * as SudokuSelectors from '../selectors';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';

@Injectable()
export class SudokuEffects {

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    filter(a => a.page?.code !== 'lab'),
    concatMap(a => {
      this._router.navigate([`${a.page?.code}`]);
      return [SudokuActions.updateDocumentTitle({})];
    })
  ));

  checkSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.checkSudoku),
    switchMap((a) => {
      const sdk: Sudoku = <Sudoku>_clone(a.schema);
      sdk._id = sdk._id || getHash(sdk.fixed);
      sdk.values = sdk.fixed;
      (sdk.info?.algorithms || []).forEach(a => a.cases = []);
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
      map(schemas => schemas.map(sudoku => {
        const ps = new PlaySudoku({ sudoku });
        checkAvailables(ps);
        return ps;
      })),
      switchMap((schemas) => [SudokuActions.loadSchemas({ schemas })])))
  ));

  updateDocumentTitle$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.updateDocumentTitle),
    withLatestFrom(this._store.select(SudokuSelectors.selectActivePage)),
    map(([a, page]) => document.title = page ? `SudokuLab - ${page.title} ${a.data||''}` : 'SudokuLab')
  ), { dispatch: false });

  resetOptions$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.resetOptions),
    map(() => {
      // TODO: reset options...
      console.log('reset user options...');
    })
  ), { dispatch: false });

  setTheme$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setTheme),
    map((a) => {
      setApplicationTheme(this._window, a.theme);
      saveUserSetting('sudoku.theme', a.theme);
    })
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>,
              private _window: SudokulabWindowService,
              private _router: Router,
              private _http: HttpClient) {
  }
}

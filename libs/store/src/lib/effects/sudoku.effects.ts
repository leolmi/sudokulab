import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import * as SudokuActions from '../actions';
import * as SudokuSelectors from '../selectors';
import { filter, switchMap, withLatestFrom } from 'rxjs/operators';
import { cloneDeep as _clone, forEach as _forEach } from 'lodash';
import {
  AlgorithmResult,
  checkAvailables,
  getAlgorithm,
  getAlgorithms,
  getAvailables, isValidValue,
  PlaySudoku, resetAvailables
} from '@sudokulab/model';


@Injectable()
export class SudokuEffects {

  applyAlgorithm$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.applyAlgorithm),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => {
      const changes = _clone(sdk||{});
      const alg = getAlgorithm(a.algorithm);
      if (!alg) {
        console.warn(`Algorithm "${a.algorithm}" not found!`)
        return [];
      }
      const result = alg.apply(<PlaySudoku>changes);
      if (!result.applied) return [];
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  clear$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.clear),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => {
      const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
      _forEach(changes?.cells || {}, (c) => {
        if (!!c) {
          c.value = (c.fixed ? c.value : '');
          if (!c.fixed) c.availables = getAvailables(changes);
        }
      });
      checkAvailables(changes);
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  solveStep$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solveStep),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => {
      if (sdk?.state.error) {
        console.warn('No algorithm can be applied!');
        return [];
      }
      const changes = _clone(sdk||{});
      let result: AlgorithmResult|undefined = undefined;
      const algorithm = getAlgorithms().find(alg => {
        result = alg?.apply(<PlaySudoku>changes);
        return result?.applied;
      });
      if (!algorithm) {
        console.warn('No algorithm has been applied!');
        return [];
      } else {
        console.log(`Algorithm "${algorithm.name}" successfully applied`, result);
      }
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  solve$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solve),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => {
      console.log('SOLVE SUDOKU', sdk);
      const changes = _clone(sdk||{});

      // TODO......
      if (true) return [];

      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  setValue$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setValue),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku),
      this._store.select(SudokuSelectors.selectActiveCell)),
    filter(([a, sdk, cid]) => !!sdk && isValidValue(sdk, a.value)),
    switchMap(([a, sdk, cid]) => {
      const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
      const cell = changes.cells[cid];
      if (!cell || cell.fixed) return [];
      let value = a.value;
      if (value === 'Delete') value = '';
      cell.value = (value||'').trim();
      if (!cell.value) {
        resetAvailables(changes);
      } else {
        cell.availables = [];
      }
      checkAvailables(changes);
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

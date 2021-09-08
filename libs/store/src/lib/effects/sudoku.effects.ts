import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import * as SudokuActions from '../actions';
import * as SudokuSelectors from '../selectors';
import { filter, switchMap, withLatestFrom } from 'rxjs/operators';
import { cloneDeep as _clone, values as _values } from 'lodash';
import { AlgorithmResult, getAlgorithm, getAlgorithms, PlaySudoku } from '@sudokulab/model';


@Injectable()
export class SudokuEffects {

  // test$ = createEffect(() => this._actions$.pipe(
  //   ofType(SudokuActions.test),
  //   withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
  //   filter(([a, sdk]) => !!sdk),
  //   switchMap(([a, sdk]) => {
  //     const changes = _clone(sdk||{});
  //     checkAvailables(<PlaySudoku>changes);
  //     return [SudokuActions.updateSudoku({ changes })]
  //   })
  // ));

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

  solveStep$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solveStep),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => {
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

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

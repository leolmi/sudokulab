import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {SudokuStore} from '../sudoku-store';
import * as SudokuActions from '../actions';
import * as SudokuSelectors from '../selectors';
import {concatMap, filter, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {cloneDeep as _clone} from 'lodash';
import {
  Algorithms,
  applyAlgorithm,
  AVAILABLE_DIRECTIONS,
  calcDifficulty,
  cellId,
  checkAvailables,
  clear,
  decodeCellId, getSchemaName,
  isValidValue,
  MessageType,
  MoveDirection,
  PlaySudoku,
  resetAvailables,
  Solver,
  solveStep,
  Sudoku,
  SudokuInfo,
  SudokuMessage
} from '@sudokulab/model';
import {Router} from "@angular/router";
import { saveAs } from 'file-saver';
import {Schema} from "@sudokulab/api-interfaces";

@Injectable()
export class SudokuEffects {

  applyAlgorithm$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.applyAlgorithm),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const changes = applyAlgorithm(sdk, a.algorithm);
      if (!changes) return [];
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  clear$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.clear),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const changes = clear(sdk);
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  analyze$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.analyze),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const solver = new Solver(sdk);
      const message = solver.check();
      if (!!message)
        return [SudokuActions.setActiveMessage({
          message: new SudokuMessage({message, type: MessageType.warning
        })})];
      const result = solver.solve();
      const info = new SudokuInfo();
      if (result.unique) {
        info.unique = true;
        info.algorithms = result.unique.algorithms;
        calcDifficulty(info);
        const sudoku: Sudoku = <Sudoku>_clone(result.unique.sdk.sudoku);
        sudoku.info = info;
        return [SudokuActions.updateSudoku({ changes: { id: result.unique.sdk.id, sudoku } })];
      } else if (result.multiple) {
        const sudoku: Sudoku = <Sudoku>_clone(result.solutions[0].sdk.sudoku);
        sudoku.info = info;
        return [SudokuActions.updateSudoku({ changes: { sudoku } })];
      } else {
        return [];
      }
    })
  ));

  solve$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solve),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const solver = new Solver(sdk);
      let message: SudokuMessage;
      const info = new SudokuInfo();
      const result = solver.solve();
      if (result.unique) {
        message = new SudokuMessage({
          message: 'Sudoku successfully solved!',
          type: MessageType.success
        });
        info.unique = true;
        info.algorithms = result.unique.algorithms;
        calcDifficulty(info);
        if (!!result.unique.sdk.sudoku) result.unique.sdk.sudoku.info = info;
        return [
          SudokuActions.updateSudoku({ changes: result.unique.sdk }),
          SudokuActions.setActiveMessage({ message })];
      } else if (result.multiple) {
        message = new SudokuMessage({
          message: 'Sudoku has multiple results!',
          type: MessageType.warning
        });
        info.solutions = _clone(result.multiple.filter(s => s.sdk.state.complete));
        return [
          SudokuActions.updateSudoku({ changes: result.multiple[0].sdk }),
          SudokuActions.setActiveMessage({ message })];
      }
      message = new SudokuMessage({
        message: 'Sudoku has no valid result!',
        type: MessageType.error
      });
      return [SudokuActions.setActiveMessage({ message })];
    })
  ));

  dowloadSchema$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.dowloadSchema),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    map(([a, sdk]) => {
      const schema: Schema = {
        fixed: sdk?.sudoku?.fixed||'',
        info: sdk?.sudoku?.info,
        name: getSchemaName(sdk)
      };
      const schema_str = JSON.stringify(schema, null, 2);
      const blob = new Blob([schema_str], {type: "application/json;"});
      saveAs(blob, `${schema.name}.json`);
    })
  ), { dispatch: false });

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    map(a => this._router.navigate([`${a.page?.code}`]))
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>,
              private _router: Router) {
  }
}

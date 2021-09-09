import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import * as SudokuActions from '../actions';
import * as SudokuSelectors from '../selectors';
import { filter, switchMap, withLatestFrom } from 'rxjs/operators';
import { cloneDeep as _clone } from 'lodash';
import {
  Algorithms,
  applyAlgorithm,
  AVAILABLE_DIRECTIONS,
  cellId,
  checkAvailables,
  clear,
  decodeCellId,
  isValidValue,
  MessageType,
  MoveDirection,
  PlaySudoku,
  resetAvailables,
  Solver,
  solveStep,
  SudokuMessage
} from '@sudokulab/model';


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

  solveStep$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solveStep),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      const result = solveStep(sdk, [Algorithms.tryNumber]);
      if (!result) return [];
      return [SudokuActions.updateSudoku({ changes: result.sdk })];
    })
  ));

  solve$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solve),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const solver = new Solver(sdk);
      let message: SudokuMessage;
      const result = solver.solve();
      if (result.unique) {
        message = new SudokuMessage({
          message: 'Sudoku successfully solved!',
          type: MessageType.success
        });
        return [
          SudokuActions.updateSudoku({ changes: result.unique.sdk }),
          SudokuActions.setActiveMessage({ message })];
      }
      if (result.multiple) {
        message = new SudokuMessage({
          message: 'Sudoku has multiple results!',
          type: MessageType.warning
        });
        console.warn(message.message, result.multiple);
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

  move$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.move),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku),
      this._store.select(SudokuSelectors.selectActiveCell)),
    switchMap(([a, sdk, cell]) => {
      if (!a?.direction || !cell || !sdk) return [];
      const info = decodeCellId(cell);
      if (info.row < 0 || info.col < 0) return [];
      const rank = sdk?.sudoku?.rank||9;
      switch (AVAILABLE_DIRECTIONS[a.direction]||MoveDirection.next) {
        case MoveDirection.up:
          if (info.row <= 0) return [];
          info.row--;
          break;
        case MoveDirection.down:
          if (info.row >= rank - 1) return [];
          info.row++;
          break;
        case MoveDirection.left:
          if (info.col <= 0) return [];
          info.col--;
          break;
        case MoveDirection.right:
          if (info.col >= rank - 1) return [];
          info.col++;
          break;
        case MoveDirection.next:
        default:
          if (info.col === rank - 1) {
            if (info.row === rank - 1) {
              info.col = 0;
              info.row = 0;
            } else {
              info.row++;
              info.col = 0;
            }
          } else {
            info.col ++;
          }
          break;
      }
      return [SudokuActions.setActiveCell({ id: cellId(info.col, info.row) })];
    })
  ));

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {Store} from "@ngrx/store";
import {SudokuStore} from "../sudoku-store";
import * as SudokuActions from "../actions";
import {concatMap, filter, switchMap, withLatestFrom} from "rxjs/operators";
import * as SudokuSelectors from "../selectors";
import {
  Algorithms,
  AVAILABLE_DIRECTIONS,
  cellId,
  checkAvailables,
  decodeCellId,
  isValidValue,
  MessageType,
  MoveDirection,
  PlaySudoku,
  resetAvailables,
  solveStep,
  SudokuMessage
} from "@sudokulab/model";
import {cloneDeep as _clone} from 'lodash';

@Injectable()
export class LabEffects {

  loadSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.loadSudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk && !sdk.sudoku?.info?.compiled),
    concatMap(([a, sdk]) =>
      // TODO: verificare nelle opzioni se questa funzionalità è prevista
      [SudokuActions.analyze()])
  ));

  solveStep$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solveStep),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      const result = solveStep(sdk, [Algorithms.tryNumber]);
      if (!result) return [];
      return [
        SudokuActions.updateSudoku({ changes: result.sdk }),
        SudokuActions.checkState()];
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
      return [
        SudokuActions.updateSudoku({ changes }),
        SudokuActions.checkState()];
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

  checkState$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.checkState),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {

      if (sdk?.state.error) return [SudokuActions.setActiveMessage({
        message: new SudokuMessage({
          message: 'Schema has no available result!',
          type: MessageType.warning
        })
      })];

      if (sdk?.state.complete) return [SudokuActions.setActiveMessage({
        message: new SudokuMessage({
          message: 'Schema successfully completed!',
          type: MessageType.success
        })
      })];

      return [];
    })
  ));

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

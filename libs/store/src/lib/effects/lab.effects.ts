import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { SudokuStore } from '../sudoku-store';
import * as SudokuActions from '../actions';
import { concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import * as SudokuSelectors from '../selectors';
import {
  Algorithms,
  applyAlgorithm,
  buildSudokuInfo,
  cellId,
  checkAvailables,
  clear,
  getSchemaName,
  isValidValue,
  MessageType,
  moveOnDirection,
  PlaySudoku,
  resetAvailables,
  Solver,
  solveStep,
  Sudoku,
  SudokuInfo,
  SudokuMessage
} from '@sudokulab/model';
import { cloneDeep as _clone } from 'lodash';
import { Schema } from '@sudokulab/api-interfaces';
import { saveAs } from 'file-saver';

@Injectable()
export class LabEffects {

  loadSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.loadSudoku),
    concatMap((a) => [SudokuActions.setActiveSudoku({ active: a.sudoku?._id||0 })])
  ));

  activeteSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActiveSudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk && !sdk.sudoku?.info?.compiled),
    // TODO: verificare nelle opzioni se questa funzionalità è prevista
    concatMap(([a, sdk]) => [SudokuActions.analyze()])
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
      const info = moveOnDirection(cell, sdk?.sudoku, a.direction);
      return !!info ? [SudokuActions.setActiveCell({ id: cellId(info.col, info.row) })] : [];
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

  analyze$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.analyze),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const solver = new Solver(sdk);
      const check_message = solver.check();
      if (!!check_message) {
        const message = new SudokuMessage({ message: check_message, type: MessageType.warning });
        return [SudokuActions.setActiveMessage({ message })];
      }
      const result = solver.solve();
      if (result.unique) {
        const schema: Sudoku = <Sudoku>_clone(result.unique.sdk.sudoku);
        schema.info = buildSudokuInfo(schema, { unique: true, algorithms: result.unique.algorithms });
        return [
          SudokuActions.updateSudoku({ changes: { _id: schema._id, sudoku: schema } }),
          SudokuActions.checkSudoku({ schema })];
      } else if (result.multiple) {
        const sudoku: Sudoku = <Sudoku>_clone(result.solutions[0].sdk.sudoku);
        sudoku.info = new SudokuInfo();
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
        const schema = result.unique.sdk.sudoku;
        message = new SudokuMessage({
          message: 'Sudoku successfully solved!',
          type: MessageType.success
        });
        const output: Action[] = [SudokuActions.updateSudoku({ changes: result.unique.sdk })];
        if (!!schema) {
          schema.info = buildSudokuInfo(schema, { unique: true, algorithms: result.unique.algorithms });
          output.push(SudokuActions.checkSudoku({ schema }))
        }
        output.push(SudokuActions.setActiveMessage({ message }));
        return output;
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
        _id: sdk?.sudoku?._id || 0,
        fixed: sdk?.sudoku?.fixed || '',
        info: sdk?.sudoku?.info,
        name: getSchemaName(sdk)
      };
      const schema_str = JSON.stringify(schema, null, 2);
      const blob = new Blob([schema_str], { type: "application/json;" });
      saveAs(blob, `${schema.name}.json`);
    })
  ), { dispatch: false });


  calcLabStatus$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage, SudokuActions.setActiveSudoku),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) =>
      [SudokuActions.updatePageStatus({ status: { has_no_lab_schema: !sdk } })])
  ));

  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

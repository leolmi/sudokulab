import {Inject, Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {SudokuStore} from '../sudoku-store';
import {concatMap, debounceTime, delay, filter, map, switchMap, withLatestFrom} from 'rxjs/operators';
import * as SudokuSelectors from '../selectors';
import * as SudokuActions from '../actions';
import {
  Algorithms,
  applyAlgorithm,
  BOARD_DATA,
  BoardData,
  buildSudokuInfo,
  calcFixedCount,
  cellId,
  checkAvailable,
  clear,
  getSchemaName,
  getSudokuForUserSettings,
  isValidValue,
  loadValues,
  MessageType,
  moveOnDirection,
  PlaySudoku,
  resetAvailable,
  saveUserSetting,
  SDK_PREFIX,
  SettingsChanges,
  Solver,
  solveStepToCell,
  Sudoku,
  SudokuInfo,
  SudokuMessage,
  toggleValue
} from '@sudokulab/model';
import {cloneDeep as _clone, extend as _extend, forEach as _forEach, last as _last} from 'lodash';
import {saveAs} from 'file-saver';
import {Router} from '@angular/router';

@Injectable()
export class LabEffects {

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    filter(a => a.page?.code === 'lab'),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) => {
      const id = a.data?.id||sdk?._id||'';
      this._router.navigate([`${a.page?.code}${id?`/${id}`:''}`]);
      return [SudokuActions.updateDocumentTitle({ data: `${id}` })];
    })
  ));

  loadSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.loadSudoku),
    concatMap((a) => [SudokuActions.setActiveSudoku({ active: a.sudoku?._id||0 })])
  ));

  loadSudokuRequest$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.loadSudokuRequest),
    filter(a => !!a?.sudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) => {
      if (a.onlyValues) {
        if (!sdk) return [];
        const changes = _clone(sdk);
        loadValues(changes, a.sudoku.values);
        return [
          SudokuActions.updateSudoku({ changes }),
          SudokuActions.checkState()];
      }
      return [SudokuActions.loadSudoku({ sudoku: a.sudoku })];
    })
  ));

  activateSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActiveSudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    filter(([a, sdk]) => !!sdk && !sdk.sudoku?.info?.compiled),
    // TODO: verificare nelle opzioni se questa funzionalità è prevista
    concatMap(([a, sdk]) => [SudokuActions.analyze()])
  ));

  activateSudokuPath$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActiveSudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) => {
      if (!!sdk) {
        this._location.go(`/lab/${sdk._id}`);
        saveUserSetting([{ path: `lab.activeSudokuId`, data: sdk._id }]);
      }
      return [SudokuActions.updateDocumentTitle({ data: sdk ? `${sdk._id}` : '' })];
    })
  ));

  openSelectedSudoku$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.openSelectedSudoku),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectSelectedSudoku)),
    filter(([a, sdk]) => !!sdk),
    switchMap(([a, sdk]) => [SudokuActions.setActiveSudoku({ active: sdk?._id||0 })])
  ));

  solveStep$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.solveStep),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      const result = solveStepToCell(sdk, [Algorithms.tryNumber]);
      if (result.length<0) return [];
      const step = _last(result);
      return [
        SudokuActions.highlightCells({ cells: step?.result?.cells } ),
        SudokuActions.updateSudoku({ changes: step?.sdk||{} }),
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
      if (!sdk.options.usePencil) checkAvailable(changes, { resetBefore: true });
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  setValue$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setValue),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku),
      this._store.select(SudokuSelectors.selectActiveCell)),
    filter(([a, sdk, cid]) => !!sdk && isValidValue(a.value, sdk?.sudoku?.rank)),
    switchMap(([a, sdk, cid]) => {
      const actions: Action[] = [];
      const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
      const cell = changes.cells[cid];
      if (!cell || cell.fixed) return [];
      const prev = cell.value;
      let value = (a.value||'').trim();
      if (value === 'Delete') value = '';
      if (!!sdk?.options.usePencil) {
        cell.value = '';
        if (!value) {
          cell.pencil = [];
        } else {
          cell.pencil = toggleValue(cell.pencil, value);
        }
        if (!!prev && cell.value !== prev) {
          actions.push(SudokuActions.calcAvailables({ reset: true }));
        }
      } else {
        cell.pencil = [];
        cell.value = (value || '').trim();
        actions.push(SudokuActions.calcAvailables({ reset: (!!prev && cell.value !== prev) }));
      }
      return [
        SudokuActions.updateSudoku({ changes }),
        ...actions,
      ];
    })
  ));

  calcAvailables$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.calcAvailables),
    debounceTime(250),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
      if (a.reset) resetAvailable(changes);
      checkAvailable(changes);
      return [
        SudokuActions.updateSudoku({ changes }),
        SudokuActions.checkState()];
    })
  ))

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
        schema.info = buildSudokuInfo(schema, { unique: true, algorithms: result.unique.algorithms }, true);
        return [
          SudokuActions.updateSudoku({ changes: { _id: schema._id, sudoku: schema } }),
          SudokuActions.checkSudoku({ schema })];
      } else if (result.multiple) {
        const sudoku: Sudoku = <Sudoku>_clone(result.solutions[0].sdk.sudoku);
        sudoku.info = new SudokuInfo({
          rank: sudoku.rank,
          fixedCount: calcFixedCount(sudoku.fixed)
        });
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
      const info = new SudokuInfo({
        rank: sdk?.sudoku?.rank,
        fixedCount: calcFixedCount(sdk?.sudoku?.fixed)
      });
      const result = solver.solve();
      if (result.unique) {
        console.log(...SDK_PREFIX, 'schema uniq solved', result);
        const schema = result.unique.sdk.sudoku;
        message = new SudokuMessage({
          message: 'Sudoku successfully solved!',
          type: MessageType.success
        });
        const output: Action[] = [SudokuActions.updateSudoku({ changes: result.unique.sdk })];
        if (!!schema) {
          schema.info = buildSudokuInfo(schema, { unique: true, algorithms: result.unique.algorithms }, true);
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
      console.log(...SDK_PREFIX, 'no valid result', result);
      return [SudokuActions.setActiveMessage({ message })];
    })
  ));

  dowloadSchema$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.dowloadSchema),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    map(([a, sdk]) => {
      const schema: Sudoku = new Sudoku({
        fixed: sdk?.sudoku?.fixed || '',
        info: new SudokuInfo(sdk?.sudoku?.info)
      });
      const filename = getSchemaName(schema);
      const schema_str = JSON.stringify(schema, null, 2);
      const blob = new Blob([schema_str], { type: "application/json;" });
      saveAs(blob, `${filename}.json`);
    })
  ), { dispatch: false });


  calcLabStatus$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage, SudokuActions.setActiveSudoku, SudokuActions.checkStatus),
    delay(250),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku), this._board.sdk$),
    map(([a, sdk, wsdk]) => this._board.isWorkerAvailable ? wsdk : sdk),
    concatMap((sdk) =>
      [SudokuActions.updatePageStatus({
        status: {
          has_no_lab_schema: !sdk,
          has_no_try_schema: !sdk?.sudoku?.info?.useTryAlgorithm,
          not_available_camera: !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices,
          available_visible: !!sdk?.options?.showAvailables
        }
      })])
  ));

  stepInfo$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.stepInfo),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) => {
      const infos = solveStepToCell(sdk, [Algorithms.tryNumber])
      return [SudokuActions.setStepInfo({ infos })];
    })
  ));

  updatePlayerOptions$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.updatePlayerOptions),
    withLatestFrom(this._store.select(SudokuSelectors.selectActiveSudoku)),
    concatMap(([a, sdk]) => {
      if (!sdk) return [];
      const changes = { _id: sdk._id, options: _clone(sdk.options) };
      _extend(changes.options, a.changes);
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  saveUserSettings$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.saveUserSettings, SudokuActions.updateSchemasOptions),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSchemasOptions),
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    map(([a, options, sdk]) => {
      const changes: SettingsChanges[] = [{ path: 'lab.schemasOptions', data: options }];
      if (sdk) changes.push({ path: `lab.activeSudoku.${sdk._id}`, data: getSudokuForUserSettings(sdk) });
      saveUserSetting(changes);
    })
  ), { dispatch: false });

  copyAvailableToPencil$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.copyAvailableToPencil),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => {
      if (!sdk) return [];
      const changes = { _id: sdk._id, cells: _clone(sdk.cells) };
      _forEach(changes.cells, c => c ? c.pencil = _clone(c.availables) : null);
      return [SudokuActions.updateSudoku({ changes })];
    })
  ));

  toggleAvailable$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.toggleAvailable),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => [
      SudokuActions.updatePlayerOptions({ changes: { showAvailables: !sdk?.options?.showAvailables } }),
      SudokuActions.checkStatus()])
  ));

  togglePopupDetails$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.togglePopupDetails),
    withLatestFrom(
      this._store.select(SudokuSelectors.selectActiveSudoku)),
    switchMap(([a, sdk]) => [
      //SudokuActions.updatePlayerOptions({ changes: { showPopupDetails: !sdk?.options?.showPopupDetails } }),
      SudokuActions.checkStatus()])
  ));

  constructor(private _actions$: Actions,
              private _location: Location,
              private _router: Router,
              private _store: Store<SudokuStore>,
              @Inject(BOARD_DATA) private _board: BoardData) {
    _board.sdk$.subscribe(() => _store.dispatch(SudokuActions.checkStatus()));
  }
}

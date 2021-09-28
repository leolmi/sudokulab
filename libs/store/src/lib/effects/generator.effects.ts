import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { concatMap, debounceTime, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { SudokuStore } from '../sudoku-store';
import * as GeneratorActions from '../actions';
import * as SudokuActions from '../actions';
import * as GeneratorSelectors from '../selectors';
import {
  cellId,
  checkNumbers,
  EditSudoku,
  EditSudokuOptions,
  geEditFixedCount,
  Generator,
  GeneratorFacade,
  getSchemaName,
  getValues,
  isValidGeneratorValue,
  moveOnDirection,
  saveUserSetting,
  Sudoku,
  SUDOKU_DYNAMIC_VALUE,
  SudokulabPagesService
} from '@sudokulab/model';
import { cloneDeep as _clone, forEach as _forEach } from 'lodash';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable()
export class GeneratorEffects {

  setActiveCell$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.setActiveGeneratorCellRequest),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema),
      this._store.select(GeneratorSelectors.selectActiveGeneratorCell)),
    switchMap(([a, sch, id]) => {
      const output: Action[] = [GeneratorActions.setActiveGeneratorCell({ id: a.id })]
      const cell = sch.cells[a.id];
      const value = (!!cell?.value) ? ' ' : SUDOKU_DYNAMIC_VALUE;
      if (!!id) output.push(GeneratorActions.setGeneratorValue({ value }));
      return output;
    })
  ))

  setValue$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.setGeneratorValue),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema),
      this._store.select(GeneratorSelectors.selectActiveGeneratorCell)),
    filter(([a, sch, cid]) => !!sch && isValidGeneratorValue(sch, a.value)),
    switchMap(([a, sch, cid]) => {
      const changes: EditSudoku = <EditSudoku>_clone(sch || {});
      const cell = changes.cells[cid];
      if (!cell) return [];
      let value = a.value;
      if (value === 'Delete') value = '';
      cell.value = (value||'').trim();
      cell.fixed = !!cell.value;
      changes.fixedCount = geEditFixedCount(changes);
      return [
        GeneratorActions.updateGeneratorSchema({ changes }),
        GeneratorActions.checkGeneratorState()];
    })
  ));

  move$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.moveGenerator),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema),
      this._store.select(GeneratorSelectors.selectActiveGeneratorCell)),
    switchMap(([a, sch, cell]) => {
      if (!a?.direction || !cell || !sch) return [];
      const info = moveOnDirection(cell, sch?.options, a.direction);
      return !!info ? [GeneratorActions.setActiveGeneratorCell({ id: cellId(info.col, info.row) })] : [];
    })
  ));

  stop$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.stopGeneratorRequest),
    switchMap((a) => {
      return [
        GeneratorActions.setGeneratorStatus({ active: false })];
    })
  ));

  clear$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.clearGenerator),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    switchMap(([a, sch]) => {
      const changes: EditSudoku = <EditSudoku>_clone(sch);
      _forEach(changes.cells, (c) => {
        if (!!c) {
          c.value = '';
          c.fixed = false;
        }
      });
      changes.fixedCount = 0;
      changes.fixed = [];
      delete changes.originalSchema;
      return [GeneratorActions.updateGeneratorSchema({ changes })];
    })
  ));

  run$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.setGeneratorStatus),
    filter(a => a.active),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    map(([a, sch]) => {
      const generator = new Generator(sch, this._generator);
      generator.generate();
    })
  ), { dispatch: false });

  download$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.downloadGeneratedSchemas),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectGeneratedSchemas)),
    map(([a, schs]) => {
      // produce lo zip con tutti gli schemi prodotti
      const zip = new JSZip();
      schs.forEach(s => zip.file(`${getSchemaName(s)}.json`, JSON.stringify(s, null, 2)));
      zip.generateAsync({ type: "blob" }).then(content => saveAs(content, `sudokulab-schemas-${Date.now()}.zip`));
    })
  ), { dispatch: false });

  downloadActiveSchema$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.downloadActiveGeneratorSchema),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    map(([a, sdk]) => {
      const sudoku = new Sudoku({
        fixed: getValues(sdk),
        rank: sdk.options.rank
      })
      const json = JSON.stringify(sudoku, null, 2);
      const blob = new Blob([json], {type: "application/json;"});
      saveAs(blob, `${getSchemaName(sudoku)}.json`);
    })
  ), { dispatch: false });

  openInLab$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.openSchemaInLab),
    switchMap((a) => {
      const page = this._pages.pages.find(p => p.code === 'lab');
      return [
        GeneratorActions.loadSudoku({ sudoku: a.schema }),
        GeneratorActions.setActivePage({ page })
      ];
    })
  ));

  addSchema$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.addSchema),
    concatMap((a) => {
      if (('Notification' in window)) {
        if (Notification.permission === 'granted') {
          this._buildNotification(a.schema);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') this._buildNotification(a.schema);
          });
        }
      }
      return [SudokuActions.checkSudoku({ schema: a.schema })];
    })
  ));

  calcGeneratorStatus$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.addSchema, GeneratorActions.clearGeneratedSchemas, GeneratorActions.setActivePage),
    withLatestFrom(this._store.select(GeneratorSelectors.selectGeneratedSchemas)),
    concatMap(([a, schemas]) =>
      [GeneratorActions.updatePageStatus({ status: { has_no_schemas: (schemas||[]).length<=0 } })])
  ));

  loadGeneratorSchema$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.loadGeneratorSchema),
    switchMap((a) => {
      const changes: EditSudoku = new EditSudoku({
        options: new EditSudokuOptions({ rank: a.schema.rank })
      });
      changes.load(a.schema.fixed);
      return [GeneratorActions.updateGeneratorSchema({ changes })];
    })
  ));

  generateSchema$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.generateSchema),
    withLatestFrom(this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    switchMap(([a, schema]) => {
      const changes: EditSudoku = <EditSudoku>_clone(schema);
      checkNumbers(changes);
      return [GeneratorActions.updateGeneratorSchema({ changes })];
    })
  ));

  updateOptions$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.updateGeneratorSchema),
    debounceTime(2000),
    concatMap(() => [GeneratorActions.saveUserSettings()])
  ));

  saveUserSettings$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.saveUserSettings),
    withLatestFrom(this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    map(([a, schema]) => saveUserSetting('generator.schema', schema))
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _generator: GeneratorFacade,
              private _store: Store<SudokuStore>,
              private _pages: SudokulabPagesService) {
  }

  private _buildNotification = (sdk: Sudoku) => {
    var notification = new Notification('A new schema has been generated!', {
      body: getSchemaName(sdk, {
        hideHash: true,
        separator: ' '
      }),
      data: JSON.stringify(sdk, null, 2)
    });
  }
}

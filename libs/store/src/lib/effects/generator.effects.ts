import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { SudokuStore } from '../sudoku-store';
import * as GeneratorActions from '../actions';
import * as GeneratorSelectors from '../selectors';
import {
  cellId,
  EditSudoku, geEditFixedCount,
  Generator,
  GeneratorFacade, getFixedCount, getSchemaName,
  isValidGeneratorValue,
  moveOnDirection, SUDOKU_DYNAMIC_VALUE
} from '@sudokulab/model';
import { cloneDeep as _clone, forEach as _forEach } from 'lodash';
import * as JSZip from 'jszip';
import {saveAs} from "file-saver";

@Injectable()
export class GeneratorEffects {


  // checkGeneratorState$ = createEffect(() => this._actions$.pipe(
  //   ofType(GeneratorActions.checkGeneratorState),
  //   withLatestFrom(this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
  //   switchMap(([a, sch]) => {
  //
  //     return [];
  //   })
  // ));

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

      return [GeneratorActions.setGeneratorStatus({ active: false })];
    })
  ));

  clear$ = createEffect(() => this._actions$.pipe(
    ofType(GeneratorActions.clearGenerator),
    withLatestFrom(
      this._store.select(GeneratorSelectors.selectActiveGeneratorSchema)),
    switchMap(([a, sch]) => {
      const changes = _clone(sch);
      _forEach(changes.cells, (c) => {
        if (!!c) {
          c.value = '';
          c.fixed = false;
        }
      });
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
      schs.forEach(s => zip.file(getSchemaName(s), JSON.stringify(s, null, 2)));
      zip.generateAsync({ type: "blob" }).then(content => saveAs(content, `sudokulab-schemas-${Date.now()}.zip`));
    })
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _generator: GeneratorFacade,
              private _store: Store<SudokuStore>) {
  }
}

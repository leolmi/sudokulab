import {
  LabFacade,
  PlaySudoku,
  SchemasOptions,
  SolveStepResult,
  StepInfo,
  Sudoku,
  SudokuFacade,
  SudokuMessage
} from '@sudokulab/model';
import { BehaviorSubject, Observable } from 'rxjs';
import * as SudokuSelectors from './selectors';
import * as SudokuActions from './actions';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { Injectable } from '@angular/core';
import { selectAllSudoku } from './selectors';

@Injectable()
export class LabContext extends LabFacade {
  selectActiveSudoku$: Observable<PlaySudoku|undefined> = this._store.select(SudokuSelectors.selectActiveSudoku);
  selectActiveCell$: Observable<string> = this._store.select(SudokuSelectors.selectActiveCell);
  selectAllSchemas$: Observable<PlaySudoku[]> = this._store.select(SudokuSelectors.selectAllSudoku);
  selectSchemasOptions$: Observable<SchemasOptions> = this._store.select(SudokuSelectors.selectActiveSchemasOptions);
  selectStepInfo$: Observable<SolveStepResult|undefined> = this._store.select(SudokuSelectors.selectActiveSchemaStepInfo);

  setActiveSudoku(active: number) {
    this._store.dispatch(SudokuActions.setActiveSudoku({ active }));
  }

  setActiveCell(id: string) {
    this._store.dispatch(SudokuActions.setActiveCell({ id }));
  }

  loadSudoku(sudoku: Sudoku) {
    this._store.dispatch(SudokuActions.loadSudoku({ sudoku }));
  }

  applyAlgorithm(algorithm: string) {
    this._store.dispatch(SudokuActions.applyAlgorithm({ algorithm }));
  }

  stepInfo() {
    this._store.dispatch(SudokuActions.stepInfo());
  }

  clearStepInfo() {
    this._store.dispatch(SudokuActions.setStepInfo({}));
  }

  solveStep() {
    this._store.dispatch(SudokuActions.solveStep());
  }

  solve() {
    this._store.dispatch(SudokuActions.solve());
  }

  analyze() {
    this._store.dispatch(SudokuActions.analyze());
  }

  setValue(value: string) {
    this._store.dispatch(SudokuActions.setValue({ value }));
  }

  clear() {
    this._store.dispatch(SudokuActions.clear());
  }

  move(direction: string) {
    this._store.dispatch(SudokuActions.move({ direction }));
  }

  download() {
    this._store.dispatch(SudokuActions.dowloadSchema());
  }

  upload() {
    this._sudoku.upload();
  }

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  updateSchemasOptions(changes: Partial<SchemasOptions>) {
    this._store.dispatch(SudokuActions.updateSchemasOptions({ changes }));
  }

  constructor(private _store: Store<SudokuStore>,
              private _sudoku: SudokuFacade) {
    super();
  }
}

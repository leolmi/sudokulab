import {
  LabFacade,
  PlaySudoku,
  PlaySudokuOptions,
  SchemasOptions,
  SolveStepResult,
  SudokuFacade,
  SudokuMessage
} from '@sudokulab/model';
import {BehaviorSubject, Observable} from 'rxjs';
import * as SudokuSelectors from './selectors';
import * as SudokuActions from './actions';
import {Store} from '@ngrx/store';
import {SudokuStore} from './sudoku-store';
import {Injectable} from '@angular/core';
import {Dictionary} from '@ngrx/entity';

@Injectable()
export class LabContext extends LabFacade {
  selectActiveSudoku$: Observable<PlaySudoku|undefined> = this._store.select(SudokuSelectors.selectActiveSudoku);
  selectSelectedSudoku$: Observable<PlaySudoku|undefined> = this._store.select(SudokuSelectors.selectSelectedSudoku);
  selectActiveCell$: Observable<string> = this._store.select(SudokuSelectors.selectActiveCell);
  selectSchemasOptions$: Observable<SchemasOptions> = this._store.select(SudokuSelectors.selectActiveSchemasOptions);
  selectStepInfos$: Observable<SolveStepResult[]> = this._store.select(SudokuSelectors.selectActiveSchemaStepInfos);
  selectHighlightCells$: Observable<Dictionary<boolean>> = this._store.select(SudokuSelectors.selectHighlightCells);
  schemaChanged$: BehaviorSubject<any>;

  setActiveSudoku(active: number) {
    this._store.dispatch(SudokuActions.setActiveSudoku({ active }));
    this.schemaChanged$.next({});
  }

  setSelectedSudoku(selected: number) {
    this._store.dispatch(SudokuActions.setSelectedSudoku({ selected }));
  }

  setActiveCell(id: string) {
    this._store.dispatch(SudokuActions.setActiveCell({ id }));
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
    this.schemaChanged$.next({});
  }

  solve() {
    this._store.dispatch(SudokuActions.solve());
    this.schemaChanged$.next({});
  }

  analyze() {
    this._store.dispatch(SudokuActions.analyze());
  }

  setValue(value: string) {
    this._store.dispatch(SudokuActions.setValue({ value }));
    this.schemaChanged$.next({});
  }

  clear() {
    this._store.dispatch(SudokuActions.clear());
    this.schemaChanged$.next({});
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

  updatePlayerOptions(changes: Partial<PlaySudokuOptions>) {
    this._store.dispatch(SudokuActions.updatePlayerOptions({ changes }));
  }

  clesrHighlightCells() {
    this._store.dispatch(SudokuActions.highlightCells({}));
  }

  openSelectedSudoku() {
    this._store.dispatch(SudokuActions.openSelectedSudoku());
    this.schemaChanged$.next({});
  }

  camera() {
    this._sudoku.camera();
  }

  copyAvailableToPencil() {
    this._store.dispatch(SudokuActions.copyAvailableToPencil());
  }

  toggleAvailable() {
    this._store.dispatch(SudokuActions.toggleAvailable());
  }

  togglePopupDetails() {
    this._store.dispatch(SudokuActions.togglePopupDetails());
  }

  test() {
    this._sudoku.raiseGenericAction('test');
  }

  constructor(private _store: Store<SudokuStore>,
              private _sudoku: SudokuFacade) {
    super();
    this.schemaChanged$ = new BehaviorSubject<any>(null);
  }
}

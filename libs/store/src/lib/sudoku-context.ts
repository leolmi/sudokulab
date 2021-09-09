import { Injectable } from '@angular/core';
import { PlaySudoku, Sudoku, SudokuFacade, SudokuMessage } from '@sudokulab/model';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { Observable } from 'rxjs';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';

@Injectable()
export class SudokuContext extends SudokuFacade {
  selectActiveSudoku$: Observable<PlaySudoku|undefined> = this._store.select(SudokuSelectors.selectActiveSudoku);
  selectActiveCell$: Observable<string> = this._store.select(SudokuSelectors.selectActiveCell);
  selectActiveMessage$: Observable<SudokuMessage|undefined> = this._store.select(SudokuSelectors.selectActiveMessage);

  setActiveSudoku(active: string) {
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

  solveStep() {
    this._store.dispatch(SudokuActions.solveStep());
  }

  solve() {
    this._store.dispatch(SudokuActions.solve());
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

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

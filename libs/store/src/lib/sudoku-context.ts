import { Injectable } from '@angular/core';
import { PlaySudoku, Sudoku, SudokuFacade } from '@sudokulab/model';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { Observable } from 'rxjs';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';

@Injectable()
export class SudokuContext extends SudokuFacade {
  selectActiveSudoku$: Observable<PlaySudoku|undefined> = this._store.select(SudokuSelectors.selectActiveSudoku);
  setActiveSudoku(active: string) {
    this._store.dispatch(SudokuActions.setActiveSudoku({ active }));
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

  clear() {
    this._store.dispatch(SudokuActions.clear());
  }

  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

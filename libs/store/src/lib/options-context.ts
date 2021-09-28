import { Injectable } from '@angular/core';
import { OptionsFacade, SudokuMessage } from '@sudokulab/model';
import * as SudokuActions from './actions';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';

@Injectable()
export class OptionsContext extends OptionsFacade {

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  reset() {
    this._store.dispatch(SudokuActions.resetOptions());
  }

  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

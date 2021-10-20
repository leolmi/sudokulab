import { Injectable } from '@angular/core';
import { PrintData, PrintFacade, SudokuFacade, SudokuMessage } from '@sudokulab/model';
import * as SudokuActions from './actions';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';

@Injectable()
export class PrintContext extends PrintFacade {

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  setPrintData(data: PrintData) {
    this._store.dispatch(SudokuActions.setPrintData({ data }));
  }

  print() {
    this._store.dispatch(SudokuActions.print());
  }

  constructor(private _store: Store<SudokuStore>,
              private _sudoku: SudokuFacade) {
    super();
  }
}

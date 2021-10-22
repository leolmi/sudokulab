import { Injectable } from '@angular/core';
import { PrintFacade, PrintPage, SudokuFacade, SudokuMessage } from '@sudokulab/model';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { Observable } from 'rxjs';

@Injectable()
export class PrintContext extends PrintFacade {
  selectPrintPages$: Observable<PrintPage[]> = this._store.select(SudokuSelectors.selectPrintPages);
  selectActivePageArea$: Observable<string> = this._store.select(SudokuSelectors.selectActiveArea);

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  setPrintPages(pages: PrintPage[]) {
    this._store.dispatch(SudokuActions.setPrintPages({ pages }));
  }

  setPrintArea(area: string) {
    this._store.dispatch(SudokuActions.setActiveArea({ area }));
  }

  print() {
    this._store.dispatch(SudokuActions.print());
  }

  constructor(private _store: Store<SudokuStore>,
              private _sudoku: SudokuFacade) {
    super();
  }
}

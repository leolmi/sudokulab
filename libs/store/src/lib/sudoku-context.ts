import { Injectable } from '@angular/core';
import {PlaySudoku, Sudoku, SudokuFacade, SudokulabPage, SudokuMessage} from '@sudokulab/model';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { Observable } from 'rxjs';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';

@Injectable()
export class SudokuContext extends SudokuFacade {
  selectActiveMessage$: Observable<SudokuMessage|undefined> = this._store.select(SudokuSelectors.selectActiveMessage);
  selectActivePage$: Observable<SudokulabPage|undefined> = this._store.select(SudokuSelectors.selectActivePage);

  setActivePage(page: SudokulabPage|undefined) {
    if (!!page) this._store.dispatch(SudokuActions.setActivePage({ page }));
  }

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

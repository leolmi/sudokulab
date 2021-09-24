import { Injectable, Type } from '@angular/core';
import { MessageType, PlaySudoku, Sudoku, SudokuFacade, SudokulabPage, SudokuMessage } from '@sudokulab/model';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { BehaviorSubject, Observable } from 'rxjs';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';
import { Dictionary } from '@ngrx/entity';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class SudokuContext extends SudokuFacade {
  selectActiveMessage$: Observable<SudokuMessage|undefined> = this._store.select(SudokuSelectors.selectActiveMessage);
  selectActivePage$: Observable<SudokulabPage|undefined> = this._store.select(SudokuSelectors.selectActivePage);
  selectPageStatus$: Observable<Dictionary<boolean>> = this._store.select(SudokuSelectors.selectPageStatus);
  private _upload$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  setActivePage(page: SudokulabPage|undefined) {
    if (!!page) this._store.dispatch(SudokuActions.setActivePage({ page }));
  }

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  raiseError(err: any) {
    this._store.dispatch(SudokuActions.setActiveMessage({
      message: new SudokuMessage({
        message: JSON.stringify(err),
        type: MessageType.error
      })
    }));
  }

  upload(open = true) {
    this._upload$.next(open);
  }

  onUpload(component: Type<any>, destroyer$: Observable<any>): Observable<Sudoku|any> {
    return this._upload$
      .pipe(
        takeUntil(destroyer$),
        filter(a => !!a && !isAlwaysOpened(this._dialog, component)),
        tap(() => this._upload$.next(false)),
        switchMap(() => {
          return this._dialog
            .open(component, { width: '500px' })
            .afterClosed()
        }));
  }

  constructor(private _store: Store<SudokuStore>,
              private _dialog: MatDialog) {
    super();
  }
}

export const isAlwaysOpened = (dialog: MatDialog, component: any): boolean => {
  return !!(dialog.openDialogs||[]).find(dlg => dlg.componentInstance instanceof component);
}

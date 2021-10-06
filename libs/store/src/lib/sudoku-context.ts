import { Injectable, Type } from '@angular/core';
import {
  isCompact,
  MessageType,
  Sudoku,
  SudokuFacade,
  SudokulabPage,
  SudokulabWindowService,
  SudokuMessage, UploadDialogOptions, UploadDialogResult
} from '@sudokulab/model';
import { Store } from '@ngrx/store';
import { SudokuStore } from './sudoku-store';
import { BehaviorSubject, Observable } from 'rxjs';
import * as SudokuActions from './actions';
import * as SudokuSelectors from './selectors';
import { Dictionary } from '@ngrx/entity';
import { distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class SudokuContext extends SudokuFacade {
  private _isCompact$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(isCompact(this._window));
  private _upload$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  selectActiveMessage$: Observable<SudokuMessage|undefined> = this._store.select(SudokuSelectors.selectActiveMessage);
  selectActivePage$: Observable<SudokulabPage|undefined> = this._store.select(SudokuSelectors.selectActivePage);
  selectPageStatus$: Observable<Dictionary<boolean>> = this._store.select(SudokuSelectors.selectPageStatus);
  selectIsCompact$: Observable<boolean> = this._isCompact$.pipe(distinctUntilChanged());

    fillDocuments() {
    this._store.dispatch(SudokuActions.fillSchemas());
  }

  setActivePage(page: SudokulabPage|undefined, data?: any) {
    if (!!page) this._store.dispatch(SudokuActions.setActivePage({ page, data }));
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

  onUpload(component: Type<any>, destroyer$: Observable<any>, options?: UploadDialogOptions): Observable<UploadDialogResult|any> {
    return this._upload$
      .pipe(
        takeUntil(destroyer$),
        filter(a => !!a && !isAlwaysOpened(this._dialog, component)),
        tap(() => this._upload$.next(false)),
        switchMap(() => {
          return this._dialog
            .open(component, { width: '500px', data: options })
            .afterClosed()
        }));
  }

  checkCompactStatus() {
    this._isCompact$.next(isCompact(this._window));
  }

  saveUserSettings() {
    this._store.dispatch(SudokuActions.saveUserSettings());
  }

  constructor(private _store: Store<SudokuStore>,
              private _dialog: MatDialog,
              private _window: SudokulabWindowService) {
    super();
  }
}

export const isAlwaysOpened = (dialog: MatDialog, component: any): boolean => {
  return !!(dialog.openDialogs||[]).find(dlg => dlg.componentInstance instanceof component);
}

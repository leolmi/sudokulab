import { AfterViewInit, Component, inject, OnDestroy, Type } from '@angular/core';
import { Router } from '@angular/router';
import { filter, Subject } from 'rxjs';
import { SUDOKU_API, SUDOKU_NOTIFIER, SUDOKU_STATE, SUDOKU_STORE } from '@olmi/common';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'page-base',
  template: ''
})
export class PageBase implements OnDestroy, AfterViewInit {
  protected readonly _dialog = inject(MatDialog);
  protected readonly _router = inject(Router);
  protected readonly _destroy$: Subject<void>;
  readonly notifier = inject(SUDOKU_NOTIFIER);
  readonly state = inject(SUDOKU_STATE);
  readonly store = inject(SUDOKU_STORE);
  readonly interaction = inject(SUDOKU_API);

  constructor() {
    this._destroy$ = new Subject<void>();
  }

  ngOnDestroy() {
    this.state.menuHandler = undefined;
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  ngAfterViewInit() {
    this.state.checkState();
  }

  protected openDialog<T>(component: any, handler: (res: T) => void, data?: MatDialogConfig) {
    this._dialog
      .open(component, data)
      .afterClosed()
      .pipe(filter(r => !!r))
      .subscribe(r => handler(<T>r));
  }
}

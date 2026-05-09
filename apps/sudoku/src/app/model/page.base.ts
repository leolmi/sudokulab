import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { SUDOKU_API, SUDOKU_NOTIFIER, SUDOKU_STATE, SUDOKU_STORE } from '@olmi/common';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

/**
 * Base class per le page component dell'applicazione.
 * Espone in lettura `state`, `store`, `notifier`, `interaction` e fornisce
 * `_destroyRef` per ancorare le sottoscrizioni Rx con `takeUntilDestroyed`.
 * Niente `_destroy$`: il pattern Subject+ngOnDestroy è stato sostituito da
 * `DestroyRef.onDestroy(...)`.
 */
@Component({
  standalone: true,
  selector: 'page-base',
  template: ''
})
export class PageBase {
  protected readonly _dialog = inject(MatDialog);
  protected readonly _router = inject(Router);
  protected readonly _destroyRef = inject(DestroyRef);
  readonly notifier = inject(SUDOKU_NOTIFIER);
  readonly state = inject(SUDOKU_STATE);
  readonly store = inject(SUDOKU_STORE);
  readonly interaction = inject(SUDOKU_API);

  constructor() {
    this._destroyRef.onDestroy(() => {
      this.state.menuHandler = undefined;
    });
  }

  protected openDialog<T>(component: any, handler: (res: T) => void, data?: MatDialogConfig) {
    this._dialog
      .open(component, data)
      .afterClosed()
      .pipe(filter(r => !!r), takeUntilDestroyed(this._destroyRef))
      .subscribe(r => handler(<T>r));
  }
}

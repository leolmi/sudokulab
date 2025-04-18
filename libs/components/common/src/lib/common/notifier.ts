import { inject, InjectionToken } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NotificationType } from '@olmi/model';

export class Notifier {
  private readonly _snack: MatSnackBar;

  constructor() {
    this._snack = inject(MatSnackBar);
  }

  /**
   * mostra la notifica
   * @param message
   * @param type
   * @param o
   */
  notify(message: string, type = NotificationType.info, o?: Partial<MatSnackBarConfig>) {
    this._snack.open(message, '', {
      ...o,
      duration: o?.duration||3000,
      panelClass: o?.panelClass||`type-${type}`
    })
  }
}

export const SUDOKU_NOTIFIER = new InjectionToken<Notifier>('SUDOKU_NOTIFIER');

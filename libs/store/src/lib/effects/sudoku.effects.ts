import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import * as SudokuActions from '../actions';
import {map} from 'rxjs/operators';
import {Router} from "@angular/router";

@Injectable()
export class SudokuEffects {

  activePage$ = createEffect(() => this._actions$.pipe(
    ofType(SudokuActions.setActivePage),
    map(a => this._router.navigate([`${a.page?.code}`]))
  ), { dispatch: false });

  constructor(private _actions$: Actions,
              private _router: Router) {
  }
}

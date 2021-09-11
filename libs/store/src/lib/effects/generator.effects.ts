import {Injectable} from "@angular/core";
import {Actions} from "@ngrx/effects";
import {Store} from "@ngrx/store";
import {SudokuStore} from "../sudoku-store";

@Injectable()
export class GeneratorEffects {


  constructor(private _actions$: Actions,
              private _store: Store<SudokuStore>) {
  }
}

import {Injectable} from "@angular/core";
import {GeneratorFacade} from "@sudokulab/model";
import {Observable, of} from "rxjs";
import {Store} from "@ngrx/store";
import {SudokuStore} from "./sudoku-store";

@Injectable()
export class GeneratorContext extends GeneratorFacade {
  selectActiveCell$: Observable<any> = of({});
  selectActiveSudoku$: Observable<any> = of({});

  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

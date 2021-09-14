import {Injectable} from "@angular/core";
import {EditSudoku, GeneratorFacade} from "@sudokulab/model";
import {Observable, of} from "rxjs";
import {Store} from "@ngrx/store";
import {SudokuStore} from "./sudoku-store";
import * as GeneratorSelectors from './selectors';

@Injectable()
export class GeneratorContext extends GeneratorFacade {
  selectActiveCell$: Observable<any> = this._store.select(GeneratorSelectors.selectActiveGeneratorCell);
  selectActiveSudoku$: Observable<EditSudoku> = this._store.select(GeneratorSelectors.selectActiveGeneratorSchema);


  constructor(private _store: Store<SudokuStore>) {
    super();
  }
}

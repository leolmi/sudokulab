import {Injectable} from "@angular/core";
import { EditSudoku, EditSudokuOptions, GeneratorFacade, Sudoku } from '@sudokulab/model';
import {Observable, of} from "rxjs";
import {Store} from "@ngrx/store";
import {SudokuStore} from "./sudoku-store";
import * as GeneratorSelectors from './selectors';
import * as GeneratorActions from './actions';
import { addSchema, setActiveGeneratorCellRequest } from './actions';

@Injectable()
export class GeneratorContext extends GeneratorFacade {
  selectActiveCell$: Observable<any> = this._store.select(GeneratorSelectors.selectActiveGeneratorCell);
  selectActiveSudoku$: Observable<EditSudoku> = this._store.select(GeneratorSelectors.selectActiveGeneratorSchema);
  selectGeneratorIsRunning$: Observable<boolean> = this._store.select(GeneratorSelectors.selectActiveGeneratorIsRunning);
  selectGeneratorIsStopping$: Observable<boolean> = this._store.select(GeneratorSelectors.selectGeneratorIsStopping);
  selectGeneratorSchemas$: Observable<Sudoku[]> = this._store.select(GeneratorSelectors.selectGeneratedSchemas);

  constructor(private _store: Store<SudokuStore>) {
    super();
  }

  setActiveCell(id: string) {
    this._store.dispatch(GeneratorActions.setActiveGeneratorCellRequest({ id }));
  }

  setValue(value: string) {
    this._store.dispatch(GeneratorActions.setGeneratorValue({ value }));
  }

  move(direction: string) {
    this._store.dispatch(GeneratorActions.moveGenerator({ direction }));
  }

  updateGeneratorOptions(options: EditSudokuOptions) {
    this._store.dispatch(GeneratorActions.updateGeneratorSchema({ changes: { options } }));
  }

  run() {
    this._store.dispatch(GeneratorActions.setGeneratorStatus({ active: true }));
  }

  addSchema(schema: Sudoku) {
    this._store.dispatch(GeneratorActions.addSchema({ schema }));
  }

  stop() {
    this._store.dispatch(GeneratorActions.stopGeneratorRequest());
  }

  clear() {
    this._store.dispatch(GeneratorActions.clearGenerator());
  }

  download() {
    // TODO: ...
  }

  upload() {
    // TODO: ...
  }
}

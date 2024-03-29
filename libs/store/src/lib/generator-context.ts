import {Inject, Injectable} from '@angular/core';
import {
  EditSudoku,
  EditSudokuOptions,
  GENERATOR_DATA,
  GeneratorAction,
  GeneratorData,
  GeneratorFacade,
  Sudoku,
  SudokuFacade,
  SudokuMessage,
  WorkingInfo
} from '@sudokulab/model';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {SudokuStore} from './sudoku-store';
import * as GeneratorSelectors from './selectors';
import * as GeneratorActions from './actions';
import * as SudokuActions from './actions';

@Injectable()
export class GeneratorContext extends GeneratorFacade {
  selectActiveCell$: Observable<any> = this._store.select(GeneratorSelectors.selectActiveGeneratorCell);
  selectActiveSudoku$: Observable<EditSudoku> = this._store.select(GeneratorSelectors.selectActiveGeneratorSchema);
  selectGeneratorIsRunning$: Observable<boolean> = this._store.select(GeneratorSelectors.selectActiveGeneratorIsRunning);
  selectGeneratorIsStopping$: Observable<boolean> = this._store.select(GeneratorSelectors.selectGeneratorIsStopping);
  selectGeneratorSchemas$: Observable<Sudoku[]> = this._store.select(GeneratorSelectors.selectGeneratedSchemas);
  selectGeneratorWorkingInfo$: Observable<WorkingInfo|undefined> = this._store.select(GeneratorSelectors.selectGeneratorWorkingInfo);

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
    this._generator.action$.next(GeneratorAction.run);
    this._store.dispatch(GeneratorActions.setGeneratorStatus({ active: true }));
  }

  end() {
    this._store.dispatch(GeneratorActions.setGeneratorStatus({ active: false }));
    this._store.dispatch(GeneratorActions.setWorkingInfo({ info: undefined }));
  }

  addSchema(schema: Sudoku) {
    this._store.dispatch(GeneratorActions.addSchema({ schema }));
  }

  stop() {
    this._generator.action$.next(GeneratorAction.stop);
    this._store.dispatch(GeneratorActions.stopGeneratorRequest());
  }

  clear() {
    this._generator.action$.next(GeneratorAction.clear);
    this._store.dispatch(GeneratorActions.clearGenerator());
  }

  download() {
    this._generator.action$.next(GeneratorAction.download);
    this._store.dispatch(GeneratorActions.downloadActiveGeneratorSchema());
  }

  raiseMessage(message: SudokuMessage) {
    this._store.dispatch(SudokuActions.setActiveMessage({ message }));
  }

  openInLab(schema: Sudoku) {
    this._generator.action$.next(GeneratorAction.openInLab);
    this._store.dispatch(SudokuActions.openSchemaInLab({ schema }));
  }

  setWorkingInfo(info: WorkingInfo) {
    this._store.dispatch(SudokuActions.setWorkingInfo({ info }));
  }

  downloadAll() {
    this._generator.action$.next(GeneratorAction.downloadAll);
    this._store.dispatch(GeneratorActions.downloadGeneratedSchemas());
  }

  removeAll() {
    this._generator.action$.next(GeneratorAction.removeAll);
    this._store.dispatch(GeneratorActions.clearGeneratedSchemas());
  }

  upload() {
    this._generator.action$.next(GeneratorAction.upload);
    this._sudoku.upload();
  }

  generate() {
    this._generator.action$.next(GeneratorAction.generate);
    this._store.dispatch(GeneratorActions.generateSchema());
  }

  constructor(private _store: Store<SudokuStore>,
              private _sudoku: SudokuFacade,
              @Inject(GENERATOR_DATA) private _generator: GeneratorData) {
    super();
  }
}

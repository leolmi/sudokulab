import { SudokuState } from './reducers/sudoku.reducers';
import { LabState } from './reducers/lab.reducers';
import { GeneratorState } from './reducers/generator.reducers';
import { PrintState } from './reducers/print.reducers';

export interface SudokuStore {
  sudoku: SudokuState,
  lab: LabState,
  generator: GeneratorState,
  print: PrintState
}

import { SudokuState } from './reducers/sudoku.reducers';
import {LabState} from "./reducers/lab.reducers";
import {GeneratorState} from "./reducers/generator.reducers";

export interface SudokuStore {
  sudoku: SudokuState,
  lab: LabState,
  generator: GeneratorState
}

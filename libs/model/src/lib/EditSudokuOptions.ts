import { SudokuEndGenerationMode, SudokuValorizationMode, SudokuSymmetry } from './enums';
import {SUDOKU_DEFAULT_RANK} from "./consts";

export class EditSudokuOptions {
  constructor(o?: Partial<EditSudokuOptions>) {
    Object.assign(this, o || {});
    if ((this.maxSchemaCycles || 0) < 1) this.maxSchemaCycles = 1;
    if ((this.maxSplitSchema || 0) < 10) this.maxSplitSchema = 10;
    if ((this.maxValueCycles || 0) < 10) this.maxValueCycles = 10;
    if ([4, 9, 16].indexOf(this.rank || 0) < 0) this.rank = 9;
  }

  rank = SUDOKU_DEFAULT_RANK;
  unique = true;
  symmetry = SudokuSymmetry.horizontal;
  fixedCount = 24;
  updateGeometry = true;
  excludeTryAlgorithm = true;
  generationEndMode = SudokuEndGenerationMode.afterN;
  generationEndValue = 1;
  valorizationMode = SudokuValorizationMode.random;
  minDiff = 0;
  maxDiff = 1000000;
  maxSplitSchema = 500;
  maxSchemaCycles = 100;
  maxValueCycles = 1000;
}

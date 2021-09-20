import {EditSudokuEndGenerationMode, SudokuSymmetry} from "./enums";

export class EditSudokuOptions {
  constructor(o?: Partial<EditSudokuOptions>) {
    Object.assign(this, o || {});
  }
  rank = 9;
  unique = true;
  simmetry = SudokuSymmetry.none;
  fixedCount = 24;
  updateGeometry = true;
  excludeTryAlgorithm = true;
  generationEndMode = EditSudokuEndGenerationMode.afterN;
  generationEndValue = 1;
  minDiff = 0;
  maxDiff = 1000000;
}

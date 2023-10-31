import {Sudoku, SudokuData} from "@sudokulab/model";

/**
 * opzioni di import
 */
export class ImportOptions {
  constructor(o?: Partial<ImportOptions>) {
    Object.assign(this,o || {});
  }
  sdk?: Sudoku;
  image?: string;
  onlyValues?: boolean;
  context?: SudokuData<any>;
  editOnGrid?: boolean;
  allowImages?: boolean;
  allowEditOnGrid?: boolean;
  allowOnlyValues?: boolean;
}

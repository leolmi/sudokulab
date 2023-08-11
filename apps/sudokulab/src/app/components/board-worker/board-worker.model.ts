import {BoardAction, PlaySudoku, SudokuMessage} from "@sudokulab/model";

export interface BoardWorkerData {
  sdk?: PlaySudoku;
  message?: SudokuMessage;
  highligths?: any;
}

export interface BoardWorkerArgs {
  sdk?: PlaySudoku;
  action?: BoardAction;
  value?: string;
  cellId?: string;
  timeout?: number;
}

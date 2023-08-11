import {AlgorithmResultLine, BoardAction, PlaySudoku, SolveStepResult, SudokuMessage} from "@sudokulab/model";
import {Dictionary} from "@ngrx/entity";

export class BoardWorkerHighlights {
  constructor() {
    this.cell = {};
    this.cellValue = {};
    this.others = {};
  }

  cell: Dictionary<boolean>;
  cellValue: Dictionary<boolean>;
  others: Dictionary<boolean>;

  static get empty() {
    return new BoardWorkerHighlights();
  }
}

export interface BoardWorkerData {
  sdk?: PlaySudoku;
  message?: SudokuMessage;
  highlights?: BoardWorkerHighlights;
  infos?: SolveStepResult[];
}

export interface BoardWorkerArgs {
  sdk?: PlaySudoku;
  action?: BoardAction;
  value?: string;
  cellId?: string;
  timeout?: number;
  info?: AlgorithmResultLine;
}

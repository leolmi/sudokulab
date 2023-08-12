import {AlgorithmResultLine, BoardAction, PlaySudoku, SolveStepResult, SudokuMessage} from "@sudokulab/model";
import {Dictionary} from "@ngrx/entity";

export const BOARD_WORKER_USER_DATA_KEY = 'SUDOKULAB_WBOARD_USERDATA';

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

/**
 * dati di cella
 */
export interface CellData {
  pencil?: string[];
  value?: string;
}

/**
 * dati di schema persistiti per utente
 */
export interface SchemaData {
  cells?: Dictionary<CellData>;
  options?: any;
}

/**
 * dati utente sulle modifiche agli schemi
 */
export class BoardUserData {
  constructor(d?: Partial<BoardUserData>) {
    this.schema = {};
    Object.assign(this, d || {});
  }
  schema: Dictionary<SchemaData>;
}
